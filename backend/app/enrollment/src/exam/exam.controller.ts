import { Controller, Post, Body, Get, Param, UseInterceptors, UploadedFile, Res, Delete } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ExamsService } from './exam.service';

@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) { }

  @Post('create')
  async createExam(@Body() body: any) {
    return this.examsService.createExam(body);
  }

  @Get()
  async getAllExams() {
    return this.examsService.findAll();
  }

  @Get('sample-excel')
  async downloadSampleExcel(@Res() res: Response) {
    const buffer = await this.examsService.generateSampleExcel();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=sample-questions.xlsx',
      'Content-Length': buffer.length.toString(),
    });
    res.send(buffer);
  }

  @Post('parse-excel')
  @UseInterceptors(FileInterceptor('file'))
  async parseExcelQuestions(@UploadedFile() file: any) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.examsService.parseExcel(file.buffer);
  }

  @Get('course/:courseId')
  async getExamByCourse(@Param('courseId') courseId: string) {
    return this.examsService.findByCourseId(courseId);
  }

  @Get('course-slug/:slug')
  async getExamByCourseSlug(@Param('slug') slug: string) {
    return this.examsService.findByCourseSlug(slug);
  }

  @Get(':id')
  async getExamById(@Param('id') id: string) {
    return this.examsService.findById(id);
  }

  @Get('course/:courseId/list')
  async getExamsListByCourse(@Param('courseId') courseId: string) {
    return this.examsService.getExamsByCourseId(courseId);
  }

  @Delete(':id')
  async deleteExam(@Param('id') id: string) {
    return this.examsService.deleteExam(id);
  }
}
