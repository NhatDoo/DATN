import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { VNPay, ProductCode, VnpLocale, HashAlgorithm } from 'vnpay';
import crypto from 'crypto';
import { PrismaService } from '../prisma.service';
import { vnpay_transactions, Prisma, payments } from '.prisma/order_payment_client';
import { PaymentsService } from '../payments/payments.service';
import { PaymentProducerService } from 'src/payments/payments-producer.service';
import { v4 as uuidv4 } from 'uuid';

import moment from 'moment';
import axios from 'axios';
import { GenericService } from '@shared/core/generic.service';

@Injectable()
export class VnpayPaymentsService extends GenericService<vnpay_transactions, Prisma.vnpay_transactionsDelegate> {
  private readonly vnpay: VNPay;


  private readonly vnp_TmnCode: string;
  private readonly vnp_SecureSecret: string;
  private readonly vnp_ApiUrl = 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction';


  constructor(
    private prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
    private readonly paymentProducerService: PaymentProducerService,
    private readonly configService: ConfigService,
  ) {
    super(prisma.vnpay_transactions);

    this.vnp_TmnCode = this.configService.get<string>('VNP_TMN_CODE') || '';
    this.vnp_SecureSecret = this.configService.get<string>('VNP_HASH_SECRET') || '';

    this.vnpay = new VNPay({
      tmnCode: this.vnp_TmnCode,
      secureSecret: this.vnp_SecureSecret, // 🔁 secret key
      vnpayHost: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      testMode: true,
      hashAlgorithm: HashAlgorithm.SHA512, // ✅ dùng chuẩn SHA512
    });

  }

  // Hàm lấy thời gian định dạng chuẩn VNPAY
  private getFormattedDate() {
    return Number(moment().format('YYYYMMDDHHmmss'));
  }


