import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, of } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';

/**
 * 🧩 Helper tổng quát để resolve dữ liệu liên quan từ service khác (qua RabbitMQ)
 * 
 * @param client - ClientProxy (VD: userClient, categoryClient)
 * @param pattern - MessagePattern cần gọi (VD: 'get_user_by_id')
 * @param id - ID khóa ngoại cần resolve
 * @param timeoutMs - Giới hạn thời gian chờ (default: 500ms)
 * 
 * @returns Promise<object|null> - dữ liệu trả về hoặc null nếu lỗi/timeout
 */
export async function resolveRelatedEntitySafe(
  client: ClientProxy,
  pattern: string,
  id: string,
  timeoutMs = 500
) {
  if (!client || !id) return null;

  try {
    const result$ = client
      .send(pattern, id)
      .pipe(
        timeout(timeoutMs),
        catchError(() => of(null))
      );

    return await lastValueFrom(result$);
  } catch (err) {
    console.warn(
      `[ResolverHelper] Lỗi hoặc timeout khi gọi pattern="${pattern}", id="${id}": ${err.message}`
    );
    return null;
  }
}
