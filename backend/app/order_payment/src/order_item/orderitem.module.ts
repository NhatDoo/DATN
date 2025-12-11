// users.module.ts
import { Module } from '@nestjs/common';
import { OrdersController } from './orderitem.controller';
import { OrderItemsService } from './orderitem.service';
import { OrdersModule } from '../order/order.module';
import { AuthModule } from '@shared/core/auth/auth.module';


import { PrismaService } from '../prisma.service';


@Module({
  imports: [
    AuthModule,
    OrdersModule],
  controllers: [OrdersController],
  providers: [OrderItemsService, PrismaService],
  exports: [OrderItemsService],
})
export class OrderItemsModule {}