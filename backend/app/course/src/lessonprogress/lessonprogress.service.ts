import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';



@Injectable()
export class LessonprogressService {
  constructor(private prisma: PrismaService) { }


  async getProgress(userId: string, courseId: string) {
    const total = await this.prisma.lessons.count({
      where: { course_id: courseId },
    });

    const completed = await this.prisma.lessonProgress.count({
      where: {
        user_id: userId,
        is_completed: true,
        lesson: {
          course_id: courseId,
        },
      },
    });

    return {
      completedLessons: completed,
      totalLessons: total,
      progress: total ? completed / total : 0,
    };
  }


  async updateProgress(userId: string, lessonId: string, progress: number) {
    const progressInt = Math.floor(progress); // ✅ Đảm bảo là integer

    const result = await this.prisma.lessonProgress.upsert({
      where: { user_id_lesson_id: { user_id: userId, lesson_id: lessonId } },
      update: { progress: progressInt, last_watched_at: new Date() },
      create: { user_id: userId, lesson_id: lessonId, progress: progressInt, last_watched_at: new Date() },
    });

    console.log(`✅ Progress updated for user ${userId}, lesson ${lessonId}: ${progressInt}%`);
    return { message: 'Progress updated', progress: progressInt, data: result };
  }

  async markLessonComplete(userId: string, lessonId: string, courseId: string) {
    const result = await this.prisma.lessonProgress.upsert({
      where: { user_id_lesson_id: { user_id: userId, lesson_id: lessonId } },
      update: { is_completed: true, progress: 100, last_watched_at: new Date() },
      create: { user_id: userId, lesson_id: lessonId, is_completed: true, progress: 100, last_watched_at: new Date() },
    });

    await this.updateCourseProgress(userId, courseId);

    console.log(`✅ Lesson marked complete for user ${userId}, lesson ${lessonId}`);
    return { message: 'Lesson marked complete', data: result };
  }

  async updateCourseProgress(userId: string, courseId: string) {
    const total = await this.prisma.lessons.count({ where: { course_id: courseId } });
    const completed = await this.prisma.lessonProgress.count({
      where: {
        user_id: userId,
        is_completed: true,
        lesson: { course_id: courseId },
      },
    });

    const progress = total ? completed / total : 0;

    await this.prisma.lessonProgress.updateMany({
      where: { user_id: userId, lesson: { course_id: courseId } },
      data: { progress },
    });

    return progress;
  }
}


