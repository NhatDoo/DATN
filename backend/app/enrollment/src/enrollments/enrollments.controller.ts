import { Controller, Get, Query, UseGuards, Post, Body } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { GenericController } from '@shared/core/generic.controller';
import { enrollments } from '.prisma/enrollments_client';
import { EventPattern } from '@nestjs/microservices';
import { JwtAuthGuard } from '@shared/guard/jwt.guard';
import { User } from '@shared/decorator/user.decorator';


@Controller('enrollments')
export class EnrollmentsController extends GenericController<enrollments, EnrollmentsService> {
  constructor(private readonly enrollmentsService: EnrollmentsService) {
    super(enrollmentsService);
  }

  @Get()
  async findAll() {
    return this.enrollmentsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get("my-courses")
  async myCourses(@User() user: any) {
    const userId = user.id
    return this.enrollmentsService.findCoursesByUser(userId);
  }

  @EventPattern('payment.success')
  async handlePaymentSuccess(data: { orderId: string; userId: string; courseIds: string[] }) {
    const { userId, courseIds } = data;
    await this.enrollmentsService.createEnrollments(userId, courseIds);
  }

  @Get('verify')
  async verifyEnrollment(
    @Query('userId') userId: string,
    @Query('courseId') courseId: string,
  ) {
    if (!userId || !courseId) {
      return { success: false, message: 'Missing userId or courseId' };
    }

    const enrollment = await this.enrollmentsService.getEnrollment(userId, courseId);
    const isEnrolled = !!enrollment;
    return {
      success: true,
      userId,
      courseId,
      isEnrolled,
      status: enrollment?.status,
      message: isEnrolled
        ? 'Đã đăng ký'
        : 'Chưa đăng ký',
    };
  }

  @Post('activate')
  async activate(@Body() body: { userId: string; courseId: string }) {
    const { userId, courseId } = body;
    if (!userId || !courseId) {
      // Should probably throw exception or return error object, trying to match style
      return { success: false, message: 'Missing parameters' };
    }
    try {
      const res = await this.enrollmentsService.activateEnrollment(userId, courseId);
      return { success: true, data: res };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }
}
