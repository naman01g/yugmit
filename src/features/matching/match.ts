/**
 * Match document generation + engine orchestration.
 *
 * Generates immutable, versioned match documents from scored, ranked results.
 * Handles the zero-qualifying-match case explicitly and never fabricates a
 * university or a score.
 */
import { ALGORITHM_VERSION, DEFAULT_WEIGHTS } from './config'
import { buildExplanation } from './explanations'
import { computeFactors, scoreAndRank, validateWeights } from './score'
import type {
  ChallengeMatch,
  ChallengeInput,
  MatchingResult,
  MatchingWeights,
  ScoredMatch,
  UniversityProfile,
} from './types'

/**
 * Min score for a match to be considered "meaningful/qualifying".
 * Below this a university is dropped rather than ranked at the bottom.
 * Encountered by the no-match path and the display layer.
 */
export const MIN_MEANINGFUL_SCORE = 40

/**
 * Generates a single immutable match document for a scored, ranked pair.
 */
export function createMatchDocument(
  challenge: ChallengeInput,
  university: UniversityProfile,
  score: number,
  rank: number,
  weights: MatchingWeights,
  createdAt: number,
): ChallengeMatch {
  const factors = computeFactors(challenge, university)

  return {
    challengeId: challenge.challengeId ?? '',
    universityId: university.id,
    score: Math.round(score * 10) / 10,
    rank,
    factors,
    weightsSnapshot: { ...weights },
    algorithmVersion: ALGORITHM_VERSION,
    createdAt,
  }
}

/**
 * Runs the full matching engine for a challenge against a university pool.
 *
 * - normalizes/validates weights (falling back to defaults on invalid input)
 * - scores and ranks every university deterministically
 * - filters out non-meaningful matches
 * - returns structured, explainable match results or an explicit no-match
 *
 * Never writes to Firestore; it only produces documents. Persistence is a
 * separate concern handled by `persistMatches`.
 */
export function runMatchingEngine(
  challenge: ChallengeInput,
  universities: UniversityProfile[],
  options?: { weights?: MatchingWeights; createdAt?: number; minScore?: number },
): MatchingResult {
  const weights =
    options?.weights && validateWeights(options.weights)
      ? options.weights
      : DEFAULT_WEIGHTS
  const createdAt = options?.createdAt ?? Date.now()
  const minScore = options?.minScore ?? MIN_MEANINGFUL_SCORE

  const ranked = scoreAndRank(challenge, universities, weights)

  const qualifying = ranked.filter(({ score }) => score >= minScore)

  if (qualifying.length === 0) {
    return {
      status: 'no-match',
      matches: [],
      reasons: noMatchReasons(challenge, universities),
    }
  }

  const matches: ScoredMatch[] = qualifying.map(({ university, score, rank }) => {
    const match = createMatchDocument(challenge, university, score, rank, weights, createdAt)
    const explanation = buildExplanation(challenge, university, match.factors)
    return { match, explanation }
  })

  return { status: 'matched', matches }
}

/**
 * Deterministic human-readable reasons for the no-match case.
 */
function noMatchReasons(
  challenge: ChallengeInput,
  universities: UniversityProfile[],
): string[] {
  const reasons: string[] = []
  if (universities.length === 0) {
    reasons.push('No university profiles were available to score.')
  } else {
    reasons.push(
      `No university reached the minimum meaningful match threshold (${MIN_MEANINGFUL_SCORE}).`,
    )
  }
  if (!challenge.primaryDomain) {
    reasons.push('The challenge has no primary domain to match against.')
  }
  return reasons
}
