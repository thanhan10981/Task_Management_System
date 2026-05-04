import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, ip } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const statusCode = context.switchToHttp().getResponse().statusCode;
        const duration = Date.now() - now;

        const logObject = {
          timestamp: new Date().toISOString(),
          method,
          url,
          statusCode,
          duration: `${duration}ms`,
          ip,
          ...(body && { body: this.sanitizeBody(body) }),
        };

        if (statusCode >= 400) {
          this.logger.error(JSON.stringify(logObject));
        } else {
          this.logger.log(JSON.stringify(logObject));
        }
      }, (error) => {
        const statusCode = error?.status ?? context.switchToHttp().getResponse().statusCode ?? 500;
        const duration = Date.now() - now;

        const logObject = {
          timestamp: new Date().toISOString(),
          method,
          url,
          statusCode,
          duration: `${duration}ms`,
          ip,
          error: error?.message ?? 'Unhandled error',
          ...(body && { body: this.sanitizeBody(body) }),
        };

        this.logger.error(JSON.stringify(logObject));
      }),
    );
  }

  private sanitizeBody(value: unknown): Prisma.InputJsonValue | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'string') {
      return value.length > 1000 ? `${value.slice(0, 1000)}...` : value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'bigint') {
      return value.toString();
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Array.isArray(value)) {
      const maxItems = 30;
      return value.slice(0, maxItems).map((item) => this.sanitizeLeaf(item));
    }

    if (typeof value !== 'object') {
      return String(value);
    }

    const plainRecord = this.asPlainRecord(value);
    if (!plainRecord) {
      return `[${(value as object).constructor?.name ?? 'Object'}]`;
    }

    const sensitiveFields = new Set([
      'password',
      'passwordHash',
      'refreshToken',
      'token',
      'accessToken',
      'resetToken',
      'newPassword',
      'confirmPassword',
      'authorization',
      'cookie',
      'set-cookie',
    ]);

    const sanitized: Record<string, Prisma.InputJsonValue | null> = {};
    const entries = Object.entries(plainRecord).slice(0, 60);

    for (const [key, nestedValue] of entries) {
      if (sensitiveFields.has(key.toLowerCase())) {
        sanitized[key] = '***REDACTED***';
        continue;
      }
      sanitized[key] = this.sanitizeLeaf(nestedValue);
    }
    return sanitized as Prisma.InputJsonObject;
  }

  private sanitizeLeaf(value: unknown): Prisma.InputJsonValue | null {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'string') {
      return value.length > 300 ? `${value.slice(0, 300)}...` : value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'bigint') {
      return value.toString();
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Array.isArray(value)) {
      return `[Array(${value.length})]`;
    }

    if (typeof value === 'object') {
      const record = this.asPlainRecord(value);
      if (record) {
        return `[Object keys: ${Object.keys(record).slice(0, 10).join(', ')}]`;
      }
      return `[${(value as object).constructor?.name ?? 'Object'}]`;
    }
    return String(value);
  }

  private asPlainRecord(value: object): Record<string, unknown> | null {
    const prototype = Object.getPrototypeOf(value);
    if (prototype === Object.prototype || prototype === null) {
      return value as Record<string, unknown>;
    }
    return null;
  }
}
