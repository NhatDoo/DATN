import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { AuthModule } from '@shared/core/auth/auth.module';
import { CourseProducerModule } from '../course/course-producer.module';

@Module({
  imports: [AuthModule, CourseProducerModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, PrismaService],
  exports: [ReviewsService],
})
export class ReviewsModule { }