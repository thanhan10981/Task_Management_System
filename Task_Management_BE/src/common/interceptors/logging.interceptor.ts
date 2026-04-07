import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { ActivityType, Prisma } from '@prisma/client';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  constructor(private readonly prisma: PrismaService) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, ip, params, query, headers } = request;
    const userId = request?.user?.id ?? null;
    const projectId = body?.projectId ?? params?.projectId ?? query?.projectId ?? null;

    const now = Date.now();

    return next.handle().pipe(
      tap((response) => {
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

        void this.persistActivityLog({
          userId,
          projectId,
          method,
          url,
          statusCode,
          duration,
          ip,
          userAgent: headers?.['user-agent'],
          body,
          params,
          query,
          response,
        });

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

        void this.persistActivityLog({
          userId,
          projectId,
          method,
          url,
          statusCode,
          duration,
          ip,
          userAgent: headers?.['user-agent'],
          body,
          params,
          query,
          error: error?.message,
        });

        this.logger.error(JSON.stringify(logObject));
      }),
    );
  }

  private async persistActivityLog(payload: {
    userId: string | null;
    projectId: string | null;
    method: string;
    url: string;
    statusCode: number;
    duration: number;
    ip: string;
    userAgent?: string;
    body?: unknown;
    params?: unknown;
    query?: unknown;
    response?: unknown;
    error?: string;
  }): Promise<void> {
    try {
      await this.prisma.activityLog.create({
        data: {
          userId: payload.userId,
          projectId: payload.projectId,
          entityType: ActivityType.SYSTEM,
          action: this.toAction(payload.method, payload.url),
          description: `HTTP ${payload.method} ${payload.url} - ${payload.statusCode}`,
          metadata: {
            method: payload.method,
            url: payload.url,
            statusCode: payload.statusCode,
            durationMs: payload.duration,
            ip: payload.ip,
            userAgent: payload.userAgent,
            body: this.sanitizeBody(payload.body),
            params: this.sanitizeBody(payload.params),
            query: this.sanitizeBody(payload.query),
            response: '[Response]',
            error: payload.error,
          } as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown activity log error';
      this.logger.error(`Failed to persist activity log: ${message}`);
    }
  }

  private toAction(method: string, url: string): string {
    const maxLength = 100;
    const value = `${method.toUpperCase()} ${url}`;
    if (value.length <= maxLength) {
      return value;
    }

    return `${value.slice(0, maxLength - 3)}...`;
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
