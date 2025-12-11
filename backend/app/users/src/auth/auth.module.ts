import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './google.strategy';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'google' })],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, PrismaService],
})
export class AuthModule {}
