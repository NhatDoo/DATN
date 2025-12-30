import { Module } from '@nestjs/common';
import { CategoriesModule } from './categories/catergories.module';
import { CourseModule } from './course/course.module';
import { LessionsModule } from './lessions/lessions.module';
import { ReviewsModule } from './reviews/reviews.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '@shared/core/strategies/jwt.strategy';
import { LessonprogressModule } from './lessonprogress/lessonprogress.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [

    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || '59efedfdabdd1cfb6321d61887a52e73b65db593e961a35cbc6e8db80972631237dda83d0f9d88cb9db094f066e6f8d98351a86c6d813fd6d60d61a1e2f06317',
      signOptions: { expiresIn: '1h' },
    }),
    CategoriesModule, CourseModule, LessionsModule, ReviewsModule, LessonprogressModule, ReportsModule],
  providers: [JwtStrategy]
})
export class AppModule { }
