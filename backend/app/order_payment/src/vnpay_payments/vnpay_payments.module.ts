import { Module } from '@nestjs/common';
import { VnpayPaymentsService } from './vnpay_payments.service';
import { VnpayPaymentsController } from './vnpay_payments.controller';
import { PrismaService } from 'src/prisma.service';
import { PaymentsModule } from 'src/payments/payments.module';
import { PaymentProducerModule } from 'src/payments/payment-producer.module';
import { PaymentProducerService } from 'src/payments/payments-producer.service';

@Module({
  imports: [PaymentsModule , PaymentProducerModule],
  controllers: [VnpayPaymentsController],
  providers: [VnpayPaymentsService, PrismaService],
  exports: [VnpayPaymentsService],
})
export class VnpayPaymentsModule {} 
