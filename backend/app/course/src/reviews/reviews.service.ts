import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { reviews, Prisma } from '.prisma/course-client';
import { GenericService } from '@shared/core/generic.service';
import { CourseProducerService } from '../course/course-producer.service';
import { syncCourseToService } from '@shared/ultis/synccourse.ultis';

@Injectable()
export class ReviewsService extends GenericService<reviews, Prisma.reviewsDelegate> {
    constructor(
        private prisma: PrismaService,
        private readonly courseProducer: CourseProducerService,
    ) {
        super(prisma.reviews, {},
            {
                afterCreate: async (created) => {
                    await syncCourseToService('add', created, 'http://localhost:3005/review/add'); // Recommend
                    await syncCourseToService('add', created, 'http://localhost:3006/review/add'); // RAG
                },
                afterUpdate: async (updated) => {
                    await syncCourseToService('update', updated, 'http://localhost:3005/review/update');
                    await syncCourseToService('update', updated, 'http://localhost:3006/review/update');
                },
                afterDelete: async (deleted) => {
                    await syncCourseToService('delete', deleted, 'http://localhost:3005/review/delete');
                    await syncCourseToService('delete', deleted, 'http://localhost:3006/review/delete');
                },
            });
    }

    async findByCourseSlug(slug: string) {
        const course = await this.prisma.courses.findUnique({
            where: { slug },
            include: { reviews: true },
        });

        if (!course) {
            throw new NotFoundException('Course not found');
        }

        const reviewsWithUser = await this.courseProducer.addResponseRelationWithProducer(
            course.reviews,
            'user_id',
            'user'
        );

        // Ensure created_at and updated_at are serialized to ISO strings
        const sanitizedReviews = reviewsWithUser.map((review: any) => ({
            ...review,
            created_at: review.created_at ? new Date(review.created_at).toISOString() : null,
            updated_at: review.updated_at ? new Date(review.updated_at).toISOString() : null,
        }));

        return {
            course_id: course.id,
            course_title: course.title,
            reviews: sanitizedReviews,
        };
    }

    async create(data: Prisma.reviewsCreateInput) {
        const created = await this.prisma.reviews.create({ data });
        if (this.hooks?.afterCreate) await this.hooks.afterCreate(created);
        return created;
    }

    async update(id: string, data: Prisma.reviewsUpdateInput) {
        const updated = await this.prisma.reviews.update({
            where: { id },
            data,
        });
        if (this.hooks?.afterUpdate) await this.hooks.afterUpdate(updated);
        return updated;
    }

    async delete(id: string) {
        const deleted = await this.prisma.reviews.delete({
            where: { id },
        });
        if (this.hooks?.afterDelete) await this.hooks.afterDelete(deleted);
        return deleted;
    }

    async findByUserId(userId: string) {
        return this.prisma.reviews.findMany({
            where: { user_id: userId },
        });
    }

    async findByCourseId(courseId: string) {
        return this.prisma.reviews.findMany({
            where: { course_id: courseId },
        });
    }

    async checkUserReview(userId: string, courseId: string) {
        const review = await this.prisma.reviews.findFirst({
            where: {
                user_id: userId,
                course_id: courseId,
            },
        });
        return !!review;
    }
}
