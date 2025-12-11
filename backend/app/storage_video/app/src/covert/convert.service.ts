// import { Injectable, Logger } from '@nestjs/common';
// import { spawn } from 'child_process';
// import * as path from 'path';
// import * as fs from 'fs';
// import { MinioService } from '../minio/minio.service';
// import { randomUUID } from 'crypto';

// @Injectable()
// export class ConvertService {
//   private readonly logger = new Logger(ConvertService.name);
//   private readonly tmpBase = path.join(process.cwd(), '../hls_output', 'BG');

//   constructor(public readonly minioService: MinioService) {
//     if (!fs.existsSync(this.tmpBase)) fs.mkdirSync(this.tmpBase, { recursive: true });
//   }

//   /**
//    * 🧭 Convert MP4 → HLS và upload lên MinIO (bucket có thể là tạm hoặc chính)
//    */
//   async mp4ToHlsAndUpload(
//     localMp4Path: string,
//     originalName: string,
//     bucket: string = 'tempvideo', // mặc định lưu tạm
//   ) {
//     const uniqueId = randomUUID().slice(0, 10);
//     const outputName = `${path.parse(originalName).name}_${uniqueId}`;
//     const workDir = this.prepareWorkDir(outputName);
//     const playlistPath = path.join(workDir, 'playlist.m3u8');

//     // 1️⃣ Convert video sang HLS (.ts + playlist)
//     await this.convertToHls(localMp4Path, playlistPath);

//     // 2️⃣ Lấy danh sách .ts
//     const tsFiles = this.listTsFiles(workDir);

//     // 3️⃣ Upload toàn bộ .ts segment song song
//     await this.uploadTsSegments(outputName, workDir, tsFiles, bucket);

//     // 4️⃣ Tạo playlist có URL presigned
//     const signedPlaylistPath = await this.createSignedPlaylist(workDir, playlistPath, outputName, tsFiles, bucket);

//     // 5️⃣ Upload playlist
//     const playlistKey = `${outputName}/playlist.m3u8`;
//     await this.minioService.uploadFile(playlistKey, signedPlaylistPath, 'application/vnd.apple.mpegurl', bucket);

//     // 6️⃣ Lấy URL xem video
//     const signedPlaylistUrl = await this.minioService.getPresignedDownloadUrl(playlistKey, 3600, bucket);

//     // 7️⃣ Dọn tạm
//     this.cleanup(workDir);

//     return { playlistUrl: signedPlaylistUrl, folderName: outputName, bucket };
//   }

//   // =========================
//   // 🧱 HÀM PHỤ TRỢ
//   // =========================

//   private prepareWorkDir(outputName: string): string {
//     const workDir = path.join(this.tmpBase, outputName);
//     if (!fs.existsSync(workDir)) fs.mkdirSync(workDir, { recursive: true });
//     return workDir;
//   }

//   private async convertToHls(localPath: string, playlistPath: string): Promise<void> {
//     return new Promise<void>((resolve, reject) => {
//       const args = [
//         '-i', localPath,
//         '-profile:v', 'baseline',
//         '-level', '3.0',
//         '-start_number', '0',
//         '-hls_time', '6',
//         '-hls_list_size', '0',
//         '-f', 'hls',
//         playlistPath,
//       ];

//       const ff = spawn('ffmpeg', args);
//       ff.stderr.on('data', (d) => this.logger.debug(d.toString()));
//       ff.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg failed (${code})`))));
//     });
//   }

//   private listTsFiles(workDir: string): string[] {
//     return fs.readdirSync(workDir).filter((f) => f.endsWith('.ts'));
//   }

//   private async uploadTsSegments(outputName: string, workDir: string, tsFiles: string[], bucket: string) {
//     await Promise.all(
//       tsFiles.map(async (f) => {
//         const abs = path.join(workDir, f);
//         const key = `${outputName}/${f}`;
//         await this.minioService.uploadFile(key, abs, 'video/MP2T', bucket);
//       }),
//     );
//   }

//   private async createSignedPlaylist(
//     workDir: string,
//     playlistPath: string,
//     outputName: string,
//     tsFiles: string[],
//     bucket: string,
//   ): Promise<string> {
//     let playlist = fs.readFileSync(playlistPath, 'utf8');

//     for (const f of tsFiles) {
//       const key = `${outputName}/${f}`;
//       const signedUrl = await this.minioService.getPresignedDownloadUrl(key, 3600, bucket);
//       playlist = playlist.replace(new RegExp(f, 'g'), signedUrl);
//     }

//     const signedPath = path.join(workDir, 'playlist_signed.m3u8');
//     fs.writeFileSync(signedPath, playlist);
//     return signedPath;
//   }

//   private cleanup(workDir: string) {
//     try {
//       fs.rmSync(workDir, { recursive: true, force: true });
//     } catch (err) {
//       this.logger.warn(`Không thể xóa thư mục tạm ${workDir}: ${err.message}`);
//     }
//   }
// }