  async createPaymentUrl(query: any) {
    try {
      const orderId = (query.orderId || uuidv4()).trim();
      const attemptKey = crypto.randomBytes(4).toString('hex');
      const amount = Number(query.amount); // VNPAY yêu cầu *100
      const vnpTxnRef = `${orderId}_${attemptKey}`;
      const orderInfo = query.orderInfo || `Thanh toán đơn hàng ${orderId}`;
      const ipAddr = query.ipAddr || '127.0.0.1';
      const returnUrl =
        query.returnUrl || 'http://localhost:3002/vnpay-payments/vnpay-return';

      await this.prisma.payments.create({
        data: {
          order_id: orderId,
          amount_bigint: BigInt(amount),
          currency: 'VND',
          provider: 'vnpay',
          status: 'pending',
          metadata: { attempt_key: attemptKey },
        },
      });

      const paymentUrl = this.vnpay.buildPaymentUrl({
        vnp_Amount: amount,
        vnp_IpAddr: ipAddr,
        vnp_TxnRef: vnpTxnRef,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: ProductCode.Other,
        vnp_ReturnUrl: returnUrl,
        vnp_Locale: VnpLocale.VN,
        vnp_CreateDate: this.getFormattedDate(),
      });

      return { success: true, paymentUrl };
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Lỗi tạo URL thanh toán',
        error: error.message,
      });
    }
  }

  /**
   * Tạo hash SHA512 thủ công (dùng cho truy vấn giao dịch)
   */
  private genSecureHash(data: Record<string, any>, secret: string): string {
    const sorted = Object.keys(data)
      .sort()
      .reduce((acc, key) => ({ ...acc, [key]: data[key] }), {});
    const querystring = Object.keys(sorted)
      .map((k) => `${k}=${sorted[k]}`)
      .join('&');

    return crypto.createHmac('sha512', secret).update(querystring).digest('hex');
  }

  /**
   * Gửi truy vấn kiểm tra giao dịch đến VNPAY
   */
  async queryTransaction(dto: any) {
    try {
      const ipAddr = dto.ipAddr || '127.0.0.1';
      const dataQuery = {
        vnp_Version: '2.1.0',
        vnp_TmnCode: 'GBZ59K2C',
        vnp_RequestId: uuidv4(),
        vnp_TransactionType: '02', // QueryDr
        vnp_TxnRef: dto.orderId || uuidv4(),
        vnp_TransactionNo: dto.transactionNo || '0',
        vnp_TransactionDate: dto.transactionDate || this.getFormattedDate(),
        vnp_CreateBy: dto.createBy || 'system_user',
        vnp_CreateDate: this.getFormattedDate(),
        vnp_IpAddr: ipAddr,
        vnp_OrderInfo: dto.orderInfo || 'Truy vấn giao dịch đơn hàng',
      };

      // ✅ Tạo chữ ký bảo mật
      const secureHash = this.genSecureHash(
        dataQuery,
        this.vnp_SecureSecret,
      );
      dataQuery['vnp_SecureHash'] = secureHash;

      // ✅ Gửi yêu cầu đến API sandbox của VNPAY
      const response = await axios.post(
        'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
        dataQuery,
      );

      return { success: true, data: response.data };
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Lỗi khi gửi yêu cầu đến VNPAY',
        error: error.message,
      });
    }
  }
  /**
   * Xác minh dữ liệu trả về từ VNPAY sau khi thanh toán
   */
  async handleVnpayReturn(query: any) {
    try {
      const verify = this.vnpay.verifyReturnUrl(query);

      // ✅ Tách orderId và key từ vnp_TxnRef
      const [orderId, attemptKey] = query.vnp_TxnRef.split('_');
      if (!/^[0-9a-fA-F-]{36}$/.test(orderId)) {
        throw new BadRequestException(`Invalid order ID in vnp_TxnRef: ${orderId}`);
      }

      const status = verify.isSuccess && query.vnp_ResponseCode === '00' ? 'paid' : 'failed';

      // ✅ Tìm payment tương ứng (nếu có metadata.attempt_key thì thêm vào)
      const payment = await this.prisma.payments.findFirst({
        where: {
          AND: [
            { order_id: orderId },
            {
              OR: [
                { metadata: { path: ['attempt_key'], equals: attemptKey } },
                { metadata: { equals: Prisma.AnyNull } },
              ],
            },
          ],
        },
      });
      if (!payment) {
        throw new InternalServerErrorException('Không tìm thấy payment hợp lệ');
      }
      const payDateString =
        query.vnp_PayDate ||
        query.vnp_PAYDATE ||
        query.vnp_paydate ||
        query.raw_payload?.vnp_PayDate ||
        query.raw_payload?.vnp_PAYDATE;

      const vnp_paydate = payDateString && typeof payDateString === 'string'
        ? moment(payDateString, 'YYYYMMDDHHmmss').toDate()
        : null;


      if (!vnp_paydate) {
        throw new BadRequestException('Không lấy được ngày thanh toán từ VNPAY');
      }

      await this.prisma.$transaction(async (tx) => {
        await this.paymentsService.handlePaymentResult(orderId, status, query);
        await tx.vnpay_transactions.create({
          data: {
            payment_id: payment.id,
            vnp_txnref: query.vnp_TxnRef,
            vnp_transactionno: query.vnp_TransactionNo,
            vnp_amount: query.vnp_Amount ? BigInt(query.vnp_Amount) : null,
            vnp_bankcode: query.vnp_BankCode,
            vnp_paydate: vnp_paydate,
            vnp_responsecode: query.vnp_ResponseCode,
            vnp_securehash: query.vnp_SecureHash,
            raw_payload: query,
          },
        });

        await tx.payment_transactions.create({
          data: {
            payment_id: payment.id,
            type: 'vnpay',
            amount_bigint: query.vnp_Amount ? BigInt(query.vnp_Amount) : null,
            provider_ref: query.vnp_TransactionNo || null,
            status,
            payload: query,
          },
        });
      });
      return {
        success: status === 'paid',
        message: status === 'paid' ? 'Thanh toán thành công' : 'Thanh toán thất bại',
        data: {
          orderId,
          attemptKey,
          vnRef: query.vnp_TxnRef,
          vnMount: Number(query.vnp_Amount),
          amount: Number(query.vnp_Amount) / 100,
          transactionNo: query.vnp_TransactionNo,
          bankCode: query.vnp_BankCode,
          status,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Lỗi xử lý phản hồi từ VNPAY',
        error: error.message,
      });
    }
  }

  async callVnpayRefund(transactionNo: string, amount: number, txnRef: string, transactionDate: string) {
    try {
      const data: Record<string, any> = {
        vnp_RequestId: uuidv4(),
        vnp_Version: '2.1.0',
        vnp_Command: 'refund',
        vnp_TmnCode: this.vnp_TmnCode,
        vnp_TransactionType: '03', // hoặc '02' nếu hoàn toàn phần
        vnp_TxnRef: txnRef,
        vnp_Amount: amount,
        vnp_TransactionNo: transactionNo,
        vnp_TransactionDate: transactionDate,
        vnp_CreateBy: 'system_user',
        vnp_CreateDate: this.getFormattedDate(),
        vnp_IpAddr: '127.0.0.1',
        vnp_OrderInfo: `Hoàn tiền giao dịch ${txnRef}`,
      };

      // ✅ Tạo chuỗi ký đúng format "pipe" | giữa các giá trị
      const signData = [
        data.vnp_RequestId,
        data.vnp_Version,
        data.vnp_Command,
        data.vnp_TmnCode,
        data.vnp_TransactionType,
        data.vnp_TxnRef,
        data.vnp_Amount,
        data.vnp_TransactionNo ?? '',
        data.vnp_TransactionDate,
        data.vnp_CreateBy,
        data.vnp_CreateDate,
        data.vnp_IpAddr,
        data.vnp_OrderInfo,
      ].join('|');

      const secureHash = crypto
        .createHmac('sha512', this.vnp_SecureSecret)
        .update(signData)
        .digest('hex');

      // console.log('🧾 [VNPAY REFUND] Sign String:', signData);
      // console.log('🔐 [VNPAY REFUND] Generated Hash:', secureHash);

      data['vnp_SecureHash'] = secureHash;

      const response = await axios.post(
        'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
        data, // Gửi JSON, KHÔNG cần URL-encoded
        { headers: { 'Content-Type': 'application/json' } },
      );

      // console.log('📩 [VNPAY REFUND RESPONSE]', response.data);
      const vnpResponse = response.data;
      return {
        success: vnpResponse.vnp_ResponseCode === '00',
        message: vnpResponse.vnp_Message || 'Gửi yêu cầu refund thành công (đang xử lý)',
        data: vnpResponse,
      };


    } catch (err) {
      throw new InternalServerErrorException(`Refund failed: ${(err as any)?.message ?? String(err)}`);
    }
  }
































































  async refundPayment(orderId: string) {
    const payment = await this.prisma.payments.findFirst({
      where: { order_id: orderId, status: 'paid' },
      include: { vnpay_transactions: true },
    });

    if (!payment) throw new BadRequestException('Payment không tồn tại hoặc chưa thanh toán');


    const lastTxn = payment.vnpay_transactions?.slice(-1)[0];
    if (!lastTxn?.vnp_paydate) throw new BadRequestException('Không tìm thấy giao dịch VNPAY');

    // Kiểm tra giới hạn 2 tiếng
    const payDate = moment(lastTxn.vnp_paydate);
    if (moment().diff(payDate, 'hours') > 2) {
      throw new BadRequestException('Đã quá 2 tiếng, không thể refund');
    }

    // Chuẩn bị dữ liệu để gọi refund
    const transactionNo = lastTxn.vnp_transactionno ?? '';
    if (!transactionNo) throw new BadRequestException('Không tìm thấy transactionNo để refund');

    const vnpAmountBigInt = lastTxn.vnp_amount;
    if (vnpAmountBigInt == null) throw new BadRequestException('Không có thông tin số tiền giao dịch để refund');

    // vnp_amount *100 → convert về VND
    const amountVnd = Number(vnpAmountBigInt) / 100;
    console.log('🧾 [REFUND] Last VNPAY Transaction:', lastTxn);
    if (!lastTxn.vnp_txnref) {
      throw new BadRequestException('Không tìm thấy vnp_txnref để refund');
    }
    // Gọi API refund của VNPAY
    const refundResult = await this.callVnpayRefund(
      transactionNo,
      amountVnd,
      lastTxn.vnp_txnref,
      moment(lastTxn.vnp_paydate).format('YYYYMMDDHHmmss'),
    );

    const isSuccess =
      refundResult?.success === true ||
      refundResult?.data?.vnp_ResponseCode === '00';

    if (isSuccess) {
      await this.prisma.$transaction(async (tx) => {
        // Cập nhật payment thành refunded
        await tx.payments.update({
          where: { id: payment.id },
          data: { status: 'refunded', completed_at: new Date() },
        });
        // Lưu transaction refund mới
        await tx.vnpay_transactions.create({
          data: {
            payment_id: payment.id,
            vnp_txnref: refundResult.data.vnp_TxnRef ?? null,
            vnp_transactionno: refundResult.data.vnp_TransactionNo ?? null,
            vnp_amount: BigInt(refundResult.data.vnp_Amount ?? 0),
            vnp_bankcode: refundResult.data.vnp_BankCode ?? null,
            vnp_responsecode: refundResult.data.vnp_ResponseCode ?? null,
            vnp_securehash: refundResult.data.vnp_SecureHash ?? null,
            raw_payload: refundResult.data, // Lưu toàn bộ JSON refundResult.data
          },
        });




        // (tuỳ ý) Xoá order_items liên quan
        // await tx.order_items.deleteMany({
        //   where: { order_id: orderId },
        // });
      });
    }




    if (refundResult?.success === true || refundResult?.data?.vnp_ResponseCode === '00') {
      // 🟢 Refund thành công
      const orderItems = await this.prisma.order_items.findMany({
        where: { order_id: orderId },
        select: { course_id: true },
      });
      const courseIds = orderItems.map(i => i.course_id);

      const payment = await this.prisma.payments.findFirst({
        where: { order_id: orderId, status: 'refunded' },
        include: { vnpay_transactions: true, order: true },
      });


      if (!payment?.order?.user_id) {
        throw new Error('user_id is missing');
      }

      const userId = payment.order.user_id;
      console.log('🔍 payment:', payment);
      console.log('🔍 order_id:', orderId);
      console.log('order item', orderItems)
      console.log('🔍 payment.order:', payment.order);
      console.log('🔍 course:', courseIds);
      console.log('user id ', userId);

      await this.paymentProducerService.emitRefundEnrollment(orderId, userId, courseIds);
    }

    return {
      success: isSuccess,
      message: refundResult?.data?.vnp_Message || 'Refund xử lý không thành công',
      data: refundResult.data,
    };
  }








































  async refundOrderItems(orderId: string, courseIds: string[]) {
    const payments = await this.prisma.payments.findMany({
      where: { order_id: orderId, status: 'paid' },
      include: { vnpay_transactions: true, order: { include: { order_items: true } } },
    });

    if (!payments) throw new BadRequestException('Không tìm thấy payment đã thanh toán.');
    const payment = payments
      .sort((a, b) => {
        const aDate = a.vnpay_transactions[0]?.vnp_paydate || new Date(0);
        const bDate = b.vnpay_transactions[0]?.vnp_paydate || new Date(0);
        return bDate.getTime() - aDate.getTime();
      })[0];

    // ✅ Lấy giao dịch thanh toán gốc (giao dịch đầu tiên)
    // Sắp xếp theo ID tăng dần để đảm bảo lấy đúng giao dịch đầu tiên được tạo
    const sortedTxns = payment.vnpay_transactions.sort((a, b) => new Date(a.received_at).getTime() - new Date(b.received_at).getTime());
    const originalTxn = sortedTxns[0];

    console.log('🧾 [REFUND] Original VNPAY Transaction:', originalTxn);
    if (!originalTxn?.vnp_paydate) throw new BadRequestException('Không có giao dịch VNPAY hợp lệ.');

    // 🕒 Giới hạn refund 2 tiếng
    const payDate = moment(originalTxn.vnp_paydate);
    if (moment().diff(payDate, 'hours') > 2) {
      throw new BadRequestException('Đã quá 2 tiếng, không thể refund.');
    }

    // 💰 Tính tổng tiền refund dựa trên courseIds
    const refundItems = payment.order.order_items.filter(item => courseIds.includes(item.course_id));
    if (refundItems.length === 0) throw new BadRequestException('Không tìm thấy khóa học để refund.');

    const refundAmount = refundItems.reduce((sum, i) => sum + Number(i.price_bigint), 0);

    // 🧾 Gọi API refund tới VNPAY
    const refundResult = await this.callVnpayRefund(
      originalTxn.vnp_transactionno ?? '',
      refundAmount / 100, // vì lưu vnp_amount * 100
      originalTxn.vnp_txnref ?? '',
      moment(originalTxn.vnp_paydate).format('YYYYMMDDHHmmss'),
    );

    const isSuccess =
      refundResult?.success === true || refundResult?.data?.vnp_ResponseCode === '00';

    if (isSuccess) {
      await this.prisma.$transaction(async (tx) => {
        // Lưu giao dịch refund
        await tx.vnpay_transactions.create({
          data: {
            payment_id: payment.id,
            vnp_txnref: refundResult.data.vnp_TxnRef ?? null,
            vnp_transactionno: refundResult.data.vnp_TransactionNo ?? null,
            vnp_amount: BigInt(refundResult.data.vnp_Amount ?? refundAmount),
            vnp_bankcode: refundResult.data.vnp_BankCode ?? null,
            vnp_responsecode: refundResult.data.vnp_ResponseCode ?? null,
            vnp_securehash: refundResult.data.vnp_SecureHash ?? null,
            raw_payload: refundResult.data,
          },
        });

        // Xoá order_items đã refund (hoặc đánh dấu)
        await tx.order_items.deleteMany({
          where: { order_id: orderId, course_id: { in: courseIds } },
        });

        // Kiểm tra xem còn item nào chưa refund không
        const remainingItems = await tx.order_items.count({ where: { order_id: orderId } });
        if (remainingItems === 0) {
          await tx.payments.update({
            where: { id: payment.id },
            data: { status: 'refunded', completed_at: new Date() },
          });
          await tx.orders.update({
            where: { id: orderId },
            data: { status: 'refunded' },
          });
        }
      });

      // 🟢 Emit event refund thành công
      await this.paymentProducerService.emitRefundEnrollment(orderId, payment.order.user_id, courseIds);
    }

    return {
      success: isSuccess,
      refunded_items: courseIds,
      amount: refundAmount,
      message: refundResult?.data?.vnp_Message ?? 'Không thể refund',
      data: refundResult.data,
    };
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkPendingPayments() {
    // console.log('🔄 [CRON] Checking pending VNPAY payments...');

    // 1. Tìm các payment đang pending quá 15 phút
    const timeLimit = moment().subtract(15, 'minutes').toDate();
    const pendingPayments = await this.prisma.payments.findMany({
      where: {
        status: 'pending',
        provider: 'vnpay',
        created_at: { lt: timeLimit },
      },
      take: 20, // Xử lý mỗi lần 20 đơn để tránh quá tải
    });

    if (pendingPayments.length === 0) return;

    console.log(`🔍 Found ${pendingPayments.length} pending payments to check.`);

    for (const payment of pendingPayments) {
      try {
        console.log(`Checking payment status for Order ID: ${payment.order_id}`);

        // 2. Gọi VNPAY để kiểm tra trạng thái thực tế
        const queryResult = await this.queryTransaction({
          orderId: payment.order_id,
          transactionDate: moment(payment.created_at).format('YYYYMMDDHHmmss'),
          ipAddr: '127.0.0.1',
        });

        const vnpData = queryResult.data;

        // 3. Xử lý kết quả trả về
        if (vnpData.vnp_ResponseCode === '00') {
          const vnpStatus = vnpData.vnp_TransactionStatus;

          if (vnpStatus === '00') {
            // 🟢 Đã thanh toán thành công -> Cập nhật thành PAID
            console.log(`✅ Order ${payment.order_id} success on VNPAY -> Updating local status...`);
            await this.paymentsService.handlePaymentResult(payment.order_id, 'paid', vnpData);
          } else if (vnpStatus === '02') {
            // 🔴 Đã thất bại -> Cập nhật thành FAILED
            console.log(`❌ Order ${payment.order_id} failed on VNPAY -> Updating local status...`);
            await this.paymentsService.handlePaymentResult(payment.order_id, 'failed', vnpData);
          } else {
            // Trạng thái khác (ví dụ '01' chưa thanh toán xong) -> Có thể để kệ nó hoặc đánh dấu failed nếu quá lâu
            // Nếu đã quá 24h mà vẫn 01 thì có thể hủy
            if (moment().diff(moment(payment.created_at), 'hours') > 24) {
              await this.paymentsService.handlePaymentResult(payment.order_id, 'canceled', vnpData);
            }
          }
        } else if (vnpData.vnp_ResponseCode === '91') {
          // '91': Không tìm thấy giao dịch (có thể do lỗi tạo đơn bên VNPAY chưa thành công)
          // Nếu quá lâu (ví dụ 1 tiếng) -> Canceled
          if (moment().diff(moment(payment.created_at), 'hours') > 1) {
            await this.paymentsService.handlePaymentResult(payment.order_id, 'canceled', vnpData);
          }
        }
      } catch (err) {
        console.error(`Error checking payment ${payment.order_id}:`, err);
      }
    }
  }

}
