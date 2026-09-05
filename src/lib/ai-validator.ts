/**
 * Application-side schema validation for AI analysis output.
 *
 * Validates taxonomy compliance, field presence, type correctness,
 * and value constraints. This is the authoritative validation gate —
 * Gemini output must pass ALL checks before being stored.
 */

import type { AiAnalysisOutput } from '@/types/ai'
import {
  isDomain,
  isApprovedTag,
  isTagForDomain,
  isUrgency,
  isImpactScale,
  type Domain,
} from './taxonomy'

export interface ValidationError {
  field: string
  message: string
}

export type ValidationResult =
  | { ok: true }
  | { ok: false; errors: ValidationError[] }

const MIN_TAGS = 2
const MAX_TAGS = 6

/**
 * Validates a raw AI analysis output against the locked contract.
 *
 * Returns ALL validation errors, not just the first one.
 */
export function validateAiAnalysis(
  data: AiAnalysisOutput,
): ValidationResult {
  const errors: ValidationError[] = []

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return {
      ok: false,
      errors: [
        {
          field: '*',
          message: 'AI analysis must be a JSON object.',
        },
      ],
    }
  }

  // primaryDomain — exactly one approved domain
  if (!isDomain(data.primaryDomain)) {
    errors.push({
      field: 'primaryDomain',
      message: `Invalid primary domain: "${data.primaryDomain}". Must be one of the approved domains.`,
    })
  }

  // secondaryDomain — null OR approved domain, must differ from primary
  if (data.secondaryDomain !== null) {
    if (!isDomain(data.secondaryDomain)) {
      errors.push({
        field: 'secondaryDomain',
        message: `Invalid secondary domain: "${data.secondaryDomain}". Must be one of the approved domains or null.`,
      })
    } else if (data.secondaryDomain === data.primaryDomain) {
      errors.push({
        field: 'secondaryDomain',
        message: 'Secondary domain must differ from primary domain.',
      })
    }
  }

  // tags — array of 2–6 approved tags
  if (!Array.isArray(data.tags)) {
    errors.push({
      field: 'tags',
      message: 'Tags must be an array.',
    })
  } else {
    if (data.tags.length < MIN_TAGS) {
      errors.push({
        field: 'tags',
        message: `Must have at least ${MIN_TAGS} tags. Got ${data.tags.length}.`,
      })
    }
    if (data.tags.length > MAX_TAGS) {
      errors.push({
        field: 'tags',
        message: `Must have at most ${MAX_TAGS} tags. Got ${data.tags.length}.`,
      })
    }

    const primaryDomain = data.primaryDomain as Domain
    const seen = new Set<string>()
    for (const tag of data.tags) {
      if (typeof tag !== 'string') {
        errors.push({
          field: 'tags',
          message: `Tag must be a string. Got: ${typeof tag}.`,
        })
        continue
      }
      if (seen.has(tag)) {
        errors.push({
          field: 'tags',
          message: `Duplicate tag: "${tag}".`,
        })
        continue
      }
      seen.add(tag)

      if (!isApprovedTag(tag)) {
        errors.push({
          field: 'tags',
          message: `Unknown tag: "${tag}". Not in the approved vocabulary.`,
        })
      } else if (
        isDomain(primaryDomain) &&
        !isTagForDomain(primaryDomain, tag)
      ) {
        // Cross-domain tags are allowed via secondaryDomain,
        // but we still flag tags that don't belong to either domain
        const secondaryOk =
          data.secondaryDomain !== null &&
          isDomain(data.secondaryDomain) &&
          isTagForDomain(data.secondaryDomain, tag)

        if (!secondaryOk) {
          errors.push({
            field: 'tags',
            message: `Tag "${tag}" does not belong to primary domain "${data.primaryDomain}"${data.secondaryDomain ? ` or secondary domain "${data.secondaryDomain}"` : ''}.`,
          })
        }
      }
    }
  }

  // urgency — low | medium | high only
  if (!isUrgency(data.urgency)) {
    errors.push({
      field: 'urgency',
      message: `Invalid urgency: "${data.urgency}". Must be low, medium, or high.`,
    })
  }

  // impactScale — one of 5 allowed values
  if (!isImpactScale(data.impactScale)) {
    errors.push({
      field: 'impactScale',
      message: `Invalid impact scale: "${data.impactScale}". Must be individual, household, neighborhood, village_ward, or district.`,
    })
  }

  // requiredExpertise — array of strings
  if (!Array.isArray(data.requiredExpertise)) {
    errors.push({
      field: 'requiredExpertise',
      message: 'requiredExpertise must be an array.',
    })
  } else if (data.requiredExpertise.some((e) => typeof e !== 'string' || e.length === 0)) {
    errors.push({
      field: 'requiredExpertise',
      message: 'All required expertise entries must be non-empty strings.',
    })
  }

  // requiredFacilities — array of strings
  if (!Array.isArray(data.requiredFacilities)) {
    errors.push({
      field: 'requiredFacilities',
      message: 'requiredFacilities must be an array.',
    })
  } else if (data.requiredFacilities.some((f) => typeof f !== 'string' || f.length === 0)) {
    errors.push({
      field: 'requiredFacilities',
      message: 'All required facilities entries must be non-empty strings.',
    })
  }

  // problemSummary — non-empty string
  if (typeof data.problemSummary !== 'string' || data.problemSummary.trim().length === 0) {
    errors.push({
      field: 'problemSummary',
      message: 'problemSummary must be a non-empty string.',
    })
  }

  // duplicateSearchText — non-empty string
  if (typeof data.duplicateSearchText !== 'string' || data.duplicateSearchText.trim().length === 0) {
    errors.push({
      field: 'duplicateSearchText',
      message: 'duplicateSearchText must be a non-empty string.',
    })
  }

  // confidence — number between 0 and 1
  if (typeof data.confidence !== 'number' || Number.isNaN(data.confidence)) {
    errors.push({
      field: 'confidence',
      message: `Invalid confidence: "${String(data.confidence)}". Must be a number.`,
    })
  } else {
    if (data.confidence < 0) {
      errors.push({
        field: 'confidence',
        message: `Confidence ${data.confidence} is below 0.`,
      })
    }
    if (data.confidence > 1) {
      errors.push({
        field: 'confidence',
        message: `Confidence ${data.confidence} is above 1.`,
      })
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors }
}

/**
 * Returns true if confidence is below the reviewer-attention threshold.
 */
export function needsReviewerAttention(confidence: number): boolean {
  return confidence < 0.70
}
