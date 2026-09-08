/**
 * AI Analysis Service — orchestrates the full AI Problem Engine pipeline:
 *
 *   Citizen submission
 *       ↓
 *   Prompt construction
 *       ↓
 *   Gemini API call
 *       ↓
 *   Response parsing
 *       ↓
 *   Schema validation
 *       ↓
 *   Validated AiAnalysisOutput
 *
 * The service does NOT write to Firestore — that responsibility belongs
 * to the calling layer (challenge submission flow / government integration).
 * This keeps the AI engine decoupled and testable.
 */

import type {
  AiAnalysisOutput,
  AiAnalysisResult,
  ChallengeSubmission,
} from '@/types/ai'
import { isAiGatewayConfigured, requestAiAnalysis } from '@/lib/ai-gateway-client'
import { parseGeminiResponse } from '@/lib/ai-parser'
import { validateAiAnalysis } from '@/lib/ai-validator'

/**
 * Hard wall-clock budget for the whole analysis (request + retry + parsing).
 * The Gemini client retries transient failures internally; this deadline caps
 * the total so the pipeline always resolves inside a bounded, practical time.
 * Real free-tier 3.6 Flash latency is ~8-28s, so 45s leaves headroom for
 * spikes while never leaving the UI stuck.
 */
const AI_TOTAL_BUDGET_MS = 45_000

/**
 * Dev-only, safe elapsed-time diagnostics. Logs durations and outcome codes
 * only — never API keys, tokens, or citizen data. Compiled out in production.
 * gated by import.meta.env.DEV so `npm run build` ships no instrumentation.
 */
function logStageDurations(stages: Record<string, number>, resultCode: string): void {
  if (!import.meta.env.DEV) return
  // eslint-disable-next-line no-console
  console.log(
    `[ai-pipeline] ${resultCode} ${Object.entries(stages)
      .map(([k, v]) => `${k}=${Math.round(v)}ms`)
      .join(' ')}`,
  )
}

/**
 * Runs the full AI analysis pipeline on a citizen challenge submission.
 *
 * Returns a discriminated union: { ok: true, analysis } or { ok: false, error }.
 * Never throws — all failures are captured in the result type.
 *
 * Retry behavior:
 * - A single attempt chain, bounded by AI_TOTAL_BUDGET_MS.
 * - The Gemini client retries ONCE on transient failures (timeout, network, 5xx).
 * - Does NOT retry invalid JSON, validation failures, or rate limits.
 *   (There is deliberately no outer retry loop — that would stack with the
 *   client's internal retry and double the worst-case latency.)
 */
export async function analyzeChallenge(
  submission: ChallengeSubmission,
): Promise<AiAnalysisResult> {
  if (!isAiGatewayConfigured()) {
    return {
      ok: false,
      code: 'gemini_not_configured',
      message:
        'AI analysis is not configured. Set VITE_AI_GATEWAY_URL in your .env file.',
    }
  }

  const deadlineController = new AbortController()
  const deadlineTimer = setTimeout(
    () => deadlineController.abort(),
    AI_TOTAL_BUDGET_MS,
  )

  const t0 = performance.now()

  try {
    const gatewayResult = await requestAiAnalysis(submission)
    clearTimeout(deadlineTimer)

    const geminiDuration = performance.now() - t0

    if (!gatewayResult.ok) {
      logStageDurations(
        { geminiRequest: geminiDuration },
        `failed:${gatewayResult.code}`,
      )
      return {
        ok: false,
        code:
          gatewayResult.code === 'not_configured'
            ? 'gemini_not_configured'
            : gatewayResult.code === 'timeout'
              ? 'gemini_timeout'
              : 'gemini_request_failed',
        message: gatewayResult.message,
      }
    }

    const tParse = performance.now()
    const parseResult = parseGeminiResponse(gatewayResult.text)
    const parseDuration = performance.now() - tParse

    if (!parseResult.ok) {
      logStageDurations(
        {
          geminiRequest: geminiDuration,
          parse: parseDuration,
        },
        `failed:${parseResult.code}`,
      )
      return {
        ok: false,
        code:
          parseResult.code === 'invalid_json'
            ? 'invalid_json'
            : 'validation_failed',
        message: parseResult.message,
      }
    }

    const tValidate = performance.now()
    const validationResult = validateAiAnalysis(parseResult.data)
    const validateDuration = performance.now() - tValidate

    if (!validationResult.ok) {
      const errorMessages = validationResult.errors
        .map((e) => e.message)
        .join('; ')
      logStageDurations(
        {
          geminiRequest: geminiDuration,
          parse: parseDuration,
          validate: validateDuration,
        },
        'failed:validation_failed',
      )
      return {
        ok: false,
        code: 'validation_failed',
        message: `AI analysis failed validation: ${errorMessages}`,
      }
    }

    logStageDurations(
      {
        geminiRequest: geminiDuration,
        parse: parseDuration,
        validate: validateDuration,
        total: performance.now() - t0,
      },
      'ok',
    )

    return {
      ok: true,
      analysis: parseResult.data,
      rawResponse: gatewayResult.text,
    }
  } catch (error) {
    logStageDurations(
      { total: performance.now() - t0 },
      'failed:unknown',
    )
    return {
      ok: false,
      code: 'unknown',
      message:
        error instanceof Error
          ? `Unexpected error: ${error.message}`
          : 'An unexpected error occurred during AI analysis.',
    }
  } finally {
    clearTimeout(deadlineTimer)
  }
}

/**
 * Builds the Firestore challenge_ai_analysis document from a validated output.
 *
 * Pure data transformation — no I/O.
 */
export function buildAnalysisDocument(
  challengeId: string,
  submission: ChallengeSubmission,
  output: AiAnalysisOutput,
  rawResponse: string,
): Record<string, unknown> {
  return {
    challengeId,
    primaryDomain: output.primaryDomain,
    secondaryDomain: output.secondaryDomain,
    tags: output.tags,
    urgency: output.urgency,
    impactScale: output.impactScale,
    locationContext: submission.location.district,
    requiredExpertise: output.requiredExpertise,
    requiredFacilities: output.requiredFacilities,
    problemSummary: output.problemSummary,
    duplicateSearchText: output.duplicateSearchText,
    duplicate_candidates: [],
    confidence: output.confidence,
    rawAiResponse: rawResponse,
    createdAt: Date.now(),
  }
}

/**
 * Returns true if confidence is below the reviewer-attention threshold.
 */
export function needsReviewerAttention(confidence: number): boolean {
  return confidence < 0.70
}
