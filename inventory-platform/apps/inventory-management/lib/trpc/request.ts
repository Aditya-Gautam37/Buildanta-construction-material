import { TRPCError } from '@trpc/server';
import type { ZodType } from 'zod';

type RequestJsonOptions<T> = {
  url: string;
  init: RequestInit;
  unreachableMessage: string;
  failureMessage: string;
  invalidPayloadMessage: string;
  schema: ZodType<T>;
};

type RequestOkOptions = {
  url: string;
  init: RequestInit;
  unreachableMessage: string;
  failureMessage: string;
};

function throwForHttpError(response: Response, failureMessage: string) {
  if (response.ok) {
    return;
  }

  throw new TRPCError({
    code:
      response.status === 401
        ? 'UNAUTHORIZED'
        : response.status === 403
          ? 'FORBIDDEN'
          : response.status >= 400 && response.status < 500
            ? 'BAD_REQUEST'
            : 'BAD_GATEWAY',
    message: `${failureMessage} with ${response.status}.`,
  });
}

async function fetchWithNetworkGuard(options: { url: string; init: RequestInit; unreachableMessage: string }) {
  try {
    return await fetch(options.url, options.init);
  } catch (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: options.unreachableMessage,
      cause: error,
    });
  }
}

export async function requestJson<T>(options: RequestJsonOptions<T>): Promise<T> {
  const response = await fetchWithNetworkGuard({
    url: options.url,
    init: options.init,
    unreachableMessage: options.unreachableMessage,
  });

  throwForHttpError(response, options.failureMessage);

  const payload = await response.json();

  try {
    return options.schema.parse(payload);
  } catch (error) {
    throw new TRPCError({
      code: 'BAD_GATEWAY',
      message: options.invalidPayloadMessage,
      cause: error,
    });
  }
}

export async function requestOk(options: RequestOkOptions): Promise<void> {
  const response = await fetchWithNetworkGuard({
    url: options.url,
    init: options.init,
    unreachableMessage: options.unreachableMessage,
  });

  throwForHttpError(response, options.failureMessage);
}
