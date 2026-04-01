import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: Record<string, string[]> | undefined = undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const responsePayload = exception.getResponse() as any;

      if (typeof responsePayload === 'string') {
        message = responsePayload;
      } else if (typeof responsePayload === 'object') {
        message = responsePayload.message || message;

        if (
          responsePayload.errors &&
          typeof responsePayload.errors === 'object' &&
          !Array.isArray(responsePayload.errors)
        ) {
          errors = responsePayload.errors as Record<string, string[]>;
        }

        // Handle class-validator error format
        if (Array.isArray(responsePayload.message)) {
          message = 'Validation failed';
          errors = {
            general: responsePayload.message,
          };
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(statusCode).json({
      message,
      ...(errors && { errors }),
      statusCode,
    });
  }
}
