import { Module } from '@nestjs/common';
import { RecommendModule } from './recommend/recommend.module';

@Module({
  imports: [RecommendModule],
})
export class AppModule {}
