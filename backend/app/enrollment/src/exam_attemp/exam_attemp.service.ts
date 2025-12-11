import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CertificateService } from '../certificate/certificate.service';

@Injectable()
export class ExamAttemptsService {
  constructor(
    private prisma: PrismaService,
    private certificateService: CertificateService
  ) { }

  async startAttempt(userId: string, examId: string) {
    // 1. Lấy thông tin exam để biết course_id
    const exam = await this.prisma.exams.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new BadRequestException('Exam not found');
    }

    // 2. Gọi sang Service Course để check progress
    try {
      // Giả sử service Course chạy ở port 3001
      const response = await fetch('http://localhost:3001/lessonprogress/internal/check-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          courseId: exam.course_id,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to check progress. Status: ${response.status} ${response.statusText}. Response: ${errorText}`);
      }

      const data = await response.json();
      // data: { completedLessons, totalLessons, progress: 0..1 }

      const progressPercent = (data.progress || 0) * 100;

      if (progressPercent < 80) {
        throw new BadRequestException(`Bạn cần hoàn thành ít nhất 80% khóa học để làm bài kiểm tra. Tiến độ hiện tại: ${Math.round(progressPercent)}%`);
      }

    } catch (error) {
      console.error('Error checking progress:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      // Nếu lỗi kết nối thì có thể cho qua hoặc chặn, ở đây mình chặn cho an toàn
      throw new BadRequestException('Không thể kiểm tra tiến độ học tập. Vui lòng thử lại sau.');
    }

    return this.prisma.exam_attempts.create({
      data: { user_id: userId, exam_id: examId, started_at: new Date() },
    });
  }

  async submitAttempt(
    attemptId: string,
    answers: { question_id: string; selected_answer: string }[],
    userId: string
  ) {
    const attempt = await this.prisma.exam_attempts.findUnique({
      where: { id: attemptId },
    });
    if (!attempt) throw new Error('Attempt not found');
    if (attempt.user_id !== userId) throw new Error('Unauthorized');

    // Lấy danh sách câu hỏi
    const questions = await this.prisma.questions.findMany({
      where: { exam_id: attempt.exam_id },
    });

    // Tính điểm
    let correctCount = 0;
    const answerMap = Object.fromEntries(
      answers.map(a => [a.question_id, a.selected_answer])
    );

    for (const q of questions) {
      if (answerMap[q.id] && answerMap[q.id] === q.correct_answer) {
        correctCount++;
      }
    }

    const score = Math.round((correctCount / questions.length) * 100);
    const exam = await this.prisma.exams.findUnique({ where: { id: attempt.exam_id } });
    const passed = exam && score >= (exam.passing_score ?? 50); // Default passing score 50 if null

    // Tính thời gian làm bài (giây)
    const timeTaken = attempt.started_at
      ? Math.floor((new Date().getTime() - new Date(attempt.started_at).getTime()) / 1000)
      : 0;

    const updated = await this.prisma.exam_attempts.update({
      where: { id: attemptId },
      data: {
        score,
        passed: passed || false, // ensure boolean
        submitted_at: new Date(),
        answers: answerMap,
      },
    });

    // === CẤP CHỨNG CHỈ NẾU ĐẬU ===
    if (passed && exam) {
      try {
        await this.certificateService.generateCertificate(userId, exam.course_id);
      } catch (err) {
        console.error('Error generating certificate:', err);
        // Không block return chỉ vì lỗi tạo chứng chỉ, nhưng nên log lại
      }
    }

    return {
      ...updated,
      correct_count: correctCount,
      total_questions: questions.length,
      time_taken: timeTaken,
    };
  }

  async getAttempt(attemptId: string, userId: string) {
    const attempt = await this.prisma.exam_attempts.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) throw new Error('Attempt not found');
    if (attempt.user_id !== userId) throw new Error('Unauthorized');

    return attempt;
  }
}
