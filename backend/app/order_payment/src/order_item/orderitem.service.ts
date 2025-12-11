import { Injectable, UnauthorizedException , BadRequestException} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { GenericService } from '@shared/core/generic.service';
import { Prisma , order_items , payment_status} from '.prisma/order_payment_client';
import { CreateOrderItemDto } from '../DTO/create-order-item.dto';
import { OrdersService } from '../order/order.service';



@Injectable()
export class OrderItemsService extends GenericService<order_items, Prisma.order_itemsDelegate> {
  constructor(private prisma: PrismaService , private ordersService: OrdersService) 
  {
    super(prisma.order_items); 
  }

async getOrderItemsByUser(userId: string) {
  if (!userId || typeof userId !== 'string') {
    throw new BadRequestException('Invalid or missing userId');
  }

  
  console.log("User ID from JWT:", userId);
  return await this.prisma.order_items.findMany({
    where: { 
      order: { 
        user_id: userId,
        status: payment_status.pending   // ✅ filter ở đây
      } 
    },
    include: {
      order: {
        select: {
          id: true,
          status: true,                  // ✅ status trả về
          total_amount_bigint: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });
}


async getOrderItemsByUserCourse(userId: string , courseId: string) {
  if (!userId || typeof userId !== 'string') {
    throw new BadRequestException('Invalid or missing userId');
  }

  
  console.log("User ID from JWT:", userId);
  return await this.prisma.order_items.findMany({
    where: { 
      course_id: courseId,
      order: { 
        user_id: userId,
        // status: payment_status.pending   // ✅ filter ở đây
      } 
    },
    include: {
      order: {
        select: {
          id: true,
          status: true,                  // ✅ status trả về
          total_amount_bigint: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });
}



  async createorderitem(userId: string, dto: CreateOrderItemDto) {
    // 1️⃣ Tìm hoặc tạo order pending
    let order = await this.prisma.orders.findFirst({
      where: { user_id: userId, status: 'pending' },
    });
    

    if (!order) {
      order = await this.ordersService.create({
        user_id : userId,
        status: 'pending',
        total_amount_bigint: BigInt(0),
      });
    }

    console.log('createorderitem dto:', dto);
    console.log('Updating order with ID:', order.id);
  

    // 2️⃣ Tạo order_item
    const item = await this.prisma.order_items.create({
         data: {
            order_id: order.id,
            course_id: dto.course_id,
            price_bigint: BigInt(dto.price_bigint),
          },
    });

    // 3️⃣ Cập nhật tổng tiền
    await this.ordersService.update(order.id, {
      total_amount_bigint: order.total_amount_bigint + BigInt(dto.price_bigint),
    });

    return item;
  }
}
