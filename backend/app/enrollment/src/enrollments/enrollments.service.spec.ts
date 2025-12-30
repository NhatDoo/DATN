import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentsService } from './enrollments.service';
import { PrismaService } from '../prisma.service';
import { EnrollmentProducerService } from './enrollments-producer.service';
import { BadRequestException } from '@nestjs/common';
import { enrollment_status } from '.prisma/enrollments_client';

describe('EnrollmentsService', () => {
    let service: EnrollmentsService;
    let prismaService: PrismaService;
    let producerService: EnrollmentProducerService;

    const mockPrismaService = {
        enrollments: {
            findFirst: jest.fn(),
            create: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
        },
    };

    const mockProducerService = {
        emitCourseEnrollmentUpdated: jest.fn(),
        addResponseRelationWithProducer: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EnrollmentsService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: EnrollmentProducerService, useValue: mockProducerService },
            ],
        }).compile();

        service = module.get<EnrollmentsService>(EnrollmentsService);
        prismaService = module.get<PrismaService>(PrismaService);
        producerService = module.get<EnrollmentProducerService>(EnrollmentProducerService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createEnrollments', () => {
        it('should create new enrollments when not exists', async () => {
            const userId = 'user1';
            const courseIds = ['course1', 'course2'];
            (mockPrismaService.enrollments.findFirst as jest.Mock).mockResolvedValue(null);

            await service.createEnrollments(userId, courseIds);

            expect(prismaService.enrollments.create).toHaveBeenCalledTimes(2);
            expect(producerService.emitCourseEnrollmentUpdated).toHaveBeenCalledTimes(2);
        });

        it('should skip creation if enrollment already exists', async () => {
            const userId = 'user1';
            const courseIds = ['course1'];
            (mockPrismaService.enrollments.findFirst as jest.Mock).mockResolvedValue({ id: 'existing' });

            await service.createEnrollments(userId, courseIds);

            expect(prismaService.enrollments.create).not.toHaveBeenCalled();
            expect(producerService.emitCourseEnrollmentUpdated).not.toHaveBeenCalled();
        });
    });

    describe('findCoursesByUser', () => {
        it('should return courses enrolled by user', async () => {
            const userId = 'user1';
            const enrollmentsList = [{ id: '1', course_id: 'course1' }];
            (mockPrismaService.enrollments.findMany as jest.Mock).mockResolvedValue(enrollmentsList);
            (mockProducerService.addResponseRelationWithProducer as jest.Mock).mockResolvedValue(enrollmentsList);

            const result = await service.findCoursesByUser(userId);

            expect(prismaService.enrollments.findMany).toHaveBeenCalledWith({
                where: { user_id: userId },
            });
            expect(result).toEqual(enrollmentsList);
        });

        it('should throw BadRequestException if userId is invalid', async () => {
            await expect(service.findCoursesByUser(undefined as any)).rejects.toThrow(BadRequestException);
        });
    });

    describe('findAll', () => {
        it('should return all enrollments', async () => {
            const enrollmentsList = [{ id: '1' }];
            (mockPrismaService.enrollments.findMany as jest.Mock).mockResolvedValue(enrollmentsList);
            (mockProducerService.addResponseRelationWithProducer as jest.Mock).mockResolvedValue(enrollmentsList);

            const result = await service.findAll();

            expect(prismaService.enrollments.findMany).toHaveBeenCalled();
            expect(result).toEqual(enrollmentsList);
        });
    });

    describe('isEnrolled', () => {
        it('should return true if enrolled', async () => {
            (mockPrismaService.enrollments.findFirst as jest.Mock).mockResolvedValue({ id: '1' });
            const result = await service.isEnrolled('u1', 'c1');
            expect(result).toBe(true);
        });

        it('should return false if not enrolled', async () => {
            (mockPrismaService.enrollments.findFirst as jest.Mock).mockResolvedValue(null);
            const result = await service.isEnrolled('u1', 'c1');
            expect(result).toBe(false);
        });
    });

    describe('getEnrollment', () => {
        it('should return enrollment details', async () => {
            const enrollment = { id: '1' };
            (mockPrismaService.enrollments.findFirst as jest.Mock).mockResolvedValue(enrollment);
            const result = await service.getEnrollment('u1', 'c1');
            expect(result).toEqual(enrollment);
        });
    });

    describe('activateEnrollment', () => {
        it('should activate pending enrollment', async () => {
            const enrollment = { id: '1', status: enrollment_status.pending };
            (mockPrismaService.enrollments.findFirst as jest.Mock).mockResolvedValue(enrollment);
            (mockPrismaService.enrollments.update as jest.Mock).mockResolvedValue({ ...enrollment, status: enrollment_status.active });

            await service.activateEnrollment('u1', 'c1');

            expect(prismaService.enrollments.update).toHaveBeenCalledWith({
                where: { id: enrollment.id },
                data: {
                    status: enrollment_status.active,
                    enrolled_at: expect.any(Date),
                }
            });
        });

        it('should return enrollment if already active', async () => {
            const enrollment = { id: '1', status: enrollment_status.active };
            (mockPrismaService.enrollments.findFirst as jest.Mock).mockResolvedValue(enrollment);

            const result = await service.activateEnrollment('u1', 'c1');

            expect(prismaService.enrollments.update).not.toHaveBeenCalled();
            expect(result).toEqual(enrollment);
        });

        it('should throw BadRequestException if enrollment not found', async () => {
            (mockPrismaService.enrollments.findFirst as jest.Mock).mockResolvedValue(null);
            await expect(service.activateEnrollment('u1', 'c1')).rejects.toThrow(BadRequestException);
        });
    });

});
