import { Post, Body, UseGuards, Get, Controller, Req, BadRequestException, Param, NotFoundException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { GenericController } from '@shared/core/generic.controller';
import { reviews } from '.prisma/course-client';
import { JwtAuthGuard } from '@shared/guard/jwt.guard';
import { User } from '@shared/decorator/user.decorator';


@Controller('reviews')
export class ReviewsController extends GenericController<reviews, ReviewsService> {
  constructor(private readonly reviewsService: ReviewsService) {
    super(reviewsService); // 
  }
  @UseGuards(JwtAuthGuard)
  @Post('addreviews')
  async createReview(

    @Body() body: { course_id: string; rating: number; title?: string; content?: string },
    @User() user: any
  ) {
    const userId = user.id;
    if (!userId) throw new BadRequestException('Không thể xác định user.');

    return this.reviewsService.create({
      course: {
        connect: { id: body.course_id }
      },
      user_id: userId,
      rating: body.rating,
      title: body.title,
      content: body.content,
    });
  }




  @Get('by-course/:slug')
  async getReviewsByCourse(@Param('slug') slug: string) {
    const result = await this.reviewsService.findByCourseSlug(slug);
    if (!result) {
      throw new NotFoundException('Course not found');
    }
    return result;
  }
}