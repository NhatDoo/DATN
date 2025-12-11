import { Test, TestingModule } from '@nestjs/testing';
import { LessonprogressController } from './lessonprogress.controller';

describe('LessonprogressController', () => {
  let controller: LessonprogressController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LessonprogressController],
    }).compile();

    controller = module.get<LessonprogressController>(LessonprogressController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
