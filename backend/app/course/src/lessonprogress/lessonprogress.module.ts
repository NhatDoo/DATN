import { Module } from '@nestjs/common';
import { LessonprogressController } from './lessonprogress.controller';
import { PrismaService } from '../prisma.service';
import { LessonprogressService } from './lessonprogress.service';
import { CourseProducerModule } from '../course/course-producer.module';

@Module({
  imports: [CourseProducerModule],
  controllers: [LessonprogressController],
  providers: [PrismaService, LessonprogressService],
})
export class LessonprogressModule { }
