import { Module } from '@nestjs/common';
import { CourseProducerService } from './course-producer.service';
import { PrismaService } from '../prisma.service';
import { RmqModule } from '@shared/rmq/rmq.module'; // 👈 import module dùng chung

@Module({
  imports: [
    RmqModule.register({
      name: 'USER_SERVICE',
      queue: 'user_queue',
      queueOptions: { durable: false },
    }),
  ],
  providers: [CourseProducerService, PrismaService],
  exports: [CourseProducerService],
})
export class CourseProducerModule {}
