/**
 * AI Problem Engine types — locked contract from AI_ENGINE.md / ARCHITECTURE.md.
 *
 * These types define the public AI output contract and the Firestore document
 * schema for challenge_ai_analysis. Do NOT add fields unless the project
 * documentation explicitly requires them.
 */

// ---------------------------------------------------------------------------
// Locked AI output contract (what Gemini must produce)
// ---------------------------------------------------------------------------

/**
 * The raw structured output from Gemini analysis.
 * This is the public AI contract — it is NOT the Firestore document.
 */
export interface AiAnalysisOutput {
  primaryDomain: string
  secondaryDomain: string | null
  tags: string[]
  urgency: 'low' | 'medium' | 'high'
  impactScale:
    | 'individual'
    | 'household'
    | 'neighborhood'
    | 'village_ward'
    | 'district'
  requiredExpertise: string[]
  requiredFacilities: string[]
  problemSummary: string
  duplicateSearchText: string
  confidence: number
}

// ---------------------------------------------------------------------------
// Firestore document: challenge_ai_analysis/{challengeId}
// Immutable after creation. See ARCHITECTURE.md for the full schema.
// ---------------------------------------------------------------------------

export interface ChallengeAiAnalysis {
  challengeId: string
  primaryDomain: string
  secondaryDomain: string | null
  tags: string[]
  urgency: 'low' | 'medium' | 'high'
  impactScale:
    | 'individual'
    | 'household'
    | 'neighborhood'
    | 'village_ward'
    | 'district'
  locationContext: string
  requiredExpertise: string[]
  requiredFacilities: string[]
  problemSummary: string
  duplicateSearchText: string
  duplicate_candidates: { challengeId: string; similarity: number }[]
  confidence: number
  rawAiResponse: string
  createdAt: number
}

// ---------------------------------------------------------------------------
// Input to the AI analysis service
// ---------------------------------------------------------------------------

export interface ChallengeSubmission {
  id: string
  title: string
  description: string
  location: { district: string; lat?: number; lng?: number }
  citizenId: string
}

// ---------------------------------------------------------------------------
// AI service result types
// ---------------------------------------------------------------------------

export type AiAnalysisSuccess = {
  ok: true
  analysis: AiAnalysisOutput
  rawResponse: string
}

export type AiAnalysisError = {
  ok: false
  code:
    | 'gemini_not_configured'
    | 'gemini_request_failed'
    | 'gemini_timeout'
    | 'rate_limit'
    | 'invalid_json'
    | 'validation_failed'
    | 'missing_fields'
    | 'confidence_below_threshold'
    | 'unknown'
  message: string
}

export type AiAnalysisResult = AiAnalysisSuccess | AiAnalysisError
