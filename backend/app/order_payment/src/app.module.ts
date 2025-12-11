import { Module } from '@nestjs/common';
import { OrdersModule } from './order/order.module';
import { PaymentTransactionsModule } from './payment_transactions/payment_transactions.module';
import { PaymentsModule } from './payments/payments.module';
import { VnpayPaymentsModule } from './vnpay_payments/vnpay_payments.module';
import { OrderItemsModule } from './order_item/orderitem.module';

import { CouponsModule } from './coupons/coupons.module';

@Module({
  imports: [OrdersModule, OrderItemsModule, PaymentTransactionsModule, PaymentsModule, VnpayPaymentsModule, CouponsModule],
})
export class AppModule { }
