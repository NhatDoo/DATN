import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, lessons } from '.prisma/course-client'; // Import Prisma namespace
import { GenericService } from '@shared/core/generic.service';
import { syncCourseToService } from '@shared/ultis/synccourse.ultis';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class LessionsService extends GenericService<lessons, Prisma.lessonsDelegate> {
  constructor(private prisma: PrismaService, private readonly jwtService: JwtService,) {
    super(prisma.lessons, {},
      {
        afterCreate: async (created) => {
          await syncCourseToService('add', created, 'http://localhost:3005/lesson/add'); // Recommend
          await syncCourseToService('add', created, 'http://localhost:3006/lesson/add'); // RAG
        },
        afterUpdate: async (updated) => {
          await syncCourseToService('update', updated, 'http://localhost:3005/lesson/update');
          await syncCourseToService('update', updated, 'http://localhost:3006/lesson/update');
        },
        afterDelete: async (deleted) => {
          await syncCourseToService('delete', deleted, 'http://localhost:3005/lesson/delete');
          await syncCourseToService('delete', deleted, 'http://localhost:3006/lesson/delete');
        },
      });
  }

  async getByCourse(courseId: string) {
    return this.prisma.lessons.findMany({
      where: { course_id: courseId },
      orderBy: { order_idx: 'asc' },
    });
  }

  async createBySlug(slug: string, data: any) {
    // 1️⃣ Tìm course theo slug
    const course = await this.prisma.courses.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!course) {
      throw new NotFoundException(`Không tìm thấy khóa học có slug "${slug}"`);
    }

    const newLesson = await this.prisma.lessons.create({
      data: {
        ...data,
        course_id: course.id,
      },
    });

    if (this.hooks?.afterCreate) await this.hooks.afterCreate(newLesson);

    return newLesson;
  }

  async saveDraft(courseSlug: string, data: Partial<lessons>) {
    const course = await this.prisma.courses.findUnique({
      where: { slug: courseSlug },
    });
    if (!course) throw new Error('Course not found');

    // Nếu đã có bài học tạm thì update, không thì tạo mới
    const existing = await this.prisma.lessons.findFirst({
      where: { course_id: course.id, status: 'temp' },
    });

    if (existing) {
      const updated = await this.prisma.lessons.update({
        where: { id: existing.id },
        data,
      });
      if (this.hooks?.afterUpdate) await this.hooks.afterUpdate(updated);
      return updated;
    } else {
      const created = await this.prisma.lessons.create({
        data: { ...data, title: data.title ?? 'Bài học chưa có tiêu đề', course_id: course.id, status: 'temp' },
      });
      if (this.hooks?.afterCreate) await this.hooks.afterCreate(created);
      return created;
    }
  }

  // Lấy lại bản nháp tạm
  async getDraft(courseSlug: string) {
    const course = await this.prisma.courses.findUnique({ where: { slug: courseSlug } });
    if (!course) throw new Error('Course not found');

    return this.prisma.lessons.findFirst({
      where: { course_id: course.id, status: 'temp' },
    });
  }

  // Publish chính thức
  async publish(courseSlug: string, data: Partial<lessons>) {
    const course = await this.prisma.courses.findUnique({ where: { slug: courseSlug } });
    if (!course) throw new Error('Course not found');

    const existing = await this.prisma.lessons.findFirst({
      where: { course_id: course.id, status: 'temp' },
    });

    if (existing) {
      const updated = await this.prisma.lessons.update({
        where: { id: existing.id },
        data: { ...data, status: 'finish' },
      });
      if (this.hooks?.afterUpdate) await this.hooks.afterUpdate(updated);
      return updated;
    }
    throw new Error('No draft found');
  }

  async generateLessonAccess(id: string, currentUserId: string) {
    const lesson = await this.prisma.lessons.findUnique({
      where: { id },
      select: { id: true, title: true, media_url: true },
    });
    if (!lesson) throw new NotFoundException('Không tìm thấy bài học.');

    const token = this.jwtService.sign(
      {
        lessonId: lesson.id,
        userId: currentUserId,
      },
      {
        expiresIn: '10m',
        issuer: 'course-service',
        audience: 'lesson-viewer',
      },
    );

    return { token, accessUrl: `/lesson/secure/${token}` };
  }

  // 🧩 Giải mã token và trả về dữ liệu video
  async getLessonByToken(token: string, currentUserId: string) {
    try {
      const payload = this.jwtService.verify(token, {
        issuer: 'course-service',
        audience: 'lesson-viewer',
      });

      if (payload.userId !== currentUserId)
        throw new ForbiddenException('Không có quyền truy cập.');

      const lesson = await this.prisma.lessons.findUnique({
        where: { id: payload.lessonId },
      });
      if (!lesson) throw new NotFoundException('Bài học không tồn tại.');

      // Signed stream URL (ví dụ với MinIO)
      const streamUrl = `http://localhost:3009/upload/stream/${lesson.media_url}/playlist.m3u8`;

      return {
        title: lesson.title,
        description: lesson.content,
        streamUrl,
      };
    } catch (error) {
      throw new ForbiddenException('Token không hợp lệ hoặc đã hết hạn.');
    }
  }
}