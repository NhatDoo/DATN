import { Controller, Post, Body, UseGuards, Get , Req} from '@nestjs/common';
import { OrderItemsService } from './orderitem.service';
import { GenericController } from '@shared/core/generic.controller';
import { JwtAuthGuard } from '@shared/guard/jwt.guard';
import { CreateOrderItemDto } from '../DTO/create-order-item.dto';
import { order_items } from '.prisma/order_payment_client';


@Controller('order-items')
export class OrdersController extends GenericController<order_items, OrderItemsService>{
  constructor(private readonly ordersItemService: OrderItemsService) {
    super(ordersItemService); 
  }
  @UseGuards(JwtAuthGuard)
  @Get('by-user')
  async getOrderItemsByUser(@Req() req) {
    const userId = req.user.id;
    return this.ordersItemService.getOrderItemsByUser(userId);
  }


  @UseGuards(JwtAuthGuard)
  @Post('user-course')
  async getOrderItemsByUserCourse(@Req() req , @Body('courseId') courseId: string) {
    const userId = req.user.id;
    return this.ordersItemService.getOrderItemsByUserCourse(userId , courseId);
  }



  
  @UseGuards(JwtAuthGuard)
  @Post()
  async createorderitem( @Req() req, @Body() dto: CreateOrderItemDto) {
    const userId = req.user.id; // 🔒 lấy từ JWT
    const item = await this.ordersItemService.createorderitem(userId, dto);
    return { message: 'Order item created successfully', data: item };
  }
}

