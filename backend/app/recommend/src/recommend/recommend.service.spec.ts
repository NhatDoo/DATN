import { Test, TestingModule } from '@nestjs/testing';
import { RecommendService } from './recommend.service';
import { PrismaMongoService } from './prisma.service';
import { syncCourseToService } from '@shared/ultis/synccourse.ultis';

jest.mock('@shared/ultis/synccourse.ultis');

describe('RecommendService', () => {
    let service: RecommendService;
    let prismaService: PrismaMongoService;

    const mockPrismaService = {
        user_activity: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RecommendService,
                { provide: PrismaMongoService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<RecommendService>(RecommendService);
        prismaService = module.get<PrismaMongoService>(PrismaMongoService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('syncLesson', () => {
        it('should sync lesson add', async () => {
            const data = { id: '1' };
            await service.syncLesson('add', data);
            expect(syncCourseToService).toHaveBeenCalledWith('add', data, expect.stringContaining('/lesson/add'));
        });

        it('should sync lesson update', async () => {
            const data = { id: '1' };
            await service.syncLesson('update', data);
            expect(syncCourseToService).toHaveBeenCalledWith('update', data, expect.stringContaining('/lesson/update'));
        });

        it('should sync lesson delete', async () => {
            const data = { id: '1' };
            await service.syncLesson('delete', data);
            expect(syncCourseToService).toHaveBeenCalledWith('delete', data, expect.stringContaining('/lesson/delete'));
        });
    });

    describe('logUserSearch', () => {
        it('should log user search and sync', async () => {
            const logData = {
                user_id: 'u1',
                keyword: 'test',
                action_type: 'search',
                course_id: null,
                price: 0,
                timestamp: new Date()
            };
            (mockPrismaService.user_activity.create as jest.Mock).mockResolvedValue(logData);

            await service.logUserSearch('u1', 'test', 'search', 0, 'null');

            expect(prismaService.user_activity.create).toHaveBeenCalled();
            expect(syncCourseToService).toHaveBeenCalledWith('add', logData, expect.stringContaining('/add-history'));
        });
    });

    describe('getUserSearchHistory', () => {
        it('should return user search history', async () => {
            await service.getUserSearchHistory('u1');
            expect(prismaService.user_activity.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { user_id: 'u1', action_type: 'search' } }));
        });
    });

    describe('getAllUserSearchHistory', () => {
        it('should return all user search history', async () => {
            await service.getAllUserSearchHistory();
            expect(prismaService.user_activity.findMany).toHaveBeenCalled();
        });
    });
});
