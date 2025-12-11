import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';


@Injectable()
export class EnrollmentProducerService {
  constructor(
    @Inject('COURSE_SERVICE') private readonly courseClient: ClientProxy,
  ) {}

  async emitCourseEnrollmentUpdated(courseId: string) {
    await lastValueFrom(
      this.courseClient.emit('course.updated', { courseId })
    );
  }

  async getCourseInfo(courseId: string) {
    const result = await lastValueFrom(
      this.courseClient.send('get_course_by_id', courseId),
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
        const related = await this.getCourseInfo(item[keyField]);
        return { ...item, [resultField]: related };
      }),
    );
    return results;
  }
}
