import { Module } from '@nestjs/common';
import { ConvertService } from './convert.service';
import { MinioModule } from '../minio/minio.module';


@Module({ imports: [MinioModule], providers: [ConvertService], exports: [ConvertService] })
export class ConvertModule {}