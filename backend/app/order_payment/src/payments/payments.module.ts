import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PrismaService } from 'src/prisma.service';
import { PaymentProducerModule } from './payment-producer.module';


@Module({
  imports: [PaymentProducerModule],
  controllers: [PaymentsController],
  providers: [PaymentsService ,PrismaService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
