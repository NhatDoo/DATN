import { Module } from '@nestjs/common';
import { CertificateModule } from './certificate/certificate.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { ExamModule } from './exam/exam.module';
import { ExamAttempModule } from './exam_attemp/exam_attemp.module';

@Module({
  imports: [CertificateModule, EnrollmentsModule, ExamModule, ExamAttempModule],
})
export class AppModule {}
