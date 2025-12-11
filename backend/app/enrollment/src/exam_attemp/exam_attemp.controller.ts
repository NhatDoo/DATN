import { Controller, Post, Body, Param, Get, UseGuards } from '@nestjs/common';
import { ExamAttemptsService } from './exam_attemp.service';
import { JwtAuthGuard } from '@shared/guard/jwt.guard';
import { User } from '@shared/decorator/user.decorator';

@Controller('exam-attempts')
export class ExamAttemptsController {
  constructor(private readonly service: ExamAttemptsService) { }


  @UseGuards(JwtAuthGuard)
  @Post('start')
  start(@Body() body: { exam_id: string }, @User() user: any) {
    return this.service.startAttempt(user.id, body.exam_id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':attemptId/submit')
  submit(
    @Param('attemptId') attemptId: string,
    @Body() body: { answers: { question_id: string; selected_answer: string }[] },
    @User() user: any
  ) {
    return this.service.submitAttempt(attemptId, body.answers, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':attemptId')
  getAttempt(@Param('attemptId') attemptId: string, @User() user: any) {
    return this.service.getAttempt(attemptId, user.id);
  }
}
