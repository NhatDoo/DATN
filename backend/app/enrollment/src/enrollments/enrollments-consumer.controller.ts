import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EnrollmentsService } from './enrollments.service';
import { PrismaService } from '../prisma.service';

@Controller()
export class EnrollmentConsumerController {
  private readonly logger = new Logger(EnrollmentConsumerController.name);

  constructor(
    private readonly enrollmentsService: EnrollmentsService,
    private readonly prisma: PrismaService,
    
  ) {
      console.log('🚀 EnrollmentConsumerController initialized');
      
  }

  @EventPattern('refund.enrollment')
  async handleRefundEnrollment(
    @Payload() data: { orderId: string; userId: string; courseIds: string[] },
  ) {
    try {
      const { orderId, userId, courseIds } = data;
      this.logger.log(`🧾 Nhận sự kiện refund.enrollment: ${JSON.stringify(data)}`);
      console.log('Refund enrollment với courseIds:', courseIds);

      if (!courseIds?.length) {
        this.logger.warn(`Không có courseIds trong sự kiện refund.enrollment`);
        return;
      }

      await this.prisma.enrollments.deleteMany({
        where: {
          user_id: userId,
          course_id: { in: courseIds },
        },
      });

      this.logger.log(`✅ Đã xóa enrollments cho user ${userId} với courses: ${courseIds.join(', ')}`);
    } catch (error) {
      this.logger.error('❌ Lỗi khi xử lý refund.enrollment', error);
    }
  }
}
