import { Controller, Post, Body, Get, Param, Put, Query, UseGuards, Req } from '@nestjs/common';
import { LessionsService } from './lessions.service';
import { GenericController } from '@shared/core/generic.controller';
import { lessons } from '.prisma/course-client';
import { JwtAuthGuard } from '@shared/guard/jwt.guard';
import { User } from '@shared/decorator/user.decorator';
import { JwtService } from '@nestjs/jwt';


@Controller('lessions')
export class LessionsController extends GenericController<lessons, LessionsService> {
  constructor(
    private readonly lessionsService: LessionsService,
    private readonly jwtService: JwtService,
  ) {
    super(lessionsService); // kế thừa CRUD cơ bản
  }

  @Put('publish/:slug')
  async publishLesson(@Param('slug') slug: string, @Body() body: any) {
    return this.service.publish(slug, body);
  }
  /**
   * Lấy danh sách bài học theo course ID
   * GET /lessions/course/:courseId
   */
  @Get('course/:courseId')
  async getLessonsByCourse(@Param('courseId') courseId: string, @Req() req: any) {
    let userId: string | undefined = undefined;
    try {
      // 1. Lấy token từ header hoặc cookie
      const token =
        req.cookies?.access_token ||
        (req.headers.authorization?.startsWith('Bearer ')
          ? req.headers.authorization.split(' ')[1]
          : null);

      if (token) {
        // 2. Decode token để lấy userId
        const payload = this.jwtService.decode(token);
        if (payload && (payload.sub || payload.id)) {
          userId = payload.sub || payload.id;
        }
      }
    } catch (error) {
      console.error('Error extracting user from token:', error);
    }

    return this.lessionsService.getByCourse(courseId, userId);
  }
  /**
   * Tạo bài học mới hoặc lưu nháp theo slug của course
   * POST /lessions/by-slug/:slug
   */
  @Post('by-slug/:slug')
  async createBySlug(@Param('slug') slug: string, @Body() body: any) {
    return this.lessionsService.createBySlug(slug, body);
  }

  @Get('secure')
  @UseGuards(JwtAuthGuard)
  async getLessonByToken(@Query('token') token: string, @User() user: any) {
    return this.lessionsService.getLessonByToken(token, user.id);
  }


  @Get('access/:id')
  @UseGuards(JwtAuthGuard)
  async generateLessonAccess(@Param('id') id: string, @User() user: any) {
    return this.lessionsService.generateLessonAccess(id, user.id);
  }

  /**
 * (Tuỳ chọn) Lưu bản nháp tự động khi người dùng đang soạn
 * POST /lessions/draft/:slug
 */
  @Post('draft/:slug')
  async saveDraft(@Param('slug') slug: string, @Body() body: any) {
    return this.lessionsService.saveDraft(slug, body);
  }

  @Get('draft/:slug')
  async getDraft(@Param('slug') slug: string) {
    return this.lessionsService.getDraft(slug);
  }

}
