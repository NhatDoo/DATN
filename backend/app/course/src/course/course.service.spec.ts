import { Test, TestingModule } from '@nestjs/testing';
import { CourseService } from './course.service';
import { PrismaService } from '../prisma.service';
import { CourseProducerService } from './course-producer.service';
import { generateUniqueSlug } from '@shared/ultis/slug.ultis';
import { syncCourseToService } from '@shared/ultis/synccourse.ultis';

// Mock shared utilities
jest.mock('@shared/ultis/slug.ultis');
jest.mock('@shared/ultis/synccourse.ultis');

describe('CourseService', () => {
    let service: CourseService;
    let prismaService: PrismaService;
    let courseProducerService: CourseProducerService;

    const mockPrismaService = {
        courses: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
        },
        lessons: {
            findMany: jest.fn(),
        },
    };

    const mockCourseProducerService = {
        addResponseRelationWithProducer: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CourseService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: CourseProducerService, useValue: mockCourseProducerService },
            ],
        }).compile();

        service = module.get<CourseService>(CourseService);
        prismaService = module.get<PrismaService>(PrismaService);
        courseProducerService = module.get<CourseProducerService>(CourseProducerService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return courses with categories and producer info', async () => {
            const courses = [{ id: '1', title: 'Course 1', categories: [] }];
            (mockPrismaService.courses.findMany as jest.Mock).mockResolvedValue(courses);
            (mockCourseProducerService.addResponseRelationWithProducer as jest.Mock).mockResolvedValue(courses);

            const result = await service.findAll();

            expect(prismaService.courses.findMany).toHaveBeenCalledWith({
                include: { categories: true },
            });
            expect(courseProducerService.addResponseRelationWithProducer).toHaveBeenCalledWith(
                courses,
                'instructor_id',
                'instructor',
            );
            expect(result).toEqual(courses);
        });
    });

    describe('getCourseById', () => {
        it('should return a course by id with relations', async () => {
            const course = { id: '1', title: 'Course 1' };
            (mockPrismaService.courses.findUnique as jest.Mock).mockResolvedValue(course);

            const result = await service.getCourseById('1');

            expect(prismaService.courses.findUnique).toHaveBeenCalledWith({
                where: { id: '1' },
                include: {
                    lessons: true,
                    reviews: true,
                },
            });
            expect(result).toEqual(course);
        });
    });

    describe('getDurations', () => {
        it('should calculate total duration of lessons', async () => {
            const lessons = [
                { duration_seconds: 100 },
                { duration_seconds: 200 },
            ];
            (mockPrismaService.lessons.findMany as jest.Mock).mockResolvedValue(lessons);

            const result = await service.getDurations('1');

            expect(prismaService.lessons.findMany).toHaveBeenCalledWith({
                where: { course_id: '1' },
                select: { duration_seconds: true },
            });
            expect(result).toBe(300);
        });

        it('should return 0 if no lessons', async () => {
            (mockPrismaService.lessons.findMany as jest.Mock).mockResolvedValue([]);

            const result = await service.getDurations('1');

            expect(result).toBe(0);
        });
    });

    describe('findByUserId', () => {
        it('should return courses for a specific user/instructor', async () => {
            const courses = [{ id: '1' }];
            (mockPrismaService.courses.findMany as jest.Mock).mockResolvedValue(courses);
            (mockCourseProducerService.addResponseRelationWithProducer as jest.Mock).mockResolvedValue(courses);

            const result = await service.findByUserId('user1');

            expect(prismaService.courses.findMany).toHaveBeenCalledWith({
                where: { instructor_id: 'user1' },
            });
            expect(result).toEqual(courses);
        });
    });

    describe('findBySlug', () => {
        it('should return course by slug with instructor info', async () => {
            const course = { id: '1', slug: 'course-1' };
            (mockPrismaService.courses.findUnique as jest.Mock).mockResolvedValue(course);
            (mockCourseProducerService.addResponseRelationWithProducer as jest.Mock).mockResolvedValue([course]);

            const result = await service.findBySlug('course-1');

            expect(prismaService.courses.findUnique).toHaveBeenCalledWith({ where: { slug: 'course-1' } });
            expect(result).toEqual(course);
        });

        it('should return null if course not found', async () => {
            (mockPrismaService.courses.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await service.findBySlug('non-existent');

            expect(result).toBeNull();
        });
    });

    describe('incrementEnrollmentCount', () => {
        it('should increment enrollment count', async () => {
            await service.incrementEnrollmentCount('1');

            expect(prismaService.courses.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: { enrollment_count: { increment: 1 } },
            });
        });
    });
});
