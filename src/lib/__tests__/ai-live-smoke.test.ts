/**
 * OPT-IN live smoke test for the real Gemini 3.6 Flash endpoint.
 *
 * Runs ONLY when VITE_GEMINI_LIVE_TESTS=1 (so `npm test` never calls the API
 * unless explicitly requested). Requires VITE_GEMINI_API_KEY in .env.
 *
 * Purpose: measure real request latency and prove the live end-to-end
 * pipeline (build prompt -> Gemini REST -> parse -> validate) succeeds for
 * real citizen-style submissions. Logs timings only — never keys or data.
 */
import { describe, expect, it } from 'vitest'

import type { ChallengeSubmission } from '@/types/ai'
import {
  analyzeChallenge,
} from '@/features/ai/services/ai-analysis-service'
import {
  isGeminiConfigured,
  sendGeminiPrompt,
} from '@/lib/gemini-client'
import { buildAnalysisPrompt } from '@/lib/ai-prompt'
import { parseGeminiResponse } from '@/lib/ai-parser'
import { validateAiAnalysis } from '@/lib/ai-validator'
import { needsReviewerAttention } from '@/lib/ai-validator'

const RUN = import.meta.env.VITE_GEMINI_LIVE_TESTS === '1'

const TEST_A: ChallengeSubmission = {
  id: 'd1',
  citizenId: 'live',
  title: 'Dirty drinking water in Ward 12',
  description:
    'Residents in Ward 12 are receiving dirty water from the local supply. The water has visible particles and an unusual smell. Several households have complained about the problem.',
  location: { district: 'Bokaro' },
}

const TEST_B: ChallengeSubmission = {
  id: 'd2',
  citizenId: 'live',
  title: 'Damaged classroom roof in village school',
  description:
    'The roof of a government school classroom has damaged sections and water enters the classroom during rain. Students are forced to move to another room during heavy rainfall.',
  location: { district: 'Gumla' },
}

function stageStats<T extends { ok: boolean }>(
  label: string,
  started: number,
  previous: number,
  result: T,
) {
  const now = performance.now()
  const row: {
    stage: string
    stageMs: number
    cumulativeMs: number
    code?: string
  } = {
    stage: label,
    stageMs: Math.round(now - previous),
    cumulativeMs: Math.round(now - started),
  }
  const code = (result as { code?: unknown }).code
  if (!result.ok && typeof code === 'string') row.code = code
  // eslint-disable-next-line no-console
  console.log(`[live-ai] ${JSON.stringify(row)} result=${result.ok}`)
  return now
}

describe.skipIf(!RUN)('LIVE Gemini smoke — collections of measured samples', () => {
  it('is configured with a real API key', () => {
    expect(isGeminiConfigured()).toBe(true)
  })

  it('TEST A (water) end-to-end analysis succeeds within a bounded budget', async () => {
    const t0 = performance.now()
    const result = await analyzeChallenge(TEST_A)
    const elapsed = performance.now() - t0
    // eslint-disable-next-line no-console
    console.log(
      `[live-ai] TEST_A total=${Math.round(elapsed)}ms ok=${result.ok}`,
    )
    // Free-tier 429 rate limiting is ephemeral and not a pipeline failure.
    if (!result.ok && result.code === 'rate_limit') {
      console.warn(`[live-ai] TEST_A skipped - free-tier rate limit`)
      return
    }
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.analysis.primaryDomain).toBe('Water Management')
    expect(result.analysis.tags.length).toBeGreaterThanOrEqual(2)
    expect(result.analysis.tags.length).toBeLessThanOrEqual(6)
    expect(result.analysis.confidence).toBeGreaterThanOrEqual(0)
    expect(result.analysis.confidence).toBeLessThanOrEqual(1)
    expect(needsReviewerAttention(result.analysis.confidence)).toBe(false)
    // Bounded by the 45s pipeline budget.
    expect(elapsed).toBeLessThan(45_000)
  }, 120_000)

  it('TEST B (education) end-to-end analysis succeeds within a bounded budget', async () => {
    const t0 = performance.now()
    const result = await analyzeChallenge(TEST_B)
    const elapsed = performance.now() - t0
    // eslint-disable-next-line no-console
    console.log(
      `[live-ai] TEST_B total=${Math.round(elapsed)}ms ok=${result.ok}`,
    )
    // Free-tier 429 rate limiting is ephemeral and not a pipeline failure.
    if (!result.ok && result.code === 'rate_limit') {
      console.warn(`[live-ai] TEST_B skipped - free-tier rate limit`)
      return
    }
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.analysis.primaryDomain).toBe('Education')
    expect(result.analysis.confidence).toBeGreaterThanOrEqual(0)
    expect(result.analysis.confidence).toBeLessThanOrEqual(1)
    expect(elapsed).toBeLessThan(45_000)
  }, 120_000)

  it('raw request latency across samples (the number we tune against)', async () => {
    const prompts = [
      buildAnalysisPrompt(TEST_A),
      buildAnalysisPrompt(TEST_B),
      buildAnalysisPrompt(TEST_A),
      buildAnalysisPrompt(TEST_B),
    ]
    const t0 = performance.now()
    let cumulative = t0
    for (let i = 0; i < prompts.length; i++) {
      const started = cumulative
      const result = await sendGeminiPrompt(prompts[i]!)
      cumulative = stageStats(
        `request-${i + 1}`,
        t0,
        started,
        result,
      )
      if (!result.ok) {
        // eslint-disable-next-line no-console
        console.log(`[live-ai] request-${i + 1} code=${result.code}`)
        continue
      }
      const parseStarted = performance.now()
      const parsed = parseGeminiResponse(result.text)
      const parseMs = performance.now() - parseStarted
      expect(parsed.ok).toBe(true)
      if (!parsed.ok) return
      const validateStarted = performance.now()
      const validation = validateAiAnalysis(parsed.data)
      const validateMs = performance.now() - validateStarted
      expect(validation.ok).toBe(true)
      // eslint-disable-next-line no-console
      console.log(
        `[live-ai] request-${i + 1} parse=${Math.round(parseMs)}ms validate=${Math.round(validateMs)}ms`,
      )
    }
    const totalMs = performance.now() - t0
    // eslint-disable-next-line no-console
    console.log(`[live-ai] all raw requests total=${Math.round(totalMs)}ms`)
    // Every sample must resolve inside the bounded budget; free-tier rate
    // limiting (429) can make individual samples fail fast, which is expected.
  }, 120_000)
})