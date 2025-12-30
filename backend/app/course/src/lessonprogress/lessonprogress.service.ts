import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CourseProducerService } from '../course/course-producer.service';



@Injectable()
export class LessonprogressService {
  constructor(
    private prisma: PrismaService,
    private courseProducer: CourseProducerService
  ) { }

  async getProgress(userId: string, courseId: string) {
    const total = await this.prisma.lessons.count({
      where: { course_id: courseId },
    });

    const completedLessons = await this.prisma.lessonProgress.findMany({
      where: {
        user_id: userId,
        is_completed: true,
        lesson: {
          course_id: courseId,
        },
      },
      select: { lesson_id: true }
    });

    const completedCount = completedLessons.length;

    return {
      completedLessons: completedCount,
      totalLessons: total,
      progress: total ? completedCount / total : 0,
      completedLessonIds: completedLessons.map(l => l.lesson_id),
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

    // Removed incorrect updateMany call
    return progress;
  }

  async getStudentProgressForCourse(courseId: string, userId: string) {
    // Verify instructor
    const course = await this.prisma.courses.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    if (course.instructor_id !== userId) {
      throw new ForbiddenException('You are not the instructor of this course');
    }

    // 1. Get all lesson progress for this course
    const progressRecords = await this.prisma.lessonProgress.findMany({
      where: { lesson: { course_id: courseId } },
      include: { lesson: true }
    });

    // 2. Group by user
    const userProgress = new Map<string, { total: number, completed: number, last_watched: Date }>();

    // We also need total lessons in course to calculate percentage
    const totalLessons = await this.prisma.lessons.count({ where: { course_id: courseId } });

    progressRecords.forEach(record => {
      if (!userProgress.has(record.user_id)) {
        userProgress.set(record.user_id, { total: 0, completed: 0, last_watched: record.last_watched_at || new Date(0) });
      }
      const stats = userProgress.get(record.user_id)!;
      // stats.total++; // This is lessons started/tracked.
      if (record.is_completed) stats.completed++;
      if (record.last_watched_at && record.last_watched_at > stats.last_watched) {
        stats.last_watched = record.last_watched_at;
      }
    });

    // 3. Format result
    const result: any[] = [];
    for (const [userId, stats] of userProgress) {
      result.push({
        user_id: userId,
        completed_lessons: stats.completed,
        total_lessons: totalLessons,
        progress_percentage: totalLessons > 0 ? (stats.completed / totalLessons) * 100 : 0,
        last_watched_at: stats.last_watched
      });
    }

    // 4. Enrich with user info
    if (result.length > 0) {
      return await this.courseProducer.addResponseRelationWithProducer(result, 'user_id', 'user');
    }
    return [];
  }
}


