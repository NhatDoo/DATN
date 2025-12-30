import { Test, TestingModule } from '@nestjs/testing';
import { StreamService } from './stream.service';
import { MinioService } from '../minio/minio.service';
import { Response } from 'express';
import { Readable } from 'stream';

describe('StreamService', () => {
    let service: StreamService;
    let minioService: MinioService;

    const mockMinioService = {
        getFileStream: jest.fn(),
    };

    const mockResponse = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
    } as unknown as Response;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StreamService,
                { provide: MinioService, useValue: mockMinioService },
            ],
        }).compile();

        service = module.get<StreamService>(StreamService);
        minioService = module.get<MinioService>(MinioService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('streamFromBucket', () => {
        it('should stream ts file content', async () => {
            const stream = new Readable();
            stream.push('video_content');
            stream.push(null);

            const pipeSpy = jest.spyOn(stream, 'pipe').mockReturnValue(mockResponse as any);

            (mockMinioService.getFileStream as jest.Mock).mockResolvedValue(stream);

            await service.streamFromBucket('bucket', 'folder', 'video.ts', mockResponse);

            expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'video/MP2T');
            expect(pipeSpy).toHaveBeenCalledWith(mockResponse);
        });

        it('should stream m3u8 file content', async () => {
            const stream = new Readable();
            stream.push('playlist_content');
            stream.push(null);

            const pipeSpy = jest.spyOn(stream, 'pipe').mockReturnValue(mockResponse as any);

            (mockMinioService.getFileStream as jest.Mock).mockResolvedValue(stream);

            await service.streamFromBucket('bucket', 'folder', 'playlist.m3u8', mockResponse);

            expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/vnd.apple.mpegurl');
            expect(pipeSpy).toHaveBeenCalledWith(mockResponse);
        });


        it('should handle errors gracefully', async () => {
            (mockMinioService.getFileStream as jest.Mock).mockRejectedValue(new Error('File not found'));

            await service.streamFromBucket('bucket', 'folder', 'video.ts', mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.send).toHaveBeenCalledWith('Không tìm thấy file');
        });
    });
});
