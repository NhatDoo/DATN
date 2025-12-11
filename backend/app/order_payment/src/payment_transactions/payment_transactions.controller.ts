import { Controller } from '@nestjs/common';
import { PaymentTransactionsService } from './payment_transactions.service';
import { GenericController } from '@shared/core/generic.controller';
import { payment_transactions } from '.prisma/order_payment_client';


@Controller('payment-transactions')
export class PaymentTransactionsController extends GenericController<payment_transactions, PaymentTransactionsService>{
  constructor(private readonly PaymentTransactionsService: PaymentTransactionsService) {
    super(PaymentTransactionsService); 
  }
}
