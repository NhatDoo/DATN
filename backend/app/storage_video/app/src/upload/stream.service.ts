import { Injectable, Res } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import { MinioService } from '../minio/minio.service'; // import service Minio hiện có

@Injectable()
export class StreamService {
  constructor(private readonly minioService: MinioService) {}

  async streamFromBucket(bucket: string, folder: string, file: string, res: Response) {
    try {
      const key = `${folder}/${file}`;
      const stream = await this.minioService.getFileStream(bucket, key);

      const ext = path.extname(file).toLowerCase();
      const contentType =
        ext === '.ts'
          ? 'video/MP2T'
          : ext === '.m3u8'
          ? 'application/vnd.apple.mpegurl'
          : 'application/octet-stream';

      res.setHeader('Content-Type', contentType);
      stream.pipe(res);
    } catch (error) {
      console.error(`❌ Lỗi stream segment từ bucket ${bucket}:`, error);
      res.status(404).send('Không tìm thấy file');
    }
  }
}
