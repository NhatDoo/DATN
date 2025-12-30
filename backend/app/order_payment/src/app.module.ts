import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { OrdersModule } from './order/order.module';
import { PaymentTransactionsModule } from './payment_transactions/payment_transactions.module';
import { PaymentsModule } from './payments/payments.module';
import { VnpayPaymentsModule } from './vnpay_payments/vnpay_payments.module';
import { OrderItemsModule } from './order_item/orderitem.module';

import { CouponsModule } from './coupons/coupons.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    OrdersModule,
    OrderItemsModule,
    PaymentTransactionsModule,
    PaymentsModule,
    VnpayPaymentsModule,
    CouponsModule,
  ],
})
export class AppModule { }
