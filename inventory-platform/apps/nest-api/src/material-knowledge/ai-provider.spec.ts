import type { ConfigService } from '@nestjs/config';
import { GeminiProvider } from './ai-provider';

function providerWith(settings: Record<string, unknown>) {
  const config = { get: (key: string) => settings[key] } as unknown as ConfigService;
  return new GeminiProvider(config);
}

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as unknown as Response;
}

const originalFetch = global.fetch;

describe('GeminiProvider', () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    // logEvent writes through console; silence it and inspect what it wrote.
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe('configuration', () => {
    it('reports itself unconfigured when no key is set', () => {
      expect(providerWith({}).isConfigured()).toBe(false);
      expect(providerWith({ GEMINI_API_KEY: '   ' }).isConfigured()).toBe(false);
    });

    it('reports itself configured once a key is present', () => {
      expect(providerWith({ GEMINI_API_KEY: 'test-key' }).isConfigured()).toBe(true);
    });

    it('never calls the network without a key', async () => {
      const fetchMock = jest.fn();
      global.fetch = fetchMock as unknown as typeof fetch;

      await expect(providerWith({}).answer('system', 'prompt'))
        .resolves.toEqual({ ok: false, reason: 'not-configured' });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('request shape', () => {
    it('sends the key as a header, never in the URL where logs would capture it', async () => {
      const fetchMock = jest.fn().mockResolvedValue(jsonResponse(200, {
        candidates: [{ content: { parts: [{ text: 'An answer.' }] } }],
      }));
      global.fetch = fetchMock as unknown as typeof fetch;

      await providerWith({ GEMINI_API_KEY: 'secret-key' }).answer('system', 'prompt');

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).not.toContain('secret-key');
      expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('secret-key');
    });

    it('caps output tokens and keeps temperature low, so answers stay cheap and literal', async () => {
      const fetchMock = jest.fn().mockResolvedValue(jsonResponse(200, {
        candidates: [{ content: { parts: [{ text: 'An answer.' }] } }],
      }));
      global.fetch = fetchMock as unknown as typeof fetch;

      await providerWith({ GEMINI_API_KEY: 'k' }).answer('system', 'prompt');

      const body = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string);
      expect(body.generationConfig.maxOutputTokens).toBe(600);
      expect(body.generationConfig.temperature).toBeLessThanOrEqual(0.2);
    });

    it('uses the configured model when one is pinned', async () => {
      const fetchMock = jest.fn().mockResolvedValue(jsonResponse(200, {
        candidates: [{ content: { parts: [{ text: 'An answer.' }] } }],
      }));
      global.fetch = fetchMock as unknown as typeof fetch;

      await providerWith({ GEMINI_API_KEY: 'k', GEMINI_MODEL: 'gemini-3.5-flash' }).answer('s', 'p');

      expect((fetchMock.mock.calls[0] as [string])[0]).toContain('gemini-3.5-flash');
    });
  });

  describe('failure handling', () => {
    it('translates an aborted request into a timeout rather than a crash', async () => {
      global.fetch = jest.fn().mockImplementation(() => {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      }) as unknown as typeof fetch;

      await expect(providerWith({ GEMINI_API_KEY: 'k' }).answer('s', 'p'))
        .resolves.toEqual({ ok: false, reason: 'timeout' });
    });

    it('actually aborts a request that outlives the configured deadline', async () => {
      let capturedSignal: AbortSignal | undefined;
      global.fetch = jest.fn().mockImplementation((_url: string, init: RequestInit) => {
        capturedSignal = init.signal as AbortSignal;
        return new Promise((_resolve, reject) => {
          capturedSignal?.addEventListener('abort', () => {
            const error = new Error('aborted');
            error.name = 'AbortError';
            reject(error);
          });
        });
      }) as unknown as typeof fetch;

      const result = await providerWith({ GEMINI_API_KEY: 'k', AI_TIMEOUT_MS: 20 }).answer('s', 'p');

      expect(capturedSignal?.aborted).toBe(true);
      expect(result).toEqual({ ok: false, reason: 'timeout' });
    });

    it('returns provider-error for a non-OK response, without throwing', async () => {
      global.fetch = jest.fn().mockResolvedValue(jsonResponse(429, {})) as unknown as typeof fetch;

      await expect(providerWith({ GEMINI_API_KEY: 'k' }).answer('s', 'p'))
        .resolves.toEqual({ ok: false, reason: 'provider-error' });
    });

    it('surfaces a safety block distinctly, so the customer can be told to rephrase', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        jsonResponse(200, { promptFeedback: { blockReason: 'SAFETY' } }),
      ) as unknown as typeof fetch;

      await expect(providerWith({ GEMINI_API_KEY: 'k' }).answer('s', 'p'))
        .resolves.toEqual({ ok: false, reason: 'blocked' });
    });

    it('treats an empty answer as a failure rather than returning blank text', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        jsonResponse(200, { candidates: [{ content: { parts: [{ text: '   ' }] } }] }),
      ) as unknown as typeof fetch;

      await expect(providerWith({ GEMINI_API_KEY: 'k' }).answer('s', 'p'))
        .resolves.toEqual({ ok: false, reason: 'provider-error' });
    });

    it('never lets a network error escape to the caller', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('ECONNRESET')) as unknown as typeof fetch;

      await expect(providerWith({ GEMINI_API_KEY: 'k' }).answer('s', 'p'))
        .resolves.toEqual({ ok: false, reason: 'provider-error' });
    });
  });

  describe('usage logging', () => {
    it('records the call for cost tracking without logging any content', async () => {
      global.fetch = jest.fn().mockResolvedValue(jsonResponse(200, {
        candidates: [{ content: { parts: [{ text: 'Use it on cured concrete.' }] } }],
        usageMetadata: { promptTokenCount: 320, candidatesTokenCount: 44 },
      })) as unknown as typeof fetch;

      await providerWith({ GEMINI_API_KEY: 'k' }).answer(
        'SYSTEM SECRET INSTRUCTIONS',
        'CUSTOMER QUESTION: how many bags for my house at 12 Nehru Road?',
      );

      const line = logSpy.mock.calls.at(-1)?.[0] as string;
      const event = JSON.parse(line);
      expect(event.message).toBe('ai request');
      expect(event.outcome).toBe('ok');
      expect(event.promptTokens).toBe(320);
      expect(event.answerTokens).toBe(44);

      // The whole point: none of the content reaches the log line.
      expect(line).not.toContain('Nehru Road');
      expect(line).not.toContain('SYSTEM SECRET');
      expect(line).not.toContain('cured concrete');
    });

    it('records a failure outcome too, so a broken provider is visible', async () => {
      global.fetch = jest.fn().mockResolvedValue(jsonResponse(500, {})) as unknown as typeof fetch;

      await providerWith({ GEMINI_API_KEY: 'k' }).answer('s', 'p');

      const event = JSON.parse(logSpy.mock.calls.at(-1)?.[0] as string);
      expect(event.outcome).toBe('provider-error');
      expect(event.statusCode).toBe(500);
    });
  });
});
