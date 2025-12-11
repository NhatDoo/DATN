import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { syncCourseToService } from '@shared/ultis/synccourse.ultis';
import { PrismaMongoService } from './prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class RecommendService {
  private readonly dataPath = path.join(process.cwd(), 'data');

  constructor(private readonly prisma: PrismaMongoService) {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
  }

  async syncLesson(action: 'add' | 'update' | 'delete', data: any) {
    // URL of the Python service
    const pythonServiceUrl = 'http://localhost:3005';

    if (action === 'add') {
      // Sync to Python service
      await syncCourseToService('add', data, `${pythonServiceUrl}/lesson/add`);
    } else if (action === 'update') {
      // Sync to Python service
      await syncCourseToService('update', data, `${pythonServiceUrl}/lesson/update`);
    } else if (action === 'delete') {
      // Sync to Python service
      await syncCourseToService('delete', data, `${pythonServiceUrl}/lesson/delete`);
    }

    console.log(`✅ Synced lesson [${action}] to Python Service`);
    return { success: true };
  }

  /**
   * 🧠 Lưu lịch sử tìm kiếm của người dùng vào MongoDB
   */
  async logUserSearch(
    userId: string,
    searchTerm: string,
    action_type: string,
    price: number,
    course_id: string,
  ) {
    // 1️⃣ Lưu log vào MongoDB
    const log = await this.prisma.user_activity.create({
      data: {
        user_id: userId,
        keyword: searchTerm,
        action_type,
        course_id,
        price,
        timestamp: new Date(),
      },
    });

    // 2️⃣ Đồng bộ sang service Recommend (Python)
    try {
      await syncCourseToService('add', log, 'http://localhost:3005/add-history');
      console.log('✅ Synced user activity to Recommend service');
    } catch (err) {
      console.error('❌ Failed to sync to Recommend service:', err.message);
    }

    return log;
  }

  /**
   * 📜 Lấy lịch sử tìm kiếm của người dùng
   */
  async getUserSearchHistory(userId: string) {
    return this.prisma.user_activity.findMany({
      where: { user_id: userId, action_type: 'search' },
      orderBy: { timestamp: 'desc' },
      take: 20,
    });
  }

  async getAllUserSearchHistory() {
    return this.prisma.user_activity.findMany();
  }
}