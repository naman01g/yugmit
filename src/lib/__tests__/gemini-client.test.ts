/**
 * gemini-client unit tests — bounded timeout, retry policy, response parsing.
 * Uses a stubbed global fetch; never touches the real network.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { sendGeminiPrompt } from '../gemini-client'

function okResponse(text: string, finishReason = 'STOP') {
  return new Response(
    JSON.stringify({
      candidates: [
        { finishReason, content: { parts: [{ text }] } },
      ],
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * A fetch mock that never resolves until the request signal aborts — used to
 * prove the AbortController timeout bounds the call (no hanging Promise).
 */
function stalledFetch() {
  return (_url: unknown, init?: RequestInit): Promise<Response> =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        reject(new DOMException('The operation was aborted.', 'AbortError'))
      })
    })
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('sendGeminiPrompt — success path', () => {
  it('returns the text from candidates[0].content.parts[0]', async () => {
    fetchMock.mockResolvedValue(okResponse('{"ok":true}'))

    const result = await sendGeminiPrompt('hello')

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.text).toBe('{"ok":true}')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('requests the locked gemini-3.6-flash model endpoint with the API key', async () => {
    fetchMock.mockResolvedValue(okResponse('x'))

    await sendGeminiPrompt('hello')

    const url = fetchMock.mock.calls[0]![0] as string
    expect(url).toContain('v1beta/models/gemini-3.6-flash:generateContent')
    expect(url).toContain('key=')
  })

  it('sends maxOutputTokens bound without temperature/topP/topK', async () => {
    fetchMock.mockResolvedValue(okResponse('x'))

    await sendGeminiPrompt('hello')

    const body = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string)
    expect(body['generationConfig']).toEqual({ maxOutputTokens: 2048 })
    expect(body['generationConfig']['temperature']).toBeUndefined()
  })
})

describe('sendGeminiPrompt — not configured', () => {
  it('returns not_configured without calling the network', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', '')

    const result = await sendGeminiPrompt('hello')

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('not_configured')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('sendGeminiPrompt — retry policy', () => {
  it('does NOT retry rate limits (429); returns rate_limit with one call', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: { message: 'rate limited' } }, 429),
    )

    const result = await sendGeminiPrompt('hello')

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('rate_limit')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('does NOT retry client 4xx errors; returns request_failed with one call', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: { message: 'bad request' } }, 400),
    )

    const result = await sendGeminiPrompt('hello')

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('request_failed')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('retries ONCE on a 5xx and succeeds if the retry succeeds', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: {} }, 500))
      .mockResolvedValueOnce(okResponse('{"ok":true}'))

    const result = await sendGeminiPrompt('hello')

    expect(result.ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('gives up after one retry when 5xx persists', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: {} }, 503))

    const result = await sendGeminiPrompt('hello')

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('request_failed')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

describe('sendGeminiPrompt — bounded timeout (never hangs)', () => {
  it('single attempt aborts around the configured timeout', async () => {
    fetchMock.mockImplementation(stalledFetch())

    const started = performance.now()
    const result = await sendGeminiPrompt('hello', {
      timeoutMs: 50,
      maxRetries: 0,
    })
    const elapsedMs = performance.now() - started

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('timeout')
    expect(elapsedMs).toBeLessThan(1000)
    expect(elapsedMs).toBeGreaterThan(30)
  })

  it('retries once after a timeout, then returns timeout (bounded total)', async () => {
    fetchMock.mockImplementation(stalledFetch())

    const started = performance.now()
    const result = await sendGeminiPrompt('hello', {
      timeoutMs: 40,
      retryDelayMs: 0,
    })
    const elapsedMs = performance.now() - started

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('timeout')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(elapsedMs).toBeLessThan(1000)
  })

  it('honors an already-aborted external deadline without any network call', async () => {
    const controller = new AbortController()
    controller.abort()

    const result = await sendGeminiPrompt('hello', {
      signal: controller.signal,
      maxRetries: 1,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('timeout')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('sendGeminiPrompt — invalid responses are not retried or fabricated', () => {
  it('rejects an empty candidate list', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ candidates: [] }))

    const result = await sendGeminiPrompt('hello')

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('invalid_response')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('rejects a MAX_TOKENS truncated generation (finishReason)', async () => {
    fetchMock.mockResolvedValue(okResponse('{"primaryDomain":"Educ', 'MAX_TOKENS'))

    const result = await sendGeminiPrompt('hello')

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('invalid_response')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('rejects an empty text part', async () => {
    fetchMock.mockResolvedValue(okResponse(''))

    const result = await sendGeminiPrompt('hello')

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('invalid_response')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})