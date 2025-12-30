import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PrismaService } from '../prisma.service';
import { CourseProducerModule } from '../course/course-producer.module';

@Module({
    imports: [CourseProducerModule],
    controllers: [ReportsController],
    providers: [ReportsService, PrismaService],
})
export class ReportsModule { }
