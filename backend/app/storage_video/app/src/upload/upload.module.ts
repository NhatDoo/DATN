import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { ConvertModule } from '../covert/convert.module';
import { MinioModule } from '../minio/minio.module';
import { StreamService } from './stream.service';


@Module({ imports: [ConvertModule, MinioModule], providers: [StreamService], controllers: [UploadController] })
export class UploadModule {}