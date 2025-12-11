import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Get,
  Param,
  Res,
  Query,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import type { Response } from 'express';
import { ConvertService } from '../covert/convert.service';
import { MinioService } from '../minio/minio.service';
import { StreamService } from './stream.service';

@Controller('upload')
export class UploadController {
  constructor(
    private readonly convertService: ConvertService ,
    private readonly minioService: MinioService,
    private readonly streamService: StreamService) {}

  // ======================
  // 🎬 UPLOAD VIDEO CHÍNH
  // ======================
  @Post('video')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './storage/uploads',
        filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
      }),
    }),
  )
  async uploadVideo(@UploadedFile() file: Express.Multer.File, @Body('courseId') courseId: string) {
    const localPath = path.resolve(file.path);

    const { playlistUrl, folderName } = await this.convertService.mp4ToHlsAndUpload(
      localPath,
      file.originalname,
      'video', // dùng bucket video chính
    );

    fs.unlinkSync(localPath);
    return { message: '✅ Upload & convert thành công', playlistUrl, folderName };
  }

  // ======================
  // 🧪 UPLOAD VIDEO TẠM
  // ======================
  @Post('temp')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './storage/temp',
        filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
      }),
    }),
  )
  async uploadTempVideo(@UploadedFile() file: Express.Multer.File) {
    const localPath = path.resolve(file.path);

    // Convert và upload vào bucket tạm (tempvideo)
    const { folderName , duration } = await this.convertService.mp4ToHlsAndUpload(
      localPath,
      file.originalname,
      'tempvideo', // bucket tạm
    );

    fs.unlinkSync(localPath);

    const playlistUrl = `http://localhost:3009/upload/temp-stream/${folderName}/playlist.m3u8`;
    return {
      message: '🕓 Upload video tạm thành công',
      playlistUrl,
      folderName,
      expiresIn: '1h', // bạn có thể config thêm
      duration,
    };
  }

  // ======================
  // 📺 UPLOAD IMAGE
  // ======================

@Post('image')
@UseInterceptors(
  FileInterceptor('file', {
    storage: diskStorage({
      destination: './storage/uploads',
      filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
    }),
  }),
)

async uploadImage(@UploadedFile() file: Express.Multer.File) {
  const localPath = path.resolve(file.path);
  const imageUrl = await this.convertService.minioService.uploadImage(
    localPath,
    file.originalname,
    file.mimetype,
  );

  fs.unlinkSync(localPath); // Xóa file local sau khi upload
  return { message: 'Upload ảnh thành công', imageUrl };
}

// ======================
// 🚀 ĐĂNG VIDEO TỪ TEMP → VIDEO CHÍNH
// ======================
@Post('publish/:folder')
async publishVideo(@Param('folder') folder: string) {
  const tempBucket = 'tempvideo';
  const mainBucket = 'video';

  await this.convertService.minioService.copyFolder(folder, tempBucket, mainBucket);
  await this.convertService.minioService.deleteFolder(folder, tempBucket);

  // ✅ Đọc playlist
  const oldPlaylist = await this.convertService.minioService.getObjectAsString(mainBucket, `${folder}/playlist.m3u8`);

  // ✅ Ghi lại với đường dẫn hợp lệ
  const fixedPlaylist = oldPlaylist.replace(
    /\/tempvideo\/[^/]+\//g,
    `/video/${folder}/`
  );

  await this.convertService.minioService.uploadString(mainBucket, `${folder}/playlist.m3u8`, fixedPlaylist, 'application/x-mpegURL');

  const playlistUrl = await this.convertService.minioService.getPresignedDownloadUrl(
    `${folder}/playlist.m3u8`,
    3600,
    mainBucket
  );

  return {
    message: '🚀 Đăng video thành công!',
    playlistUrl,
    folderName: folder,
  };
}

  @Get('stream/:folder/:file')
  async streamFromVideo(
    @Param('folder') folder: string,
    @Param('file') file: string,
    @Res() res: Response,
  ) {
    return this.streamService.streamFromBucket('video', folder, file, res);
  }

  // 🧩 Stream video tạm (temp)
  @Get('temp-stream/:folder/:file')
  async streamFromTempVideo(
    @Param('folder') folder: string,
    @Param('file') file: string,
    @Res() res: Response,
  ) {
    return this.streamService.streamFromBucket('tempvideo', folder, file, res);
  }

  // ======================
  // 🗑️ XOÁ VIDEO
  // ======================
  @Delete(':folder')
  async deleteVideo(@Param('folder') folder: string) {
    await this.convertService.minioService.deleteFolder(folder , 'tempvideo');
    return { message: `🗑️ Đã xoá video folder: ${folder}` };
  }

  @Get('signed-url')
  async getSignedUrl(@Query('path') path: string) {
    // Nếu path chứa "localhost:9000/", ta loại bỏ phần này
    const cleanPath = path.replace(/^.*localhost:9000\//, '');

    const signedUrl = await this.convertService.minioService.getPresignedDownloadUrl(cleanPath, 3600);
    return { signedUrl };
  }



  
}
