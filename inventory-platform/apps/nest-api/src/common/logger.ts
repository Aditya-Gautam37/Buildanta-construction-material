// Deliberately not a dependency on pino/winston: Vercel captures stdout as
// the log stream regardless, so one JSON line per event is enough to be
// queryable without introducing a logging framework this project doesn't
// otherwise have. See the "structured logging" section of the API README for
// where these lines end up in production.

const REDACTED = '[redacted]';
const SENSITIVE_KEYS = new Set([
  'password', 'token', 'accesstoken', 'refreshtoken', 'authorization', 'cookie',
  'idempotencykey', 'email', 'phone', 'name', 'address', 'addressline1', 'addressline2',
  'customername', 'customeremail', 'customerphone', 'deliverypincode',
]);

/** Strips anything that identifies or authenticates a person before it reaches a log line. */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 4 || value == null) return value;
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? REDACTED : redact(entry, depth + 1);
    }
    return out;
  }
  return value;
}

export type LogEvent = {
  level: 'info' | 'warn' | 'error';
  message: string;
  [key: string]: unknown;
};

export function logEvent(event: LogEvent): void {
  const line = JSON.stringify({ time: new Date().toISOString(), ...event });
  if (event.level === 'error') console.error(line);
  else if (event.level === 'warn') console.warn(line);
  else console.log(line);
}
