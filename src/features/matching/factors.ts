/**
 * Factor calculations for the University Matching Engine.
 *
 * Each factor is a pure, deterministic function of challenge requirements and
 * university capabilities. No AI, no randomness, no external calls.
 *
 * All factors return a score on the 0-100 scale.
 */
import {
  FACILITY_FALLBACK,
  LOCATION_SCORE,
  PROJECT_RELEVANCE_SCALE,
  STUDENT_FALLBACK,
  districtRegion,
} from './config'
import {
  countMatches,
  containsNormalized,
  normalizeList,
  normalizedSet,
  normalizeString,
} from './normalize'
import type { ChallengeInput, UniversityProfile } from './types'

type DomainRelationship = 'primary' | 'secondary' | 'none'

function domainRelationship(
  challenge: ChallengeInput,
  university: UniversityProfile,
): DomainRelationship {
  const domains = normalizedSet(university.domains)

  if (challenge.primaryDomain && containsNormalized(domains, challenge.primaryDomain)) {
    return 'primary'
  }

  if (
    challenge.secondaryDomain &&
    containsNormalized(domains, challenge.secondaryDomain)
  ) {
    return 'secondary'
  }

  return 'none'
}

/**
 * Expertise score:
 *   domainScore = 100 if primary domain supported
 *                 50 if only secondary domain supported
 *                  0 otherwise
 *   tagScore    = (matching required tags / required tags) * 100
 *   expertiseScore = domainScore * 0.60 + tagScore * 0.40
 *
 * Required expertise is used as a secondary signal: if the university lists the
 * required expertise in its profile, it is reflected in the tag component of
 * the score. No sixth scoring factor is introduced.
 *
 * If the challenge has no required tags, the tag component is treated as 0
 * (no unsupported signal) so the expertise score reduces to the domain
 * component alone. Determined by `challenge.tags` (the AI-contract tags).
 */
export function expertiseScore(
  challenge: ChallengeInput,
  university: UniversityProfile,
): number {
  const relationship = domainRelationship(challenge, university)

  let domainScore = 0
  switch (relationship) {
    case 'primary':
      domainScore = 100
      break
    case 'secondary':
      domainScore = 50
      break
    case 'none':
      domainScore = 0
      break
  }

  // Required tags component — uses the challenge's controlled tags. A tag is
  // considered supported when it appears in the university's domain set or its
  // expertise profile.
  const requiredTags = normalizeList(challenge.tags)
  let tagScore = 0
  if (requiredTags.length > 0) {
    const supported = [
      ...(university.domains ?? []),
      ...(university.expertise ?? []),
    ]
    const matchedTags = countMatches(supported, requiredTags)
    tagScore = (matchedTags / requiredTags.length) * 100
  }

  const domainComponent = domainScore * 0.6
  const tagComponent = tagScore * 0.4

  // Required expertise is a secondary compatibility signal used in the tag
  // component when the controlled tag list is empty, so that an expertise-only
  // profile is still distinguished without introducing a sixth factor.
  let requiredExpertiseScore = domainComponent + tagComponent
  const requiredExpertise = normalizeList(challenge.requiredExpertise)
  if (requiredTags.length === 0 && requiredExpertise.length > 0) {
    const matchedExpertise = countMatches(
      university.expertise ?? [],
      requiredExpertise,
    )
    const expertiseRatio = (matchedExpertise / requiredExpertise.length) * 100
    requiredExpertiseScore = domainComponent + expertiseRatio * 0.4
  }

  return roundScore(requiredExpertiseScore)
}

/**
 * Facilities score:
 *   facilityScore = (matched required facilities / required facilities) * 100
 *   = 70 if the challenge specifies no required facilities (LOCKED fallback)
 */
export function facilitiesScore(
  challenge: ChallengeInput,
  university: UniversityProfile,
): number {
  const requiredFacilities = normalizeList(challenge.requiredFacilities)
  if (requiredFacilities.length === 0) {
    return FACILITY_FALLBACK
  }
  const matched = countMatches(university.facilities ?? [], requiredFacilities)
  return roundScore((matched / requiredFacilities.length) * 100)
}

/**
 * Previous-project score using the locked scale. Determined from the seeded
 * dataset (never Gemini). Uses overlap of each project's text with the
 * challenge's required tags and domain(s) to select a level deterministically.
 *
 * 100 = directly relevant previous project
 * 75  = strongly related
 * 50  = related domain
 * 25  = weakly related
 * 0   = no relevant evidence
 */
