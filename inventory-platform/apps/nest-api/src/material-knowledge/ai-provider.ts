import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { logEvent } from '../common/logger';

// The assistant must never become a hard dependency of the storefront. If no
// key is configured, or the provider is down, "Know Your Material" still shows
// the verified information — only the question box goes away. Nothing here
// throws into a customer's page.

export type AiAnswer =
  | { ok: true; text: string }
  | { ok: false; reason: 'not-configured' | 'timeout' | 'provider-error' | 'blocked' };

export interface AiProvider {
  isConfigured(): boolean;
  answer(systemInstruction: string, userPrompt: string): Promise<AiAnswer>;
}

// A rolling alias rather than a pinned version: Google retires specific model
// versions, and a pinned name starts returning 404 the day that happens.
// Override with GEMINI_MODEL to pin deliberately.
const DEFAULT_MODEL = 'gemini-flash-latest';
const DEFAULT_TIMEOUT_MS = 12_000;

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
};

@Injectable()
export class GeminiProvider implements AiProvider {
  constructor(private readonly config: ConfigService) {}

  private get apiKey(): string {
    return String(this.config.get('GEMINI_API_KEY') ?? '').trim();
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  // One line per AI call, for usage and cost tracking. Deliberately records
  // only the shape of the call — model, outcome, duration, token counts — and
  // never the prompt, the question, or the answer. Sizes are logged as
  // character counts so a spike is visible without the content being readable.
  private record(fields: Record<string, unknown>): void {
    logEvent({ level: 'info', message: 'ai request', ...fields });
  }

  async answer(systemInstruction: string, userPrompt: string): Promise<AiAnswer> {
    const apiKey = this.apiKey;
    if (!apiKey) return { ok: false, reason: 'not-configured' };

    const model = String(this.config.get('GEMINI_MODEL') ?? DEFAULT_MODEL);
    const timeoutMs = Number(this.config.get('AI_TIMEOUT_MS') ?? DEFAULT_TIMEOUT_MS);
    const startedAt = Date.now();

    // A customer is waiting on this request, so it gets a hard deadline rather
    // than inheriting whatever the provider's default is.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: 'POST',
          // The key goes in a header, never the URL: query strings end up in
          // access logs and error reports.
          headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: {
              // Low temperature: this task is restating verified facts, not
              // writing prose. Creativity here is indistinguishable from
              // making things up.
              temperature: 0.2,
              // Caps the cost of any single call, and keeps answers short
              // enough to read in a slide-over.
              maxOutputTokens: 600,
            },
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        this.record({ model, outcome: 'provider-error', statusCode: response.status, durationMs: Date.now() - startedAt });
        return { ok: false, reason: 'provider-error' };
      }

      const payload = await response.json() as GeminiResponse;
      if (payload.promptFeedback?.blockReason) {
        this.record({ model, outcome: 'blocked', durationMs: Date.now() - startedAt });
        return { ok: false, reason: 'blocked' };
      }

      const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim();
      if (!text) {
        this.record({ model, outcome: 'empty', durationMs: Date.now() - startedAt });
        return { ok: false, reason: 'provider-error' };
      }

      this.record({
        model,
        outcome: 'ok',
        durationMs: Date.now() - startedAt,
        promptTokens: payload.usageMetadata?.promptTokenCount,
        answerTokens: payload.usageMetadata?.candidatesTokenCount,
        answerChars: text.length,
      });
      return { ok: true, text };
    } catch (error) {
      const aborted = error instanceof Error && error.name === 'AbortError';
      this.record({
        model,
        outcome: aborted ? 'timeout' : 'provider-error',
        durationMs: Date.now() - startedAt,
        errorName: error instanceof Error ? error.name : 'unknown',
      });
      return { ok: false, reason: aborted ? 'timeout' : 'provider-error' };
    } finally {
      clearTimeout(timer);
    }
  }
}
