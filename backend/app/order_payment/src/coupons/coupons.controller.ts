import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { Prisma } from '.prisma/order_payment_client';

@Controller('coupons')
export class CouponsController {
    constructor(private readonly couponsService: CouponsService) { }

    @Post()
    create(@Body() createCouponDto: Prisma.couponsCreateInput) {
        return this.couponsService.create(createCouponDto);
    }

    @Get()
    findAll() {
        return this.couponsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.couponsService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateCouponDto: Prisma.couponsUpdateInput) {
        return this.couponsService.update(id, updateCouponDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.couponsService.delete(id);
    }

    @Post('apply')
    async applyCoupon(@Body() body: { code: string; totalAmount: number }) {
        return this.couponsService.validateCoupon(body.code, body.totalAmount);
    }
}
