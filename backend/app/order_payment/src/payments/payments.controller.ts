import { Controller } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { GenericController } from '@shared/core/generic.controller';
import { payments } from '.prisma/order_payment_client';


@Controller('payments')
export class PaymentsController extends GenericController<payments, PaymentsService>{
  constructor(private readonly paymentsService: PaymentsService) {
    super(paymentsService);
  }
}
