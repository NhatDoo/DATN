import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { GenericService } from '@shared/core/generic.service';
import { Prisma, orders } from '.prisma/order_payment_client';



import { CouponsService } from '../coupons/coupons.service';

@Injectable()
export class OrdersService extends GenericService<orders, Prisma.ordersDelegate> {
  constructor(
    private prisma: PrismaService,
    private couponsService: CouponsService
  ) {
    super(prisma.orders);
  }

  async applyCoupon(userId: string, orderId: string, code: string) {
    const order = await this.prisma.orders.findFirst({
      where: { id: orderId, user_id: userId, status: 'pending' },
      include: { order_items: true }
    });

    if (!order) {
      throw new BadRequestException('Không tìm thấy đơn hàng hoặc đơn hàng không ở trạng thái chờ');
    }

    const subtotal = order.order_items.reduce((sum, item) => sum + item.price_bigint, BigInt(0));

    // Convert BigInt to Number for percentage calculation (be careful with precision if amounts are huge)
    // Assuming 1 unit = 1 VND, max safe integer is 9 quadrillion, safe enough.
    const validation = await this.couponsService.validateCoupon(code, Number(subtotal));

    const discountBigInt = BigInt(Math.floor(validation.discountAmount));
    const newTotal = subtotal - discountBigInt;

    return this.prisma.orders.update({
      where: { id: orderId },
      data: {
        coupon_id: validation.coupon.id,
        discount_amount_bigint: discountBigInt,
        total_amount_bigint: newTotal < 0n ? 0n : newTotal
      }
    });
  }

  async removeCoupon(userId: string, orderId: string) {
    const order = await this.prisma.orders.findFirst({
      where: { id: orderId, user_id: userId, status: 'pending' },
      include: { order_items: true }
    });

    if (!order) throw new BadRequestException('Order not found');

    const subtotal = order.order_items.reduce((sum, item) => sum + item.price_bigint, BigInt(0));

    return this.prisma.orders.update({
      where: { id: orderId },
      data: {
        coupon_id: null,
        discount_amount_bigint: 0n,
        total_amount_bigint: subtotal
      }
    });
  }

  async getOrCreateOrderByUser(userId: string) {
    // console.log('>>> getOrCreateOrderByUser userId:', userId, typeof userId);
    let order = await this.prisma.orders.findFirst({
      where: { user_id: userId, status: 'pending' }, // chỉ lấy giỏ hàng chưa thanh toán
    });

    // Nếu chưa có giỏ hàng thì tạo mới
    if (!order) {
      order = await this.prisma.orders.create({
        data: {
          user_id: userId,
          total_amount_bigint: BigInt(0),
          currency: 'VND',
          status: 'pending',
        },
      });
    }

    return order;
  }



  async hasCourseInCart(userId: string, courseId: string) {
    const orderItem = await this.prisma.order_items.findFirst({
      where: {
        course_id: courseId,
        order: {
          user_id: userId,
          status: 'pending', // chỉ kiểm tra giỏ hàng chưa thanh toán
        },
      },
    });

    return { exists: !!orderItem };
  }


}