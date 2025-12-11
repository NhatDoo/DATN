import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, coupons } from '.prisma/order_payment_client';

@Injectable()
export class CouponsService {
    constructor(private prisma: PrismaService) { }

    async create(data: Prisma.couponsCreateInput) {
        const exists = await this.prisma.coupons.findUnique({
            where: { code: data.code },
        });
        if (exists) {
            throw new BadRequestException('Coupon code already exists');
        }
        return this.prisma.coupons.create({ data });
    }

    async findAll() {
        return this.prisma.coupons.findMany({
            orderBy: { created_at: 'desc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.coupons.findUnique({ where: { id } });
    }

    async findByCode(code: string) {
        return this.prisma.coupons.findUnique({ where: { code } });
    }

    async update(id: string, data: Prisma.couponsUpdateInput) {
        return this.prisma.coupons.update({
            where: { id },
            data,
        });
    }

    async delete(id: string) {
        // Soft delete or hard delete? Let's just hard delete for now or deactive
        return this.prisma.coupons.delete({ where: { id } });
    }

    async validateCoupon(code: string, currentTotal: number) {
        const coupon = await this.prisma.coupons.findFirst({
            where: {
                code,
                active: true,
            },
        });

        if (!coupon) {
            throw new BadRequestException('Mã giảm giá không tồn tại hoặc đã hết hạn');
        }

        const now = new Date();
        if (coupon.valid_from && now < coupon.valid_from) {
            throw new BadRequestException('Mã giảm giá chưa đến đợt áp dụng');
        }
        if (coupon.valid_to && now > coupon.valid_to) {
            throw new BadRequestException('Mã giảm giá đã hết hạn');
        }

        if (coupon.max_usage && coupon.usage_count >= coupon.max_usage) {
            throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng');
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.discount_type === 'percent') {
            discountAmount = Math.floor((currentTotal * coupon.discount_value) / 100);
        } else {
            discountAmount = coupon.discount_value;
        }

        // Ensure discount doesn't exceed total
        if (discountAmount > currentTotal) {
            discountAmount = currentTotal;
        }

        return {
            isValid: true,
            coupon,
            discountAmount,
            newTotal: currentTotal - discountAmount,
        };
    }

    async incrementUsage(couponId: string) {
        await this.prisma.coupons.update({
            where: { id: couponId },
            data: { usage_count: { increment: 1 } }
        });
    }
}
