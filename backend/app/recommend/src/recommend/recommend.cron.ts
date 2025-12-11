// recommender.cron.ts
import { Cron, CronExpression } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RecommenderCron {
  constructor(private http: HttpService) {}

  // chạy mỗi 10 phút
  @Cron('*/1 * * * *')
  async handleCron() {
    console.log("⏳ Retraining recommender...");
    try {
      await this.http.post("http://localhost:3004/refresh-recommender");
      console.log("✅ retrain completed");
    } catch (err) {
      console.error("❌ retrain failed", err);
    }
  }
}
