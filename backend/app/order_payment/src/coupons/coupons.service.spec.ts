import { Test, TestingModule } from '@nestjs/testing';
import { CouponsService } from './coupons.service';
import { PrismaService } from '../prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('CouponsService', () => {
    let service: CouponsService;
    let prismaService: PrismaService;

    const mockPrismaService = {
        coupons: {
            findUnique: jest.fn(),
            create: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findFirst: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CouponsService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<CouponsService>(CouponsService);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a coupon', async () => {
            const dto: any = { code: 'NEW' };
            (mockPrismaService.coupons.findUnique as jest.Mock).mockResolvedValue(null);
            (mockPrismaService.coupons.create as jest.Mock).mockResolvedValue(dto);

            await service.create(dto);
            expect(prismaService.coupons.create).toHaveBeenCalledWith({ data: dto });
        });

        it('should throw if code exists', async () => {
            const dto: any = { code: 'EXIST' };
            (mockPrismaService.coupons.findUnique as jest.Mock).mockResolvedValue(dto);
            await expect(service.create(dto)).rejects.toThrow(BadRequestException);
        });
    });

    describe('validateCoupon', () => {
        it('should validate valid coupon', async () => {
            const coupon = {
                id: '1',
                code: 'VALID',
                active: true,
                discount_type: 'percent',
                discount_value: 10,
                usage_count: 0,
                max_usage: 100,
                valid_from: new Date(Date.now() - 10000),
                valid_to: new Date(Date.now() + 10000),
            };
            (mockPrismaService.coupons.findFirst as jest.Mock).mockResolvedValue(coupon);

            const result = await service.validateCoupon('VALID', 100000);
            expect(result).toEqual({
                isValid: true,
                coupon,
                discountAmount: 10000,
                newTotal: 90000,
            });
        });

        it('should throw if coupon expired', async () => {
            const coupon = {
                id: '1',
                code: 'EXPIRED',
                active: true,
                valid_to: new Date(Date.now() - 10000),
            };
            (mockPrismaService.coupons.findFirst as jest.Mock).mockResolvedValue(coupon);
            await expect(service.validateCoupon('EXPIRED', 100)).rejects.toThrow(BadRequestException);
        });


        it('should throw if coupon usage limit reached', async () => {
            const coupon = {
                id: '1',
                code: 'LIMIT',
                active: true,
                usage_count: 100,
                max_usage: 100,
            };
            (mockPrismaService.coupons.findFirst as jest.Mock).mockResolvedValue(coupon);
            await expect(service.validateCoupon('LIMIT', 100)).rejects.toThrow(BadRequestException);
        });
    });
});
