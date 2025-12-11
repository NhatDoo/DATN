import { Module } from '@nestjs/common';
import { LessonprogressController } from './lessonprogress.controller';
import { PrismaService } from '../prisma.service';
import { LessonprogressService } from './lessonprogress.service';

@Module({
  controllers: [LessonprogressController],
  providers: [PrismaService , LessonprogressService],
})
export class LessonprogressModule {}
