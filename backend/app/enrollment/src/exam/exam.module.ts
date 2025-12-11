import { Module } from '@nestjs/common';
import { ExamsService } from './exam.service';
import { ExamsController } from './exam.controller';
import { PrismaService } from '../prisma.service';


@Module({
  controllers: [ExamsController],
  providers: [ExamsService, PrismaService],
  exports: [ExamsService],
})
export class ExamModule {}
