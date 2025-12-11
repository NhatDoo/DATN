import { lastValueFrom, of } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';


/**
 * Helper: Thêm dữ liệu liên quan (populate từ service khác) một cách an toàn
 * - Dùng được cho mọi entity có khóa phụ
 * - Nếu lỗi hoặc timeout => vẫn trả về dữ liệu gốc
 *
 * @param items Mảng dữ liệu gốc
 * @param client Client microservice để gọi (VD: this.userClient)
 * @param pattern Tên event gửi qua (VD: 'get_user_by_id')
 * @param keyField Trường trong item dùng để liên kết (VD: 'instructor_id')
 * @param targetField Tên field kết quả sẽ thêm vào (VD: 'instructor')
 * @param timeoutMs Thời gian chờ (default: 500ms)
 */
export async function addResponseRelation<
  T extends Record<string, any>, // Dữ liệu gốc (object có key-value)
  K extends keyof T,             // Trường làm khóa phụ (VD: instructor_id)
  R extends string               // Tên field kết quả thêm vào (VD: instructor)
>(
  items: T[],
  client: any,
  pattern: string,
  keyField: K,
  targetField: R,
  timeoutMs = 500
): Promise<(T & { [key in R]: any | null })[]> {
  if (!items?.length) return [];

  const results = await Promise.all(
    items.map(async (item) => {
      const keyValue = item[keyField];
      if (!keyValue) return { ...item, [targetField]: null };

      try {
        const obs$ = client
          .send(pattern, keyValue)
          .pipe(timeout(timeoutMs), catchError(() => of(null)));

        const related = await lastValueFrom(obs$);
        return { ...item, [targetField]: related };
      } catch (err: any) {
        console.warn(
          `[addResponseRelation] Lỗi khi lấy ${String(targetField)} (pattern=${pattern}): ${err.message}`
        );
        return { ...item, [targetField]: null };
      }
    })
  );

  return results;
}
