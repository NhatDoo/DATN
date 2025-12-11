import { Controller, Param, Get, UseGuards } from '@nestjs/common';
import { EventPattern, Payload, MessagePattern } from '@nestjs/microservices';
import { CourseService } from './course.service';
import { GenericController } from '@shared/core/generic.controller';
import { courses } from '.prisma/course-client';
import { JwtAuthGuard } from '@shared/guard/jwt.guard';
import { User } from '@shared/decorator/user.decorator';


@Controller('course')
export class CourseController extends GenericController<courses, CourseService> {
  constructor(private readonly courseService: CourseService) {
    super(courseService); // nạp service vào generic
  }
  @Get()
  async findAll() {
    return this.courseService.findAll();
  }
  @Get('coursedetail')
  async findcoursedetail() {
    return this.courseService.getCourseDetail();
  }
  @Get('user')
  @UseGuards(JwtAuthGuard)
  async getByUserId(@User() user: any) {
    return this.courseService.findByUserId(user.id);
  }
  @Get('slug/:slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.courseService.findBySlug(slug);
  }

  @Get(':id/categories')
  async getCourseCategories(@Param('id') id: string) {
    return this.courseService.getCourseCategories(id);
  }























  // === SAGA EVENT HANDLER === //

  @EventPattern('course.updated')
  async handleEnrollmentUpdate(@Payload() data: { courseId: string }) {
    console.log('📩 Received course.enrollment.updated event:', data);
    await this.courseService.incrementEnrollmentCount(data.courseId);
  }

  @MessagePattern('get_course_by_id')
  async handleGetCourseById(@Payload() id: string) {
    const course = await this.courseService.getCourseById(id);

    if (!course) {
      return { error: 'Course not found' };
    }

    return JSON.parse(
      JSON.stringify(course, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );
  }
}

