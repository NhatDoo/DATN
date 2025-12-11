import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, map } from 'rxjs';

function convertBigInt(obj: any, seen = new WeakSet()): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj);
  if (obj instanceof Date) return obj;
  if (typeof obj !== 'object') return obj;

  // ✅ Ngăn vòng lặp vô hạn
  if (seen.has(obj)) return obj;
  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj.map(item => convertBigInt(item, seen));
  }

  const newObj: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    newObj[key] = convertBigInt(obj[key], seen);
  }

  return newObj;
}

@Injectable()
export class BigIntInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map(data => convertBigInt(data)));
  }
}
