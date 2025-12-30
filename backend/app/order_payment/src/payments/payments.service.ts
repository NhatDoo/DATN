import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { GenericService } from '@shared/core/generic.service';
import { PrismaService } from '../prisma.service';
import { PaymentProducerService } from './payments-producer.service';
import { Prisma, payments } from '.prisma/order_payment_client';


@Injectable()
export class PaymentsService extends GenericService<payments, Prisma.paymentsDelegate> {

  constructor(private prisma: PrismaService, private paymentProducer: PaymentProducerService,) {
    super(prisma.payments);
  }


  async handlePaymentResult(orderId: string, status: 'paid' | 'failed' | 'canceled', query: any) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Kiểm tra tồn tại
      const payment = await tx.payments.findFirst({
        where: { order_id: orderId },
      });
      if (!payment) {
        throw new BadRequestException('Payment not found for order');
      }

      // 2. Cập nhật ATOMIC (Chỉ update nếu status đang là 'pending')
      // Điều này ngăn chặn Race Condition giữa Redirect và Cron Job
      const updatePayload = {
        status,
        completed_at: new Date(),
        raw_response: query,
      };

      const updateResult = await tx.payments.updateMany({
        where: {
          order_id: orderId,
          status: 'pending', // 🔒 Khóa: chỉ cho phép update khi đang pending
        },
        data: updatePayload,
      });

      // Nếu không có bản ghi nào được update -> Nghĩa là giao dịch đã được xử lý bởi luồng khác rồi
      if (updateResult.count === 0) {
        console.warn(`⚠️ [IDEMPOTENCY] Payment for Order ${orderId} already processed (Status not pending). Local update ignored.`);
        return;
      }

      // 3. Cập nhật trạng thái Order tương ứng
      await tx.orders.updateMany({
        where: { id: payment.order_id },
        data: { status },
      });

      // 4. Nếu thành công -> Bắn event (chỉ làm 1 lần duy nhất nhờ check ở bước 2)
      if (status === 'paid') {
        const order = await tx.orders.findUnique({
          where: { id: payment.order_id },
        });

        if (!order) {
          throw new BadRequestException('Order not found for payment');
        }

        const orderItems = await tx.order_items.findMany({
          where: { order_id: payment.order_id },
          select: { course_id: true },
        });

        const courseIds = orderItems.map((item) => item.course_id);

        // Gửi event sang Enrollment service
        await this.paymentProducer.emitPaymentSuccess(order.id, order.user_id, courseIds);
      }
    });
  }
}
