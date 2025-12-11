// users.module.ts
import { Module } from '@nestjs/common';
import { UsersController } from './user.controller';
import { UsersService } from './user.service';
import { PrismaService } from './prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '@shared/core/strategies/jwt.strategy';
import { AuthModule } from './auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { MailerService } from './mailer.service';


@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      global: true, // 👈 cho toàn app dùng được
      secret: process.env.JWT_SECRET ,
      signOptions: { expiresIn: '1h' },
    }),
    AuthModule
  ],
  controllers: [UsersController],
  providers: [UsersService, PrismaService , JwtStrategy , MailerService],
  exports: [UsersService],
})
export class UsersModule {}
