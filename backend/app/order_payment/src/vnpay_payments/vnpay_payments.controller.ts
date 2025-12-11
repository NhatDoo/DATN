import { Controller, Get, Post, Query, Req, Res, Body , BadRequestException , InternalServerErrorException} from '@nestjs/common';
import { VnpayPaymentsService } from './vnpay_payments.service';
import type { Request, Response } from 'express';
import { vnpay_transactions } from '.prisma/order_payment_client';
import { GenericController } from '@shared/core/generic.controller';

@Controller('vnpay-payments')
export class VnpayPaymentsController  extends GenericController<vnpay_transactions, VnpayPaymentsService> {
  constructor(private readonly vnpayPaymentsService: VnpayPaymentsService) {
    super(vnpayPaymentsService);
  }

  /**
   * Tạo URL thanh toán (gọi qua Postman hoặc FE)
   * @example GET /vnpay-payments/create?amount=10000&orderInfo=Thanh+toan+test
   */


@Post('refund')
async refund(@Body('orderId') orderId: string) {
  if (!orderId || typeof orderId !== 'string') {
    throw new BadRequestException('Thiếu hoặc sai định dạng orderId');
  }

  try {
    const result = await this.vnpayPaymentsService.refundPayment(orderId);

    // Lấy object dữ liệu thực từ VNPAY
    const vnpData = result?.data || {};

    // Chuẩn hóa mã phản hồi
    const code =
      vnpData?.RspCode ||
      vnpData?.rspCode ||
      vnpData?.vnp_ResponseCode ||
      vnpData?.vnp_response_code;

    const isSuccess = code === '00' || vnpData?.success === true;

    return {
      success: isSuccess,
      message: isSuccess
        ? 'Hoàn tiền thành công'
        : vnpData?.Message ||
          vnpData?.vnp_Message ||
          result?.message ||
          'Gửi yêu cầu refund thành công (đang xử lý)',
      data: vnpData,
    };
  } catch (error) {
    throw new InternalServerErrorException({
      message: 'Lỗi khi thực hiện hoàn tiền',
      error: (error as any)?.message ?? String(error),
    });
  }
}

  @Post('refund-items')
  async refundOrderItems(
    @Body('orderId') orderId: string,
    @Body('courseIds') courseIds: string[],
  ) {
    if (!orderId || !Array.isArray(courseIds) || courseIds.length === 0) {
      throw new BadRequestException('Thiếu orderId hoặc courseIds.');
    }

    const result = await this.vnpayPaymentsService.refundOrderItems(orderId, courseIds);
    return {
      message: result.message,
      success: result.success,
      refunded_items: result.refunded_items,
      amount: result.amount,
      data: result.data,
    };
  }


  @Get('create')
  createPaymentUrl(@Query() query: any) {
    return this.vnpayPaymentsService.createPaymentUrl(query);
  }


  @Get('vnpay-return')
  async vnpayReturn(@Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.vnpayPaymentsService.handleVnpayReturn(req.query);
      if (result.success) {
        return res.send(`
          <!DOCTYPE html>
          <html lang="vi">
          <head>
            <meta charset="UTF-8">
            <title>Kết quả thanh toán</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="flex items-center justify-center h-screen bg-gray-100">
            <div class="bg-white p-8 rounded shadow-md text-center">
              <h2 class="text-green-600 text-2xl font-semibold mb-4">Thanh toán thành công!</h2>
              <p>Mã đơn hàng: ${result.data.vnRef}</p>
              <p>Số tiền: ${result.data.vnMount / 100} VND</p>
              <a href="http://localhost:4000/course/" class="text-blue-500 mt-4 block">Quay lại trang chủ</a>

            </div>
          </body>
          </html>
        `);
      } else {
        return res.send(`
          <html><body>
            <h1 style="color:red;">Thanh toán thất bại</h1>
            <p>${result.message}</p>
          </body></html>
        `);
      }
    } catch (error) {
      console.error('VNPAY Return Error:', error);
      return res.status(500).send('Lỗi xử lý phản hồi từ VNPAY');
    }
  }

  /**
   * (Tùy chọn) Truy vấn trạng thái giao dịch VNPAY
   * @example POST /vnpay-payments/query
   */
  @Post('query')
  async queryTransaction(@Body() body: any) {
    return this.vnpayPaymentsService.queryTransaction(body);
  }
}
