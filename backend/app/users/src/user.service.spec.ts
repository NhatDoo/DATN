import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './user.service';
import { PrismaService } from './prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from './mailer.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';

describe('UsersService', () => {
    let service: UsersService;
    let prismaService: PrismaService;
    let jwtService: JwtService;
    let mailerService: MailerService;

    const mockPrismaService = {
        users: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
            findFirst: jest.fn(),
        },
        email_verifications: {
            upsert: jest.fn(),
            findUnique: jest.fn(),
            delete: jest.fn(),
        },
    };

    const mockJwtService = {
        signAsync: jest.fn(),
        verifyAsync: jest.fn(),
    };

    const mockMailerService = {
        sendMail: jest.fn(),
    };

    const mockResponse = {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
        json: jest.fn().mockImplementation((result) => result),
    } as unknown as Response;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: JwtService, useValue: mockJwtService },
                { provide: MailerService, useValue: mockMailerService },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        prismaService = module.get<PrismaService>(PrismaService);
        jwtService = module.get<JwtService>(JwtService);
        mailerService = module.get<MailerService>(MailerService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('sendVerificationCode', () => {
        it('should send verification code', async () => {
            const email = 'test@example.com';
            await service.sendVerificationCode(email);

            expect(mailerService.sendMail).toHaveBeenCalledWith(
                email,
                'Xác nhận đăng ký tài khoản',
                expect.stringContaining('Mã xác minh của bạn là:'),
            );
            expect(prismaService.email_verifications.upsert).toHaveBeenCalled();
        });
    });

    describe('register', () => {
        it('should register a new user', async () => {
            const registerDto = {
                email: 'test@example.com',
                code: '123456',
                password: 'password',
                full_name: 'Test User',
            };

            (prismaService.email_verifications.findUnique as jest.Mock).mockResolvedValue({
                email: registerDto.email,
                code: registerDto.code,
                expires_at: new Date(Date.now() + 10000),
            });

            (prismaService.users.create as jest.Mock).mockResolvedValue({
                id: 1,
                email: registerDto.email,
                full_name: registerDto.full_name,
            });

            await service.register(registerDto);

            expect(prismaService.users.create).toHaveBeenCalled();
            expect(prismaService.email_verifications.delete).toHaveBeenCalledWith({
                where: { email: registerDto.email },
            });
        });

        it('should throw BadRequestException if code is invalid', async () => {
            const registerDto = {
                email: 'test@example.com',
                code: '123456',
                password: 'password',
                full_name: 'Test User',
            };

            (prismaService.email_verifications.findUnique as jest.Mock).mockResolvedValue({
                email: registerDto.email,
                code: '654321', // Wrong code
                expires_at: new Date(Date.now() + 10000),
            });

            await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
        });
    });

    describe('login', () => {
        it('should login user and return tokens', async () => {
            const loginDto = {
                email: 'test@example.com',
                password: 'password',
                rememberMe: true,
            };

            const user = {
                id: 1,
                email: loginDto.email,
                password_hash: await bcrypt.hash(loginDto.password, 10),
                role: 'user',
                is_info_updated: true,
            };

            (prismaService.users.findUnique as jest.Mock).mockResolvedValue(user);
            (mockJwtService.signAsync as jest.Mock).mockResolvedValue('token');

            await service.login(loginDto, mockResponse);

            expect(prismaService.users.update).toHaveBeenCalled();
            expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
            expect(mockResponse.json).toHaveBeenCalled();
        });

        it('should throw UnauthorizedException for invalid credentials', async () => {
            const loginDto = {
                email: 'test@example.com',
                password: 'wrongpassword',
            };
            const user = {
                id: 1,
                email: loginDto.email,
                password_hash: await bcrypt.hash('password', 10),
            };

            (prismaService.users.findUnique as jest.Mock).mockResolvedValue(user);

            await expect(service.login(loginDto, mockResponse)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('refreshAccessToken', () => {
        it('should refresh access token', async () => {
            const req = { cookies: { 'refresh_token': 'valid_refresh_token' } };
            const user = { id: 1, email: 'test@example.com', refresh_token: 'valid_refresh_token' };

            (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue({ sub: 1 });
            (prismaService.users.findUnique as jest.Mock).mockResolvedValue(user);
            (mockJwtService.signAsync as jest.Mock).mockResolvedValue('new_access_token');

            await service.refreshAccessToken(req, mockResponse);

            expect(mockResponse.cookie).toHaveBeenCalledWith('access_token', 'new_access_token', expect.any(Object));
        });
    });

    describe('logout', () => {
        it('should logout user', async () => {
            const req = { cookies: { 'refresh_token': 'some_token' } };
            await service.logout(req, mockResponse);

            expect(prismaService.users.updateMany).toHaveBeenCalledWith({
                where: { refresh_token: 'some_token' },
                data: { refresh_token: null, refresh_expires: null },
            });
            expect(mockResponse.clearCookie).toHaveBeenCalledTimes(2);
        });
    });
});
