import { Module } from '@nestjs/common';
import { RecommendService } from './recommend.service';
import { RecommendController } from './recommend.controller';
import { PrismaMongoService } from './prisma.service';
import { AuthModule } from '@shared/core/auth/auth.module';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { RecommenderCron } from './recommend.cron';


@Module({
   
  imports:[HttpModule.register({ timeout: 60 }),ScheduleModule.forRoot(),AuthModule],
  providers: [RecommendService , PrismaMongoService ,RecommenderCron],
  controllers: [RecommendController]
})
export class RecommendModule {}
