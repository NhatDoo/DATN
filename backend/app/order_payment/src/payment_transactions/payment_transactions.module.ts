import { Module } from '@nestjs/common';
import { PaymentTransactionsService } from './payment_transactions.service';
import { PaymentTransactionsController } from './payment_transactions.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [PaymentTransactionsController],
  providers: [PaymentTransactionsService , PrismaService],
})
export class PaymentTransactionsModule {}
