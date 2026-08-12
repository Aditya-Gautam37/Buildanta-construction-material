import * as Sentry from '@sentry/node';

// Sentry is entirely optional: with no SENTRY_DSN set, initSentry() is a
// no-op and captureError() below silently does nothing. Nothing else in the
// app should branch on whether Sentry is configured — this is the one place
// that knows.
let enabled = false;

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),
  });
  enabled = true;
}

export function captureError(error: unknown, context: Record<string, unknown>): void {
  if (!enabled) return;
  Sentry.captureException(error, { extra: context });
}
