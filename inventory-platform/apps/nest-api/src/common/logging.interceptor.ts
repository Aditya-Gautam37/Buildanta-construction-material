import { Injectable, type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common';
import type { Response } from 'express';
import { tap } from 'rxjs';
import { logEvent } from './logger';
import type { RequestWithId } from './request-id.middleware';

// Logs every request that reaches a handler (errors are logged by the global
// exception filter instead, with more context, so this only covers the
// success path — together they cover every request exactly once).
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<RequestWithId>();
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        logEvent({
          level: 'info',
          message: 'request completed',
          requestId: request.requestId,
          method: request.method,
          route: request.route?.path ?? request.originalUrl,
          statusCode: response.statusCode,
          durationMs: Date.now() - request.startedAt,
        });
      }),
    );
  }
}
