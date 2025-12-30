import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { CourseProducerService } from '../course/course-producer.service';

@Injectable()
export class ReportsService {
    constructor(
        private prisma: PrismaService,
        private readonly courseProducer: CourseProducerService,
    ) { }

    async create(createReportDto: CreateReportDto) {
        return this.prisma.reports.create({
            data: {
                ...createReportDto,
                status: 'pending',
            },
        });
    }

    async findAll() {
        const reports = await this.prisma.reports.findMany({
            include: {
                course: {
                    select: { title: true, instructor_id: true, slug: true },
                },
            },
            orderBy: { created_at: 'desc' },
        });

        // Populate Reporter (User) info
        const reportsWithUser = await this.courseProducer.addResponseRelationWithProducer(
            reports,
            'user_id',
            'user'
        );

        return reportsWithUser;
    }

    async updateStatus(id: string, status: string) {
        const report = await this.prisma.reports.update({
            where: { id },
            data: { status },
            include: { course: true }, // Include course to get ID
        });

        if (status === 'hidden') {
            await this.prisma.courses.update({
                where: { id: report.course_id },
                data: { is_published: false },
            });
        }

        return report;
    }

    async findByInstructor(instructorId: string) {
        return this.prisma.reports.findMany({
            where: {
                course: {
                    instructor_id: instructorId,
                },
                status: {
                    in: ['warning_sent', 'hidden'],
                },
            },
            include: {
                course: {
                    select: { title: true, slug: true },
                },
            },
            orderBy: { created_at: 'desc' },
        });
    }
}
