import { Module } from '@nestjs/common';
import { ExamAttemptsService } from './exam_attemp.service';
import { ExamAttemptsController } from './exam_attemp.controller';
import { PrismaService } from '../prisma.service';
import { CertificateModule } from '../certificate/certificate.module';


@Module({
  controllers: [ExamAttemptsController],
  providers: [ExamAttemptsService, PrismaService],
  imports: [CertificateModule],
  exports: [ExamAttemptsService],
})
export class ExamAttempModule { }
