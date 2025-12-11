import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LessionsController } from './lessions.controller';
import { LessionsService } from './lessions.service';   
import { JwtService } from '@nestjs/jwt';  
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '@shared/core/strategies/jwt.strategy';

@Module({
  // imports: [
  //   JwtModule.register({
  //     secret: process.env.JWT_SECRET || '59efedfdabdd1cfb6321d61887a52e73b65db593e961a35cbc6e8db80972631237dda83d0f9d88cb9db094f066e6f8d98351a86c6d813fd6d60d61a1e2f06317',
  //   }),],
  controllers: [LessionsController],
  providers: [LessionsService,PrismaService,JwtStrategy],
  exports: [LessionsService],
})
export class LessionsModule {}