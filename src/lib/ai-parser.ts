/**
 * Gemini response parsing — extracts and lightly cleans the JSON output.
 *
 * Does NOT validate taxonomy values. That is the validator's job.
 * This module only handles JSON extraction and basic shape checks.
 */

import type { AiAnalysisOutput } from '@/types/ai'

export type ParseResult =
  | { ok: true; data: AiAnalysisOutput }
  | { ok: false; code: 'invalid_json' | 'missing_fields'; message: string }

/**
 * Attempts to parse the Gemini text response into an AiAnalysisOutput.
 *
 * Handles common model quirks:
 * - Markdown code fences (```json ... ```)
 * - Trailing commas
 * - Extra whitespace
 */
export function parseGeminiResponse(rawText: string): ParseResult {
  const cleaned = extractJsonFromText(rawText)

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    return {
      ok: false,
      code: 'invalid_json',
      message: 'AI returned invalid JSON. Please try again.',
    }
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {
      ok: false,
      code: 'invalid_json',
      message: 'AI response is not a JSON object. Please try again.',
    }
  }

  const obj = parsed as Record<string, unknown>

  // Check required fields exist (types are checked by validator)
  const requiredFields = [
    'primaryDomain',
    'tags',
    'urgency',
    'impactScale',
    'requiredExpertise',
    'requiredFacilities',
    'problemSummary',
    'duplicateSearchText',
    'confidence',
  ] as const

  const missing = requiredFields.filter((f) => !(f in obj))
  if (missing.length > 0) {
    return {
      ok: false,
      code: 'missing_fields',
      message: `AI response is missing required fields: ${missing.join(', ')}.`,
    }
  }

  return {
    ok: true,
    data: {
      primaryDomain: obj['primaryDomain'] as string,
      secondaryDomain:
        obj['secondaryDomain'] === null || obj['secondaryDomain'] === undefined
          ? null
          : (obj['secondaryDomain'] as string),
      tags: obj['tags'] as string[],
      urgency: obj['urgency'] as AiAnalysisOutput['urgency'],
      impactScale: obj['impactScale'] as AiAnalysisOutput['impactScale'],
      requiredExpertise: obj['requiredExpertise'] as string[],
      requiredFacilities: obj['requiredFacilities'] as string[],
      problemSummary: obj['problemSummary'] as string,
      duplicateSearchText: obj['duplicateSearchText'] as string,
      confidence: obj['confidence'] as number,
    },
  }
}

/**
 * Strips markdown code fences and trims whitespace to extract raw JSON.
 */
function extractJsonFromText(text: string): string {
  let cleaned = text.trim()

  // Remove markdown code fences: ```json ... ``` or ``` ... ```
  const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*``/)
  if (fenceMatch?.[1]) {
    cleaned = fenceMatch[1].trim()
  }

  // Remove trailing commas before } or ] (common Gemini artifact)
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1')

  return cleaned
}
