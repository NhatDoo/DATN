// src/order_payment/rmq/payment-producer.service.ts
import { Injectable , Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class PaymentProducerService {
  constructor(
    @Inject('ENROLLMENT_SERVICE') private readonly client: ClientProxy,
  ) {}

  async emitPaymentSuccess(orderId: string, userId: string, courseIds: string[]) {
    await lastValueFrom(
      this.client.emit('payment.success', { orderId, userId, courseIds }),
    );
  }

  async emitRefundEnrollment(orderId: string, userId: string, courseIds: string[]) {
    await lastValueFrom(
      this.client.emit('refund.enrollment', { orderId, userId, courseIds }),
    );
  }
}
