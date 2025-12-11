import { Controller, Get, UseGuards, Param, Post, Body } from '@nestjs/common';
import { LessonprogressService } from './lessonprogress.service';
import { JwtAuthGuard } from '@shared/guard/jwt.guard';
import { User } from '@shared/decorator/user.decorator';
import { UpdateProgressDto } from './DTO/update-progress.dto';
import { MarkCompleteDto } from './DTO/mark-complete.dto';

@Controller('lessonprogress')
export class LessonprogressController {
  constructor(private service: LessonprogressService) { }


  @UseGuards(JwtAuthGuard)
  @Get('progress/:courseId')
  async getProgress(@User() user: any, @Param('courseId') courseId: string,) {
    return this.service.getProgress(user.id, courseId);
  }
  @UseGuards(JwtAuthGuard)
  @Post('update-progress')
  async updateProgress(@User() user: any, @Body() dto: UpdateProgressDto) {
    return this.service.updateProgress(user.id, dto.lessonId, dto.progress);
  }
  @UseGuards(JwtAuthGuard)
  @Post('mark-complete')
  async markComplete(@User() user: any, @Body() dto: MarkCompleteDto) {

    return this.service.markLessonComplete(user.id, dto.lessonId, dto.courseId);
  }


  @Post('internal/check-progress')
  async checkProgressInternal(@Body() body: { userId: string; courseId: string }) {
    console.log('Received internal check-progress request:', body);
    try {
      if (!body.userId || !body.courseId) {
        throw new Error('userId and courseId are required');
      }
      return await this.service.getProgress(body.userId, body.courseId);
    } catch (e) {
      console.error('Error in checkProgressInternal:', e);
      throw e;
    }
  }


}
