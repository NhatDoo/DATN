import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CategorieController } from './categories.controller';
import { CategoriesService } from './catergrories.service';     

@Module({
  imports: [],
  controllers: [CategorieController],
  providers: [CategoriesService,PrismaService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
