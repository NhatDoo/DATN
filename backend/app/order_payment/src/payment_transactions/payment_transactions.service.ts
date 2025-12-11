import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { GenericService } from '@shared/core/generic.service';
import { Prisma , payment_transactions } from '.prisma/order_payment_client';


@Injectable()
export class PaymentTransactionsService extends GenericService<payment_transactions, Prisma.payment_transactionsDelegate> {
  constructor(private prisma: PrismaService) 
  {
    super(prisma.payment_transactions); 
  }
}
