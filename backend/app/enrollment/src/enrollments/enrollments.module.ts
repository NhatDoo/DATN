import { Module } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentsController } from './enrollments.controller';
import { PrismaService } from '../prisma.service';
import { EnrollmentProducerModule } from './enrollments-producer.module';
import { EnrollmentConsumerController } from './enrollments-consumer.controller';
import { AuthModule } from '@shared/core/auth/auth.module';



@Module({
  imports:[EnrollmentProducerModule , AuthModule],
  controllers: [EnrollmentsController , EnrollmentConsumerController],
  providers: [EnrollmentsService , PrismaService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
