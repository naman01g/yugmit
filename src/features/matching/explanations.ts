/**
 * Deterministic explanation generation.
 *
 * Explanations are derived ONLY from the actual matched factors and the
 * university profile — never invented, never AI-written, and never claiming a
 * capability absent from the profile. The text corresponds exactly to the
 * stored/calculated factor values.
 */
import { containsNormalized, normalizeList, normalizedSet } from './normalize'
import type {
  ChallengeInput,
  MatchFactors,
  MatchExplanation,
  UniversityProfile,
} from './types'

const STRONG = 'strong'
const MIXED = 'mixed'
const WEAK = 'weak'

function band(score: number): string {
  if (score >= 75) return STRONG
  if (score >= 40) return MIXED
  return WEAK
}

/**
 * Builds a plain-language explanation from the actual factors.
 * The summary is programmatic and the reasons list is deterministic.
 */
export function buildExplanation(
  challenge: ChallengeInput,
  university: UniversityProfile,
  factors: MatchFactors,
): MatchExplanation {
  const reasons: string[] = []
  const domains = normalizedSet(university.domains)
  const supportsPrimary = containsNormalized(domains, challenge.primaryDomain)
  const supportsSecondary =
    !!challenge.secondaryDomain &&
    containsNormalized(domains, challenge.secondaryDomain)

  if (supportsPrimary) {
    reasons.push(`strong ${challenge.primaryDomain} expertise`)
  } else if (supportsSecondary) {
    reasons.push(`${challenge.secondaryDomain} secondary-domain expertise`)
  } else {
    reasons.push(`no matching domain expertise in ${challenge.primaryDomain}`)
  }

  const requiredTags = normalizeList(challenge.tags)
  if (requiredTags.length > 0) {
    const matchedTags = requiredTags.filter((tag) =>
      containsNormalized(domains, tag),
    )
    if (matchedTags.length > 0) {
      reasons.push(`matching ${matchedTags.join(', ')} expertise`)
    }
  }

  const requiredExpertise = normalizeList(challenge.requiredExpertise)
  if (requiredExpertise.length > 0) {
    const matchedExpertise = requiredExpertise.filter((tag) =>
      containsNormalized(normalizedSet(university.expertise ?? []), tag),
    )
    if (matchedExpertise.length > 0) {
      reasons.push(`matching expertise in ${matchedExpertise.join(', ')}`)
    }
  }

  const requiredFacilities = normalizeList(challenge.requiredFacilities)
  if (requiredFacilities.length > 0) {
    const matchedFacilities = requiredFacilities.filter((tag) =>
      containsNormalized(normalizedSet(university.facilities ?? []), tag),
    )
    if (matchedFacilities.length > 0) {
      reasons.push(`required ${matchedFacilities.join(', ')} facilities available`)
    } else {
      reasons.push('none of the required facilities matched')
    }
  }

  const evidence = normalizeList(
    university.previousProjects?.filter(
      (p) => p && p.toLowerCase() !== 'unknown',
    ) ?? [],
  )
  if (factors.previousProjects >= 75 && evidence.length > 0) {
    reasons.push(
      `${band(factors.previousProjects)}ly relevant previous project evidence`,
    )
  } else if (factors.previousProjects > 0) {
    reasons.push('some related previous project evidence')
  } else {
    reasons.push('no relevant previous project evidence')
  }

  const skills = normalizeList(university.studentCapabilities ?? [])
  if (factors.studentCapability >= 75 && skills.length > 0) {
    reasons.push(`strong student capability (${skills.length} skill area(s))`)
  } else if (factors.studentCapability === 70) {
    reasons.push('student capability: acceptable default (no specific skills required)')
  } else if (factors.studentCapability > 0) {
    reasons.push('partial student capability coverage')
  } else {
    reasons.push('no matching student capability evidence')
  }

  reasons.push(locationReason(challenge, university, factors.location))

  return {
    summary: buildSummary(factors),
    reasons,
  }
}

function locationReason(
  challenge: ChallengeInput,
  university: UniversityProfile,
  locationScore: number,
): string {
  const sameDistrict =
    normalizeString(university.district ?? '') ===
    normalizeString(challenge.location?.district ?? '')
  if (sameDistrict) {
    return `located in the same district (${university.district})`
  }
  if (locationScore === 80) {
    return 'different district, same region'
  }
  if (locationScore === 70) {
    return 'elsewhere in Jharkhand'
  }
  return 'outside Jharkhand (or district unknown)'
}

function buildSummary(factors: MatchFactors): string {
  const overall = band(factors.expertise) === STRONG
  return overall
    ? `Strong match with strong expertise and good supporting capability`
    : `Moderate match across the five scoring factors`
}

/**
 * Internal helper so this module stays self-contained.
 */
function normalizeString(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}
