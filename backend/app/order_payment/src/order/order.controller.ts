import { Controller, Post, Body, UseGuards, Get, Req, Query } from '@nestjs/common';
import { OrdersService } from './order.service';
import { GenericController } from '@shared/core/generic.controller';
import { orders } from '.prisma/order_payment_client';
import { JwtAuthGuard } from '@shared/guard/jwt.guard';
import { User } from '@shared/decorator/user.decorator';



@Controller('orders')
export class OrdersController extends GenericController<orders, OrdersService> {
  constructor(private readonly ordersService: OrdersService) {
    super(ordersService);
  }

  @Get('has-course')
  @UseGuards(JwtAuthGuard)
  async hasCourse(@Query('courseId') courseId: string, @User() user: any) {
    return this.ordersService.hasCourseInCart(user.id, courseId);
  }

  @Get('current')
  @UseGuards(JwtAuthGuard)
  async getCurrentOrder(@User() user: any) {
    return this.ordersService.getOrCreateOrderByUser(user.id);
  }

  @Post('apply-coupon')
  @UseGuards(JwtAuthGuard)
  async applyCoupon(@User() user: any, @Body() body: { orderId: string; code: string }) {
    return this.ordersService.applyCoupon(user.id, body.orderId, body.code);
  }

  @Post('remove-coupon')
  @UseGuards(JwtAuthGuard)
  async removeCoupon(@User() user: any, @Body() body: { orderId: string }) {
    return this.ordersService.removeCoupon(user.id, body.orderId);
  }

}