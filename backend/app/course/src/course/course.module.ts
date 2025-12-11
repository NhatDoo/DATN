import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CourseController } from './course.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CourseService } from './course.service';     
import { CourseProducerModule } from './course-producer.module';
import { RmqModule } from '@shared/rmq/rmq.module';

@Module({
  imports: [
     RmqModule.register({
      name: 'COURSE_SERVICE',
      queue: 'course_queue', // trùng với bên Enrollment gửi
      queueOptions: { durable: false },
      
    }),CourseProducerModule ],
  controllers: [CourseController],
  providers: [CourseService,PrismaService],
  exports: [CourseService],
})
export class CourseModule {}