import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { MinioService } from '../minio/minio.service';
import ffmpeg from 'fluent-ffmpeg';
import { randomUUID } from 'crypto';

@Injectable()
export class ConvertService {
  private readonly logger = new Logger(ConvertService.name);
  private readonly tmpBase = path.join(process.cwd(), '../hls_output', 'BG');

  constructor(public readonly minioService: MinioService) {
    if (!fs.existsSync(this.tmpBase)) fs.mkdirSync(this.tmpBase, { recursive: true });
  }
  

  async getVideoDuration(localPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(localPath, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata.format.duration || 0);
      });
    });
  }
  /**
   * 🎬 Convert MP4 → HLS (.m3u8 + .ts) và upload lên MinIO (bucket tạm hoặc chính)
   * - Không ký sẵn URL để tránh lỗi hết hạn
   * - Playlist giữ đường dẫn tương đối (.ts)
   */
  async mp4ToHlsAndUpload(
    localMp4Path: string,
    originalName: string,
    bucket: string = 'tempvideo', // mặc định lưu tạm
  ) {
    const uniqueId = randomUUID().slice(0, 10);
    const outputName = `${path.parse(originalName).name}_${uniqueId}`;
    const workDir = this.prepareWorkDir(outputName);
    const playlistPath = path.join(workDir, 'playlist.m3u8');

    const duration = await this.getVideoDuration(localMp4Path);
    console.log("Thời lượng video", duration)

    // 1️⃣ Convert video sang HLS
    await this.convertToHls(localMp4Path, playlistPath);

    // 2️⃣ Lấy danh sách segment .ts
    const tsFiles = this.listTsFiles(workDir);

    // 3️⃣ Upload toàn bộ .ts
    await this.uploadTsSegments(outputName, workDir, tsFiles, bucket);

    // 4️⃣ Chuẩn bị playlist (đường dẫn tương đối, không ký)
    const cleanPlaylistPath = await this.createCleanPlaylist(workDir, playlistPath, tsFiles);

    // 5️⃣ Upload playlist
    const playlistKey = `${outputName}/playlist.m3u8`;
    await this.minioService.uploadFile(
      playlistKey,
      cleanPlaylistPath,
      'application/vnd.apple.mpegurl',
      bucket,
    );

    // 6️⃣ Tạo URL xem (qua route BE stream)
    const streamUrl = `${process.env.BACKEND_URL || 'http://localhost:3009'}/upload/stream/${outputName}/playlist.m3u8`;

    // 7️⃣ Xoá tạm
    this.cleanup(workDir);

    return { playlistUrl: streamUrl, folderName: outputName, bucket , duration: duration};
  }

  // =========================
  // ⚙️ HÀM PHỤ TRỢ
  // =========================

  private prepareWorkDir(outputName: string): string {
    const workDir = path.join(this.tmpBase, outputName);
    if (!fs.existsSync(workDir)) fs.mkdirSync(workDir, { recursive: true });
    return workDir;
  }

  private async convertToHls(localPath: string, playlistPath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const args = [
        '-i', localPath,
        '-profile:v', 'baseline',
        '-level', '3.0',
        '-start_number', '0',
        '-hls_time', '6',
        '-hls_list_size', '0',
        '-f', 'hls',
        playlistPath,
      ];

      const ff = spawn('ffmpeg', args);
      ff.stderr.on('data', (d) => this.logger.debug(d.toString()));
      ff.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg failed (${code})`))));
    });
  }

  private listTsFiles(workDir: string): string[] {
    return fs.readdirSync(workDir).filter((f) => f.endsWith('.ts'));
  }

  private async uploadTsSegments(outputName: string, workDir: string, tsFiles: string[], bucket: string) {
    await Promise.all(
      tsFiles.map(async (f) => {
        const abs = path.join(workDir, f);
        const key = `${outputName}/${f}`;
        await this.minioService.uploadFile(key, abs, 'video/MP2T', bucket);
      }),
    );
  }

  /**
   * 🧹 Tạo playlist sạch (chỉ giữ đường dẫn tương đối, không ký URL)
   */
  private async createCleanPlaylist(
    workDir: string,
    playlistPath: string,
    tsFiles: string[],
  ): Promise<string> {
    let playlist = fs.readFileSync(playlistPath, 'utf8');

    // đảm bảo các dòng .ts không bị thay đổi
    for (const f of tsFiles) {
      playlist = playlist.replace(new RegExp(`https?://[^\\s]*${f}`, 'g'), f);
    }

    const cleanPath = path.join(workDir, 'playlist_clean.m3u8');
    fs.writeFileSync(cleanPath, playlist);
    return cleanPath;
  }

  private cleanup(workDir: string) {
    try {
      fs.rmSync(workDir, { recursive: true, force: true });
    } catch (err) {
      this.logger.warn(`Không thể xóa thư mục tạm ${workDir}: ${err.message}`);
    }
  }
}
