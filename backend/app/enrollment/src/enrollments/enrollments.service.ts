import { Injectable, BadRequestException } from '@nestjs/common';
import { GenericService } from '@shared/core/generic.service';
import { Prisma, enrollment_status, enrollments } from '.prisma/enrollments_client';
import { PrismaService } from '../prisma.service';
import { EnrollmentProducerService } from './enrollments-producer.service';

@Injectable()
export class EnrollmentsService extends GenericService<enrollments, Prisma.enrollmentsDelegate> {
  constructor(private prisma: PrismaService, private readonly producer: EnrollmentProducerService,) {
    super(prisma.enrollments);
  }



  async createEnrollments(userId: string, courseIds: string[]) {
    const tasks = courseIds.map(async (courseId) => {
      const exists = await this.prisma.enrollments.findFirst({
        where: { user_id: userId, course_id: courseId },
      });
      if (exists) return;

      await this.prisma.enrollments.create({
        data: {
          user_id: userId,
          course_id: courseId,
          status: enrollment_status.pending,
          enrolled_at: new Date(),
        },
      });

      await this.producer.emitCourseEnrollmentUpdated(courseId);
    });

    await Promise.all(tasks);
  }

  async findCoursesByUser(userId: string) {
    if (!userId || typeof userId !== 'string') {
      throw new BadRequestException("invalid user id");
    }

    const enrollments = await this.prisma.enrollments.findMany({
      where: {
        user_id: userId,
      }
    });

    return await this.producer.addResponseRelationWithProducer(
      enrollments,
      'course_id',        // field local
      'course'            // relation alias to hydrate
    );
  }

  async findAll() {
    const enrollment = await this.prisma.enrollments.findMany();
    return await this.producer.addResponseRelationWithProducer(
      enrollment,
      'course_id',
      'course'
    );


  }

  async isEnrolled(userId: string, courseId: string): Promise<boolean> {
    console.log('>>> isEnrolled check:', { userId, courseId });
    const enrollment = await this.prisma.enrollments.findFirst({
      where: { user_id: userId, course_id: courseId },
    });
    return !!enrollment;
  }

  async getEnrollment(userId: string, courseId: string) {
    return await this.prisma.enrollments.findFirst({
      where: { user_id: userId, course_id: courseId },
    });
  }

  async activateEnrollment(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollments.findFirst({
      where: { user_id: userId, course_id: courseId },
    });

    if (!enrollment) {
      throw new BadRequestException('Enrollment not found');
    }

    if (enrollment.status === enrollment_status.active) {
      return enrollment; // Already active
    }

    return await this.prisma.enrollments.update({
      where: { id: enrollment.id },
      data: {
        status: enrollment_status.active,
        enrolled_at: new Date(), // Reset enrolled_at to now
      },
    });
  }

}
