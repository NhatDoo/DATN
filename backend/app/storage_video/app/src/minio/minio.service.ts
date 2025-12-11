import { Injectable , Logger } from '@nestjs/common';
import {
  S3Client,
  
  PutObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  CreateBucketCommand,
  HeadBucketCommand,
  CopyObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';


@Injectable()
export class MinioService {
  private readonly logger = new Logger(MinioService.name);
  private s3: S3Client;
  private defaultBucket = process.env.MINIO_BUCKET || 'video';
  private tempBucket = 'tempvideo';
  private backgroundBucket = 'background';
  
  

  constructor() {
    const endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
    this.s3 = new S3Client({
      region: 'us-east-1',
      endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || 'admin',
        secretAccessKey: process.env.MINIO_SECRET_KEY || 'Nhat123456789',
      },
    });
  }

  /** 📦 Xác định bucket sử dụng */
  private getBucket(bucketName?: string) {
    console.log('🔹 Using bucket:', bucketName || this.defaultBucket);
    return bucketName || this.defaultBucket;
  }

  /** 📤 Upload file lên MinIO */
  async uploadFile(objectKey: string, filePath: string, contentType?: string, bucketName?: string) {
    const bucket = this.getBucket(bucketName);
    const body = fs.createReadStream(filePath);
    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: body,
      ContentType: contentType,
    });
    await this.s3.send(cmd);

    return `http://localhost:9000/${bucket}/${objectKey}`;

  }

  /** 🔗 Lấy link tải tạm (presigned) */
  async getPresignedDownloadUrl(objectKey: string, expiresInSec = 300, bucketName?: string) {
    const bucket = this.getBucket(bucketName);
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: objectKey });
    return getSignedUrl(this.s3, cmd, { expiresIn: expiresInSec });
  }

  /** 🗑️ Xoá toàn bộ folder trong bucket */
  async deleteFolder(folderName: string, bucketName?: string) {
    const bucket = this.getBucket(bucketName);
    const prefix = `${folderName}/`;

    const listCmd = new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix });
    const listRes = await this.s3.send(listCmd);
    const objects = listRes.Contents || [];

    if (objects.length === 0) {
      console.warn(`⚠️ Không tìm thấy file nào trong thư mục "${folderName}" của bucket "${bucket}"`);
      return;
    }

    const deleteCmd = new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: objects.map((obj) => ({ Key: obj.Key! })),
      },
    });

    const deleteRes = await this.s3.send(deleteCmd);
    console.log(`🗑️ Đã xoá ${deleteRes.Deleted?.length || 0} file trong bucket "${bucket}"`);
  }



    async uploadImage(filePath: string, originalName: string, mimetype: string) {
    const ext = path.extname(originalName);
    const fileName = `${Date.now()}${ext}`;
    const objectKey = `${fileName}`;
    const contentType = mimetype || 'image/jpeg';
    return this.uploadFile(objectKey, filePath, contentType, this.backgroundBucket);
  }

async copyFolder(folder: string, sourceBucket: string, targetBucket: string) {
    await this.ensureBucketExists(targetBucket);

    const list = await this.s3.send(
      new ListObjectsV2Command({ Bucket: sourceBucket, Prefix: `${folder}/` }),
    );

    for (const obj of list.Contents ?? []) {
      if (!obj.Key) continue;
      await this.s3.send(
        new CopyObjectCommand({
          Bucket: targetBucket,
          CopySource: `/${sourceBucket}/${obj.Key}`,
          Key: obj.Key,
        }),
      );
    }

    this.logger.log(`📦 Đã copy folder "${folder}" từ ${sourceBucket} sang ${targetBucket}`);
  }
    private async ensureBucketExists(bucket: string) {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch {
      await this.s3.send(new CreateBucketCommand({ Bucket: bucket }));
      this.logger.log(`🪣 Tạo bucket mới: ${bucket}`);
    }
  }
  async getObjectAsString(bucket: string, key: string): Promise<string> {
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  const res = await this.s3.send(cmd);
  const stream = res.Body as Readable;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf-8');
}
async uploadString(bucket: string, key: string, content: string, contentType = 'text/plain') {
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: content,
    ContentType: contentType,
  });
  await this.s3.send(cmd);
}
  async getFileStream(bucket: string, key: string): Promise<Readable> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await this.s3.send(command);
    return response.Body as Readable; // trả về stream
  }


}
