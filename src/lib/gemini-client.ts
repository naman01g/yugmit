/**
 * Gemini REST API client — V1 implementation.
 *
 * Uses the Google AI Studio free tier. Called client-side (API key is not secret;
 * see ARCHITECTURE.md for the disclosed V1 limitation).
 *
 * No Gemini SDK dependency — direct HTTP to keep the bundle small and avoid
 * introducing a paid-tier SDK accidentally.
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'
// Formerly 'gemini-2.0-flash'. As of Sep 2026 Google returns HTTP 404
// ("no longer available") for gemini-2.0-flash and gemini-2.5-flash and
// recommends gemini-3.6-flash, which was verified live with the same
// generateContent request shape used below.
// Sampling parameters (temperature/topP/topK) are NOT sent: Gemini 3.6 Flash
// does not support them; maxOutputTokens (a generation bound) remains valid.
const DEFAULT_MODEL = 'gemini-3.6-flash'
const DEFAULT_TIMEOUT_MS = 30_000
const DEFAULT_MAX_RETRIES = 1
const DEFAULT_RETRY_DELAY_MS = 2_000

export interface GeminiSuccess {
  ok: true
  text: string
}

export interface GeminiError {
  ok: false
  code:
    | 'not_configured'
    | 'request_failed'
    | 'timeout'
    | 'rate_limit'
    | 'invalid_response'
  message: string
  status?: number
}

export type GeminiResult = GeminiSuccess | GeminiError

function getApiKey(): string | null {
  return import.meta.env.VITE_GEMINI_API_KEY ?? null
}

/**
 * Returns user-facing error message for Gemini failures.
 */
function errorMessageFor(code: GeminiError['code']): string {
  switch (code) {
    case 'not_configured':
      return 'AI analysis is not configured. Please set VITE_GEMINI_API_KEY.'
    case 'request_failed':
      return 'AI analysis request failed. Please try again.'
    case 'timeout':
      return 'AI analysis timed out. Please try again.'
    case 'rate_limit':
      return 'AI service is rate-limited. Please try again later.'
    case 'invalid_response':
      return 'AI returned an unexpected response. Please try again.'
  }
}

/**
 * Sends a prompt to Gemini and returns the raw text response.
 *
 * Retries once on transient failures (timeout, network error, 5xx) but NOT on:
 * - client errors (4xx, including 429 rate limits)
 * - invalid responses (empty/malformed candidate, truncated output)
 *
 * The overall budget is bounded by an optional external signal (used by the
 * AI pipeline as a hard wall-clock deadline) and by `timeoutMs` per attempt.
 * Every path resolves — this function never leaves a hanging Promise.
 */
export async function sendGeminiPrompt(
  prompt: string,
  options?: {
    model?: string
    signal?: AbortSignal
    timeoutMs?: number
    maxRetries?: number
    retryDelayMs?: number
  },
): Promise<GeminiResult> {
  const apiKey = getApiKey()
  if (!apiKey) {
    return {
      ok: false,
      code: 'not_configured',
      message: errorMessageFor('not_configured'),
    }
  }

  const model = options?.model ?? DEFAULT_MODEL
  const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES
  const retryDelayMs = options?.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS

  let lastError: GeminiError | null = null
  const attempts = maxRetries + 1

  // A caller-provided signal (e.g. an overall deadline) that fires while a
  // request is in flight or before a retry ends the attempt chain at once.
  function deadlineExceeded(): boolean {
    return options?.signal?.aborted === true
  }

  for (let attempt = 0; attempt < attempts; attempt++) {
    if (deadlineExceeded()) {
      return {
        ok: false,
        code: 'timeout',
        message: errorMessageFor('timeout'),
      }
    }

    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs))
      if (deadlineExceeded()) {
        return {
          ok: false,
          code: 'timeout',
          message: errorMessageFor('timeout'),
        }
      }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    if (options?.signal) {
      if (options.signal.aborted) {
        clearTimeout(timeoutId)
        return {
          ok: false,
          code: 'timeout',
          message: errorMessageFor('timeout'),
        }
      }
      options.signal.addEventListener('abort', () => controller.abort())
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 2048,
          },
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.status === 429) {
        lastError = {
          ok: false,
          code: 'rate_limit',
          message: errorMessageFor('rate_limit'),
          status: 429,
        }
        break
      }

      if (!response.ok) {
        lastError = {
          ok: false,
          code: 'request_failed',
          message: errorMessageFor('request_failed'),
          status: response.status,
        }
        // Transient server errors are retried; client 4xx errors are not.
        if (response.status >= 500 && !deadlineExceeded()) continue
        break
      }

      const data = (await response.json()) as Record<string, unknown>

      const candidates = data['candidates'] as unknown[]
      if (!Array.isArray(candidates) || candidates.length === 0) {
        lastError = {
          ok: false,
          code: 'invalid_response',
          message: errorMessageFor('invalid_response'),
        }
        break
      }

      const firstCandidate = candidates[0] as Record<string, unknown>

      // Detect truncated generation (hit the token cap) or a content-blocked
      // response so a partial/harm-blocked answer is never surfaced as valid.
      const finishReason = firstCandidate['finishReason']
      if (finishReason === 'MAX_TOKENS' || finishReason === 'SAFETY') {
        lastError = {
          ok: false,
          code: 'invalid_response',
          message: errorMessageFor('invalid_response'),
        }
        break
      }

      const content = firstCandidate['content'] as
        | Record<string, unknown>
        | undefined
      const parts = content?.['parts'] as unknown[] | undefined

      if (!Array.isArray(parts) || parts.length === 0) {
        lastError = {
          ok: false,
          code: 'invalid_response',
          message: errorMessageFor('invalid_response'),
        }
        break
      }

      const firstPart = parts[0] as Record<string, unknown>
      const text = firstPart['text']

      if (typeof text !== 'string' || text.length === 0) {
        lastError = {
          ok: false,
          code: 'invalid_response',
          message: errorMessageFor('invalid_response'),
        }
        break
      }

      return { ok: true, text }
    } catch (error) {
      clearTimeout(timeoutId)

      // A caller deadline (overall pipeline budget) was reached first.
      if (deadlineExceeded()) {
        lastError = {
          ok: false,
          code: 'timeout',
          message: errorMessageFor('timeout'),
        }
        break
      }

      if (controller.signal.aborted) {
        lastError = {
          ok: false,
          code: 'timeout',
          message: errorMessageFor('timeout'),
        }
        continue
      }

      lastError = {
        ok: false,
        code: 'request_failed',
        message: errorMessageFor('request_failed'),
      }
      continue
    }
  }

  return (
    lastError ?? {
      ok: false,
      code: 'request_failed',
      message: errorMessageFor('request_failed'),
    }
  )
}

/**
 * Returns whether the Gemini client is configured and ready to use.
 */
export function isGeminiConfigured(): boolean {
  return getApiKey() !== null
}
