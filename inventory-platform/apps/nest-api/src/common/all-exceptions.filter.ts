import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { captureError } from './sentry';
import { logEvent, redact } from './logger';
import type { RequestWithId } from './request-id.middleware';

// The single place every unhandled error in the API passes through. Two
// separate obligations that must never be conflated: what the customer sees
// (safe, generic for anything unexpected) and what gets logged (full detail,
// for us to actually diagnose it).
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId>();

    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    // An HttpException's own response body is already written to be
    // customer-safe (BadRequestException("Your cart is empty."), etc.) —
    // pass it through unchanged. Anything else is an infrastructure failure
    // whose real message/stack must not reach the response body.
    const clientBody = isHttpException
      ? exception.getResponse()
      : { statusCode, message: 'Something went wrong on our end. Please try again.' };

    const error = exception instanceof Error ? exception : new Error(String(exception));
    logEvent({
      level: statusCode >= 500 ? 'error' : 'warn',
      message: 'request failed',
      requestId: request?.requestId,
      method: request?.method,
      route: request?.route?.path ?? request?.originalUrl,
      statusCode,
      durationMs: request?.startedAt ? Date.now() - request.startedAt : undefined,
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
      // Route params (e.g. an order/cart id in the URL) are useful for
      // diagnosis and aren't personal data; the body/query can contain names,
      // emails, addresses, so it's redacted rather than logged raw.
      params: request?.params,
      query: redact(request?.query),
    });

    if (statusCode >= 500) {
      captureError(error, {
        requestId: request?.requestId,
        route: request?.route?.path ?? request?.originalUrl,
        params: request?.params,
      });
    }

    response.status(statusCode).json(
      typeof clientBody === 'object' && clientBody !== null
        ? { ...clientBody, requestId: request?.requestId }
        : { statusCode, message: clientBody, requestId: request?.requestId },
    );
  }
}
