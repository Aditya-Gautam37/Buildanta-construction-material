import type { INestApplication } from '@nestjs/common';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { assertRequiredEnv } from './common/env-check';
import { LoggingInterceptor } from './common/logging.interceptor';
import { requestIdMiddleware } from './common/request-id.middleware';
import { initSentry } from './common/sentry';

// Both entry points (local dev's main.ts and Vercel's api/index.ts) must apply
// identical setup. They used to configure CORS independently and had already
// drifted — api/index.ts, the one actually running in production, was missing
// the x-buildanta-guest-cart header that main.ts had. One shared function is
// the only way to guarantee they can't diverge again.
export function resolveCorsOrigins(): string[] {
  const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:3002')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  // This API serves both staff (inventory-management) and customer/guest
  // (storefront) traffic with credentials enabled, so the allowlist has to be
  // both non-empty and explicit — cors with credentials:true silently sends
  // Access-Control-Allow-Origin: * for a wildcard entry, which every browser
  // then refuses client-side. That failure mode is confusing to debug from a
  // fetch error alone, so it's rejected here instead, at boot, with a clear
  // reason.
  if (origins.length === 0) throw new Error('CORS_ORIGINS resolved to an empty list — refusing to start with no allowed origin.');
  const wildcard = origins.find((origin) => origin === '*');
  if (wildcard) throw new Error("CORS_ORIGINS must not include '*' — this API uses credentialed requests, which browsers reject for a wildcard origin. List each allowed origin explicitly.");
  const malformed = origins.find((origin) => !/^https?:\/\/[^/]+$/.test(origin));
  if (malformed) throw new Error(`CORS_ORIGINS contains an entry that isn't a bare "https://host" origin: "${malformed}".`);

  return origins;
}

export function configureApp(app: INestApplication): void {
  assertRequiredEnv();
  initSentry();

  app.enableCors({
    origin: resolveCorsOrigins(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-buildanta-guest-cart'],
  });

  // Order matters: the request-id middleware must run before anything that
  // logs, so both the interceptor (success path) and the filter (error path)
  // can read request.requestId.
  app.use(requestIdMiddleware);
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
}