export function previousProjectsScore(
  challenge: ChallengeInput,
  university: UniversityProfile,
): number {
  const evidence = normalizeList(
    university.previousProjects?.filter((p) => p && p.toLowerCase() !== 'unknown') ?? [],
  )
  if (evidence.length === 0) {
    return PROJECT_RELEVANCE_SCALE.none
  }

  const requiredTags = normalizeList(challenge.tags)
  const primary = normalizeString(challenge.primaryDomain)
  const secondary = challenge.secondaryDomain
    ? normalizeString(challenge.secondaryDomain)
    : ''

  let best: number = PROJECT_RELEVANCE_SCALE.none

  for (const project of evidence) {
    const tagHits = requiredTags.filter((tag) => project.includes(tag)).length
    const primaryHit = primary.length > 0 && project.includes(primary)
    const secondaryHit = secondary.length > 0 && project.includes(secondary)

    let level: number = PROJECT_RELEVANCE_SCALE.none

    if (tagHits > 0 && (primaryHit || secondaryHit)) {
      // Directly relevant: matches activity in the domain AND a required tag.
      level = PROJECT_RELEVANCE_SCALE.direct
    } else if (tagHits >= 2 || (tagHits >= 1 && (primaryHit || secondaryHit))) {
      level = PROJECT_RELEVANCE_SCALE.strong
    } else if (tagHits >= 1) {
      level = PROJECT_RELEVANCE_SCALE.related
    } else if (primaryHit || secondaryHit) {
      level = PROJECT_RELEVANCE_SCALE.weak
    }

    if (level > best) {
      best = level
    }
  }

  return best
}

/**
 * Student capability score:
 *   studentCapabilityScore = (matching student skills / required student skills) * 100
 *   = 70 if no specific student skills are required (LOCKED fallback)
 *
 * Reflects the university's studentCapabilities profile. University capacity is
 * NOT used here — Student Capability is a distinct factor.
 */
export function studentCapabilityScore(
  challenge: ChallengeInput,
  university: UniversityProfile,
): number {
  const requiredSkills = normalizeList(challenge.requiredExpertise)
  if (requiredSkills.length === 0) {
    return STUDENT_FALLBACK
  }
  const matched = countMatches(
    university.studentCapabilities ?? [],
    requiredSkills,
  )
  return roundScore((matched / requiredSkills.length) * 100)
}

/**
 * Location score:
 *   100 = same district
 *   80  = different district, same region
 *   70  = elsewhere in Jharkhand
 *   50  = outside Jharkhand
 *
 * For a university outside the known Jharkhand mapping, the district is treated
 * as "outside Jharkhand" deterministically. If a university's district is
 * "unknown", it receives the outside-Jharkhand fallback (50) — no invented
 * location is assumed.
 */
export function locationScore(
  challenge: ChallengeInput,
  university: UniversityProfile,
): number {
  const challengeDistrict = normalizeString(challenge.location?.district ?? '')
  const uniDistrict = normalizeString(university.district ?? '')

  // No invented location: an unknown or empty university district is scored as
  // outside Jharkhand (deterministic fallback).
  if (
    university.district?.toLowerCase() === 'unknown' ||
    uniDistrict.length === 0
  ) {
    return LOCATION_SCORE.outsideJharkhand
  }

  const uniRegion = districtRegion(uniDistrict)
  // A university district not present in the known Jharkhand mapping is treated
  // as outside Jharkhand.
  if (uniRegion === null) {
    return LOCATION_SCORE.outsideJharkhand
  }

  if (challengeDistrict === uniDistrict) {
    return LOCATION_SCORE.sameDistrict
  }

  const challengeRegion = districtRegion(challengeDistrict)

  if (challengeRegion !== null && challengeRegion === uniRegion) {
    return LOCATION_SCORE.differentDistrictSameRegion
  }

  // University is in Jharkhand; if the challenge is also in Jharkhand but a
  // different region -> elsewhere in Jharkhand. If the challenge location is
  // unknown/outside Jharkhand, treat it as elsewhere in Jharkhand.
  return LOCATION_SCORE.elsewhereInJharkhand
}

/**
 * Rounds a score to one decimal place for deterministic, stable output.
 */
export function roundScore(value: number): number {
  return Math.round(value * 10) / 10
}
