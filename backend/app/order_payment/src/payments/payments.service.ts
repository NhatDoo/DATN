import { Injectable , BadRequestException , Inject} from '@nestjs/common';
import { GenericService } from '@shared/core/generic.service';
import { PrismaService } from '../prisma.service';
import { PaymentProducerService } from './payments-producer.service';
import { Prisma , payments } from '.prisma/order_payment_client';


@Injectable()
export class PaymentsService extends GenericService<payments, Prisma.paymentsDelegate> {
  
    constructor(private prisma: PrismaService , private paymentProducer: PaymentProducerService,){
        super(prisma.payments);
    }


async handlePaymentResult(orderId: string, status: 'paid' | 'failed' | 'canceled', query: any) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payments.findFirst({
        where: { order_id: orderId },
      });
      if (!payment) {
        throw new BadRequestException('Payment not found for order');
      }
      // Cập nhật payment
      await tx.payments.updateMany({
        where: { order_id: orderId },
        data: {
          status,
          completed_at: new Date(),
          raw_response: query,
        },
      });

      // Nếu thanh toán thành công → cập nhật order
        await tx.payments.updateMany({
        where: { order_id: orderId },
        data: {
            status,
            completed_at: new Date(),
            raw_response: query,
        },
        });

        // ✅ Cập nhật trạng thái order tương ứng với trạng thái thanh toán
        switch (status) {
        case 'paid':
            await tx.orders.updateMany({
            where: { id: payment.order_id },
            data: { status: 'paid' },
            
            });
           
            break;

        case 'failed':
            await tx.orders.updateMany({
            where: { id: payment.order_id },
            data: { status: 'failed' },
            });
            break;

        case 'canceled':
            await tx.orders.updateMany({
            where: { id: payment.order_id },
            data: { status: 'canceled' },
            });
            break;
        }



        if (status === 'paid') {
        const order = await tx.orders.findUnique({
          where: { id: payment.order_id },
        });

        if (!order) {
          throw new BadRequestException('Order not found for payment');
        }
        // Lấy danh sách course_id từ order_items
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
