// src/enrollment/enrollment-producer.module.ts
import { Module } from '@nestjs/common';
import { RmqModule } from '@shared/rmq/rmq.module';

import { PrismaService } from '../prisma.service';
import { EnrollmentProducerService } from './enrollments-producer.service';

@Module({
  imports: [
    RmqModule.register({
      name: 'COURSE_SERVICE',
      queue: 'course_queue',
      queueOptions: { durable: true }, // tùy queue mỗi service
    }),
  ],
  providers: [EnrollmentProducerService, PrismaService],
  exports: [EnrollmentProducerService],
})
export class EnrollmentProducerModule {}
