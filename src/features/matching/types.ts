/**
 * University Matching Engine — shared types.
 *
 * These types mirror the locked schemas in ARCHITECTURE.md and AI_ENGINE.md.
 * They are engine-owned inputs/outputs only; they do not replace or compete
 * with the AI analysis contract. The matching engine is deterministic and
 * AI is never used for scoring.
 */

/**
 * Weights applied to each of the five locked matching factors.
 * Stored as a versioned snapshot on every match document so historical
 * results remain explainable even if weights are tuned later.
 */
export interface MatchingWeights {
  expertise: number
  facilities: number
  previousProjects: number
  studentCapability: number
  location: number
}

/**
 * The five locked matching factors (0-100 each).
 */
export interface MatchFactors {
  expertise: number
  facilities: number
  previousProjects: number
  studentCapability: number
  location: number
}

/**
 * The challenge information consumed by the matching engine.
 * This is the subset of the AI analysis / challenge record used for scoring.
 */
export interface ChallengeInput {
  /** Identifier of the challenge, used to stamp the match document. */
  challengeId?: string
  primaryDomain: string
  secondaryDomain: string | null
  tags: string[]
  requiredExpertise: string[]
  requiredFacilities: string[]
  location: {
    district: string
  }
}

/**
 * A university capability profile, as consumed by the matching engine.
 * Indices map to sourceUrls[] at the same index position — every real claim
 * must be verifiable, and unverifiable claims use the literal string "unknown".
 */
export interface UniversityProfile {
  id: string
  name: string
  type: string
  district: string
  region: string
  domains: string[]
  expertise: string[]
  facilities: string[]
  previousProjects: string[]
  studentCapabilities: string[]
  innovationCapability: string
  capacity: number
  taxonomyMappings: string[]
  sourceUrls: string[]
}

/**
 * A single immutable match document (one per challenge + university pair),
 * matching the locked `challenge_matches` schema in ARCHITECTURE.md.
 */
export interface ChallengeMatch {
  challengeId: string
  universityId: string
  score: number
  rank: number
  factors: MatchFactors
  weightsSnapshot: MatchingWeights
  algorithmVersion: string
  createdAt: number
}

/**
 * Human-readable, deterministic explanation derived only from the actual
 * matched factors. Never invented by AI or from capabilities absent from
 * the university profile.
 */
export interface MatchExplanation {
  summary: string
  reasons: string[]
}

/**
 * Result of scoring a single university against a challenge.
 */
export interface ScoredMatch {
  match: ChallengeMatch
  explanation: MatchExplanation
}

/**
 * Result of running the matching engine over a pool of universities.
 */
export type MatchingResult =
  | {
      status: 'matched'
      matches: ScoredMatch[]
    }
  | {
      status: 'no-match'
      matches: []
      reasons: string[]
    }
