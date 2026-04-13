import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface Response<T> {
  data: T;
  message?: string;
  meta?: any;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor<unknown, Response<unknown>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<unknown>> {
    return next.handle().pipe(
      map((res) => {
        const sanitizedResponse = this.sanitizeSensitiveFields(res);
        if (
          sanitizedResponse &&
          typeof sanitizedResponse === 'object' &&
          'data' in sanitizedResponse &&
          'meta' in sanitizedResponse
        ) {
          return sanitizedResponse as Response<unknown>;
        }

        if (
          sanitizedResponse &&
          typeof sanitizedResponse === 'object' &&
          'data' in sanitizedResponse &&
          'message' in sanitizedResponse
        ) {
          return sanitizedResponse as Response<unknown>;
        }

        return {
          data: sanitizedResponse,
        };
      }),
    );
  }

  private sanitizeSensitiveFields(value: unknown): unknown {
    return this.deepSanitize(value, new WeakSet<object>());
  }

  private deepSanitize(value: unknown, seen: WeakSet<object>): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    const serializable = value as {
      toISOString?: () => string;
      toJSON?: () => unknown;
    };

    if (typeof serializable.toISOString === 'function') {
      return serializable.toISOString();
    }

    if (typeof serializable.toJSON === 'function') {
      const jsonValue = serializable.toJSON();
      if (jsonValue !== value) {
        return this.deepSanitize(jsonValue, seen);
      }
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.deepSanitize(item, seen));
    }

    if (typeof value !== 'object') {
      return value;
    }

    if (!this.isPlainObject(value)) {
      return value;
    }

    const objectValue = value as Record<string, unknown>;
    if (seen.has(objectValue)) {
      return objectValue;
    }
    seen.add(objectValue);

    const sensitiveKeys = new Set(['password', 'passwordHash']);
    const sanitized: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(objectValue)) {
      if (sensitiveKeys.has(key)) {
        continue;
      }

      sanitized[key] = this.deepSanitize(nestedValue, seen);
    }

    return sanitized;
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }
}
