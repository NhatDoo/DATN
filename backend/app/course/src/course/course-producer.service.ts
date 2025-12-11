import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class CourseProducerService {
  constructor(
    private prisma: PrismaService,
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy, // ✅ inject chuẩn
  ) {

  }

  async getInstructorInfo(userId: string) {
    const result = await lastValueFrom(
      this.userClient.send('get_user_by_id', userId),
    );
    return result;
  }


  async addResponseRelationWithProducer(
    courses: any[],
    keyField: string,
    resultField: string,
  ) {
    const results = await Promise.all(
      courses.map(async (item) => {
        const related = await this.getInstructorInfo(item[keyField]);
        return { ...item, [resultField]: related };
      }),
    );
    return results;
  }


 async getUsers(userId: string , username : string) {
    const result = await lastValueFrom(
      this.userClient.send('get_user_by_id', userId),
    );
    return result;
  }

  async notifyUserCourseCreated(userId: string, courseId: string) {
    await lastValueFrom(
      this.userClient.emit('user.course_created', { userId, courseId }),
    );
  }
}
