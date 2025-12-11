import { Controller, Post, Body, Get, Req, UseGuards, BadRequestException, Put, Delete, Param } from '@nestjs/common';
import { RecommendService } from './recommend.service';
import { JwtAuthGuard } from '@shared/guard/jwt.guard'
import { User } from '@shared/decorator/user.decorator';
import type { Request } from 'express';

@Controller('recommend')
export class RecommendController {
  constructor(
    private readonly recommendService: RecommendService) { }

  @Post('lesson/add')
  async addLesson(@Body() body: any) {
    console.log('📥 Receive sync lesson [ADD]:', body);
    return this.recommendService.syncLesson('add', body);
  }

  @Put('lesson/update/:id')
  async updateLesson(@Param('id') id: string, @Body() body: any) {
    console.log('📥 Receive sync lesson [UPDATE]:', id);
    return this.recommendService.syncLesson('update', { ...body, id });
  }

  @Delete('lesson/delete/:id')
  async deleteLesson(@Param('id') id: string) {
    console.log('📥 Receive sync lesson [DELETE]:', id);
    return this.recommendService.syncLesson('delete', { id });
  }

  // Chỉ cho user đăng nhập mới ghi được lịch sử
  @UseGuards(JwtAuthGuard)
  @Post('log')
  async logSearch(
    @Req() req: Request,
    @User() user: any, // decorator lấy từ guard JWT
    @Body() body: any,
  ) {
    const userId = user.id; // hoặc req.user.id nếu guard gán vào req.user
    console.log('User:', user);
    console.log('Cookies:', req.cookies);
    // return { ok: true };

    const { keyword, action_type, price, course_id } = body;

    // if (!keyword) {
    //   throw new BadRequestException('keyword is required');
    // }

    return this.recommendService.logUserSearch(
      userId,
      keyword ?? null,
      action_type ?? 'search', // mặc định 'search'
      price ?? 0,
      course_id// nếu không có giá
    );
  }

  // Lấy lịch sử tìm kiếm của chính user
  @UseGuards(JwtAuthGuard)
  @Get('user-history')
  async getUserHistory(@Req() req: Request, @User() user: any) {
    const userId = user.id; // lấy userId từ token
    return await this.recommendService.getUserSearchHistory(userId);
  }

  @Get('history')
  async getHistory() {
    return await this.recommendService.getAllUserSearchHistory();
  }
}
