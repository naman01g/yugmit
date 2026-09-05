/**
 * Final weighted score and ranking for the matching engine.
 *
 * score = expertiseScore * 0.35
 *       + facilityScore  * 0.25
 *       + projectScore   * 0.15
 *       + studentScore   * 0.15
 *       + locationScore  * 0.10
 *
 * Rounded to one decimal place. Sorted descending by score.
 */
import { DEFAULT_WEIGHTS } from './config'
import type {
  ChallengeInput,
  MatchFactors,
  MatchingWeights,
  UniversityProfile,
} from './types'
import {
  expertiseScore,
  facilitiesScore,
  locationScore,
  previousProjectsScore,
  studentCapabilityScore,
} from './factors'

/**
 * Computes the four-or-five factors for a challenge + university pair.
 */
export function computeFactors(
  challenge: ChallengeInput,
  university: UniversityProfile,
): MatchFactors {
  return {
    expertise: expertiseScore(challenge, university),
    facilities: facilitiesScore(challenge, university),
    previousProjects: previousProjectsScore(challenge, university),
    studentCapability: studentCapabilityScore(challenge, university),
    location: locationScore(challenge, university),
  }
}

/**
 * Validates that a weights object matches the locked factor set, is fully
 * populated, and sums to 1. Returns null when invalid (caller falls back to
 * defaults / rejects).
 */
export function validateWeights(weights: MatchingWeights): boolean {
  const keys: (keyof MatchingWeights)[] = [
    'expertise',
    'facilities',
    'previousProjects',
    'studentCapability',
    'location',
  ]
  let sum = 0
  for (const key of keys) {
    const value = weights[key]
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return false
    }
    sum += value
  }
  return Math.abs(sum - 1) < 1e-6
}

/**
 * Computes the final weighted score for a set of factors.
 * Rounded to one decimal place.
 */
export function finalScore(
  factors: MatchFactors,
  weights: MatchingWeights = DEFAULT_WEIGHTS,
): number {
  const sum =
    factors.expertise * weights.expertise +
    factors.facilities * weights.facilities +
    factors.previousProjects * weights.previousProjects +
    factors.studentCapability * weights.studentCapability +
    factors.location * weights.location

  return Math.round(sum * 10) / 10
}

/**
 * Scores every university in the pool and returns them ranked, each tagged
 * with its 1-based rank. Ranks are assigned deterministically; ties keep
 * their stable input order (never random).
 */
export function scoreAndRank(
  challenge: ChallengeInput,
  universities: UniversityProfile[],
  weights: MatchingWeights = DEFAULT_WEIGHTS,
): Array<{
  university: UniversityProfile
  factors: MatchFactors
  score: number
  rank: number
}> {
  const scored = universities.map((university) => {
    const factors = computeFactors(challenge, university)
    return { university, factors, score: finalScore(factors, weights) }
  })

  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score
    }
    // Stable tie-break by university id keeps output deterministic.
    return a.university.id.localeCompare(b.university.id)
  })

  return scored.map((entry, index) => ({ ...entry, rank: index + 1 }))
}
