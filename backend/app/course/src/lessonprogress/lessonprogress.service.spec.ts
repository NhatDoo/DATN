import { Test, TestingModule } from '@nestjs/testing';
import { LessonprogressService } from './lessonprogress.service';

describe('LessonprogressService', () => {
  let service: LessonprogressService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LessonprogressService],
    }).compile();

    service = module.get<LessonprogressService>(LessonprogressService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
