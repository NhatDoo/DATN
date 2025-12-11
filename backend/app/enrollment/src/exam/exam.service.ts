import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service'; // service kết nối prisma
import * as XLSX from 'xlsx';

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) { }

  async createExam(data: {
    course_id: string;
    title: string;
    description?: string;
    passing_score?: number;
    duration_minutes?: number;
    questions?: {
      question_text: string;
      question_type?: string;
      options?: any;
      correct_answer?: string;
    }[];
  }) {
    // Tạo bài kiểm tra + câu hỏi liên quan
    return this.prisma.exams.create({
      data: {
        course_id: data.course_id,
        title: data.title,
        description: data.description,
        passing_score: data.passing_score,
        duration_minutes: data.duration_minutes,
        questions: {
          create: data.questions?.map((q) => ({
            question_text: q.question_text,
            question_type: q.question_type || 'multiple_choice',
            options: q.options,
            correct_answer: q.correct_answer,
          })),
        },
      },
      include: { questions: true },
    });
  }

  async findAll() {
    return this.prisma.exams.findMany({
      include: { questions: true },
    });
  }

  async findByCourseId(courseId: string) {
    return this.prisma.exams.findFirst({
      where: { course_id: courseId },
      include: { questions: true },
    });
  }

  async findById(id: string) {
    return this.prisma.exams.findUnique({
      where: { id },
      include: { questions: true },
    });
  }

  async getExamsByCourseId(courseId: string) {
    return this.prisma.exams.findMany({
      where: { course_id: courseId },
      include: { questions: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async deleteExam(id: string) {
    return this.prisma.exams.delete({
      where: { id },
    });
  }

  async findByCourseSlug(slug: string) {
    try {
      // 1. Gọi API course service để lấy courseId từ slug
      const courseResponse = await fetch(`http://localhost:3001/course/slug/${slug}`);

      if (!courseResponse.ok) {
        throw new Error('Course not found');
      }

      const courseData = await courseResponse.json();
      const courseId = courseData.id;

      // 2. Tìm exam theo courseId
      return this.prisma.exams.findFirst({
        where: { course_id: courseId },
        include: { questions: true },
      });
    } catch (error) {
      console.error('Error finding exam by course slug:', error);
      throw error;
    }
  }

  async generateSampleExcel() {
    const workbook = XLSX.utils.book_new();
    const worksheetData = [
      [
        'Question Text',
        'Option A',
        'Option B',
        'Option C',
        'Option D',
        'Correct Answer (A/B/C/D)',
      ],
      [
        'What is 1 + 1?',
        '1',
        '2',
        '3',
        '4',
        'B',
      ],
      [
        'Capital of Vietnam?',
        'Ho Chi Minh',
        'Da Nang',
        'Hanoi',
        'Hai Phong',
        'C',
      ],
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 50 }, // Question
      { wch: 20 }, // Opt A
      { wch: 20 }, // Opt B
      { wch: 20 }, // Opt C
      { wch: 20 }, // Opt D
      { wch: 25 }, // Correct Answer
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async parseExcel(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Header 1 means array of arrays

    // Remove header row
    const rows = jsonData.slice(1) as any[][];
    const questions: any[] = [];

    for (const row of rows) {
      if (!row[0]) continue; // Skip empty rows

      const qText = row[0];
      const optA = row[1]?.toString() || '';
      const optB = row[2]?.toString() || '';
      const optC = row[3]?.toString() || '';
      const optD = row[4]?.toString() || '';
      const correct = row[5]?.toString().toUpperCase().trim();

      // Basic validation
      if (!qText || !optA || !optB || !optC || !optD || !correct) {
        continue;
      }

      // Ensure correct answer is valid
      if (!['A', 'B', 'C', 'D'].includes(correct)) {
        continue;
      }

      questions.push({
        question_text: qText,
        options: [optA, optB, optC, optD],
        correct_answer: correct
      });
    }

    return questions;
  }
}
