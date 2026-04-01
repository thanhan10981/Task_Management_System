import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
  message?: string;
  meta?: any;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((res) => {
        // If the response is already formatted (e.g., paginated response with meta), return as is
        if (res && typeof res === 'object' && 'data' in res && 'meta' in res) {
          return res;
        }

        // Handle case where we return { data, message } directly from service
        if (res && res.data !== undefined && res.message) {
          return res;
        }

        // Wrap the standard response
        return {
          data: res,
        };
      }),
    );
  }
}
