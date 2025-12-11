import { IsUUID, IsNumber, Min, Max } from 'class-validator';

export class UpdateProgressDto {
  @IsUUID()
  lessonId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number;
}
