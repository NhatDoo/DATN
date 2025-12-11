import { Module } from '@nestjs/common';
import { UploadModule } from './upload/upload.module';
import { ConvertModule } from './covert/convert.module';
import { MinioModule } from './minio/minio.module';


@Module({
imports: [MinioModule, ConvertModule, UploadModule],
})
export class AppModule {}