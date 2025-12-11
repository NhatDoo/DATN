import { Module } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CouponsController } from './coupons.controller';
import { PrismaService } from '../prisma.service';

@Module({
    controllers: [CouponsController],
    providers: [CouponsService, PrismaService],
    exports: [CouponsService],
})
export class CouponsModule { }
