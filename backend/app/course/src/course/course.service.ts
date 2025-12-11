import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, courses } from '.prisma/course-client'; // Import Prisma namespace
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { GenericService } from '@shared/core/generic.service';
// import { addResponseRelation } from '@shared/helper/addrespone.helper';
import { CourseProducerService } from './course-producer.service';
import { generateUniqueSlug } from '@shared/ultis/slug.ultis';
import { syncCourseToService } from '@shared/ultis/synccourse.ultis';

@Injectable()
export class CourseService extends GenericService<courses, Prisma.coursesDelegate> {
    private userClient: ClientProxy;
    constructor(private prisma: PrismaService, private courseProducer: CourseProducerService,) {
        super(prisma.courses, {
            create: async (data: any) => {
                if (data.title) {
                    data.slug = await generateUniqueSlug(prisma.courses, data);
                }

                // Extract category_ids before creating course
                const categoryIds = data.category_ids || [];
                delete data.category_ids; // Remove from data to avoid Prisma error

                // Connect categories if provided
                if (categoryIds.length > 0) {
                    data.categories = {
                        connect: categoryIds.map((id: string) => ({ id }))
                    };
                }
            },
        },
            {
                afterCreate: async (created) => {
                    const full = await prisma.courses.findUnique({ where: { id: created.id }, include: { categories: true } });
                    await syncCourseToService('add', full, 'http://localhost:3005/add'); // Recommend
                    await syncCourseToService('add', full, 'http://localhost:3006/add'); // RAG
                },
                afterUpdate: async (updated) => {
                    const full = await prisma.courses.findUnique({ where: { id: updated.id }, include: { categories: true } });
                    await syncCourseToService('update', full, 'http://localhost:3005/update');
                    await syncCourseToService('update', full, 'http://localhost:3006/update');
                },
                afterDelete: async (deleted) => {
                    await syncCourseToService('delete', deleted, 'http://localhost:3005/delete');
                    await syncCourseToService('delete', deleted, 'http://localhost:3006/delete');
                },
            }); // truyền đúng delegate
    }

    async findAll() {
        const coursesList = await this.prisma.courses.findMany({
            include: {
                categories: true
            }
        });

        console.log('✅ Loaded courses with categories:', coursesList.map(c => ({
            id: c.id,
            title: c.title,
            categories: c.categories
        })));

        return await this.courseProducer.addResponseRelationWithProducer(
            coursesList,
            'instructor_id',
            'instructor'
        );
    }

    async getCourseById(courseId: string) {
        return this.prisma.courses.findUnique({
            where: { id: courseId },
            include: {
                lessons: true,
                reviews: true,
            },
        });
    }

    async getCourseDetail() {
        return this.prisma.courses.findMany({
            include: {
                lessons: true,
                reviews: true,
            },
        });
    }

    async getDurations(courseId: string) {
        const lessons = await this.prisma.lessons.findMany({
            where: { course_id: courseId },
            select: { duration_seconds: true },
        });
        return lessons.reduce((sum, l) => sum + (l.duration_seconds ?? 0), 0);
    }

    async findByUserId(userId: string) {
        const coursesList = await this.prisma.courses.findMany({
            where: { instructor_id: userId },
        });

        return await this.courseProducer.addResponseRelationWithProducer(
            coursesList,
            'instructor_id',
            'instructor'
        );
    }

    async findBySlug(slug: string) {
        const course = await this.prisma.courses.findUnique({ where: { slug } });
        if (!course) return null;

        const [withInstructor] = await this.courseProducer.addResponseRelationWithProducer(
            [course],
            'instructor_id',
            'instructor'
        );
        return withInstructor;
    }

    async incrementEnrollmentCount(courseId: string) {
        await this.prisma.courses.update({
            where: { id: courseId },
            data: { enrollment_count: { increment: 1 } },
        });
    }

    async getCourseCategories(courseId: string) {
        const course = await this.prisma.courses.findUnique({
            where: { id: courseId },
            include: { categories: true }
        });

        if (!course) {
            return { error: 'Course not found' };
        }

        return course.categories;
    }
}
