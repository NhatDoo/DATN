import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './order.service';
import { PrismaService } from '../prisma.service';
import { CouponsService } from '../coupons/coupons.service';
import { BadRequestException } from '@nestjs/common';

describe('OrdersService', () => {
    let service: OrdersService;
    let prismaService: PrismaService;
    let couponsService: CouponsService;

    const mockPrismaService = {
        orders: {
            findFirst: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
        },
        order_items: {
            findFirst: jest.fn(),
        },
    };

    const mockCouponsService = {
        validateCoupon: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrdersService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: CouponsService, useValue: mockCouponsService },
            ],
        }).compile();

        service = module.get<OrdersService>(OrdersService);
        prismaService = module.get<PrismaService>(PrismaService);
        couponsService = module.get<CouponsService>(CouponsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('applyCoupon', () => {
        it('should apply coupon to order', async () => {
            const order = {
                id: 'o1',
                user_id: 'u1',
                status: 'pending',
                order_items: [{ price_bigint: BigInt(100000) }],
            };
            const validation = {
                discountAmount: 10000,
                coupon: { id: 'c1' },
            };

            (mockPrismaService.orders.findFirst as jest.Mock).mockResolvedValue(order);
            (mockCouponsService.validateCoupon as jest.Mock).mockResolvedValue(validation);
            (mockPrismaService.orders.update as jest.Mock).mockResolvedValue({});

            await service.applyCoupon('u1', 'o1', 'COUPON');

            expect(prismaService.orders.update).toHaveBeenCalledWith({
                where: { id: 'o1' },
                data: expect.objectContaining({
                    coupon_id: 'c1',
                    discount_amount_bigint: BigInt(10000),
                    total_amount_bigint: BigInt(90000)
                }),
            });
        });

        it('should throw BadRequestException if order not found', async () => {
            (mockPrismaService.orders.findFirst as jest.Mock).mockResolvedValue(null);
            await expect(service.applyCoupon('u1', 'o1', 'COUPON')).rejects.toThrow(BadRequestException);
        });
    });

    describe('removeCoupon', () => {
        it('should remove coupon from order', async () => {
            const order = {
                id: 'o1',
                user_id: 'u1',
                status: 'pending',
                order_items: [{ price_bigint: BigInt(100000) }],
            };

            (mockPrismaService.orders.findFirst as jest.Mock).mockResolvedValue(order);
            (mockPrismaService.orders.update as jest.Mock).mockResolvedValue({});

            await service.removeCoupon('u1', 'o1');

            expect(prismaService.orders.update).toHaveBeenCalledWith({
                where: { id: 'o1' },
                data: expect.objectContaining({
                    coupon_id: null,
                    discount_amount_bigint: 0n,
                    total_amount_bigint: BigInt(100000),
                })
            });
        });

        it('should throw BadRequestException if order not found', async () => {
            (mockPrismaService.orders.findFirst as jest.Mock).mockResolvedValue(null);
            await expect(service.removeCoupon('u1', 'o1')).rejects.toThrow(BadRequestException);
        });
    });

    describe('getOrCreateOrderByUser', () => {
        it('should return existing pending order', async () => {
            const order = { id: 'o1', status: 'pending' };
            (mockPrismaService.orders.findFirst as jest.Mock).mockResolvedValue(order);

            const result = await service.getOrCreateOrderByUser('u1');
            expect(result).toEqual(order);
        });

        it('should create new order if no pending order exists', async () => {
            (mockPrismaService.orders.findFirst as jest.Mock).mockResolvedValue(null);
            const newOrder = { id: 'o2', status: 'pending' };
            (mockPrismaService.orders.create as jest.Mock).mockResolvedValue(newOrder);

            const result = await service.getOrCreateOrderByUser('u1');
            expect(result).toEqual(newOrder);
        });
    });

    describe('hasCourseInCart', () => {
        it('should return true if course is in cart', async () => {
            (mockPrismaService.order_items.findFirst as jest.Mock).mockResolvedValue({ id: 'i1' });
            const result = await service.hasCourseInCart('u1', 'c1');
            expect(result).toEqual({ exists: true });
        });

        it('should return false if course is not in cart', async () => {
            (mockPrismaService.order_items.findFirst as jest.Mock).mockResolvedValue(null);
            const result = await service.hasCourseInCart('u1', 'c1');
            expect(result).toEqual({ exists: false });
        });
    });

});
