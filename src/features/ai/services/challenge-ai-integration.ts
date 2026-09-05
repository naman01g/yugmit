/**
 * Challenge → AI integration layer.
 *
 * Composes the (pure) AI Problem Engine with Firestore persistence:
 * runs Gemini analysis for a created challenge, validates the output,
 * and writes the immutable challenge_ai_analysis/{challengeId} document.
 *
 * Challenge creation is decoupled: this layer never throws and a Gemini
 * failure leaves the already-created challenge fully intact (the citizen is
 * never blocked from submitting because analysis is temporarily unavailable).
 */

import { doc, getDoc, setDoc } from 'firebase/firestore'

import { db as firebaseDb, isFirebaseConfigured } from '@/lib/firebase'
import type { ChallengeAiAnalysis, ChallengeSubmission } from '@/types/ai'
import {
  analyzeChallenge,
  buildAnalysisDocument,
  needsReviewerAttention,
} from './ai-analysis-service'

export interface ChallengeAiRunSuccess {
  ok: true
  state: 'completed'
  analysis: ChallengeAiAnalysis
  lowConfidence: boolean
}

export interface ChallengeAiRunFailure {
  ok: false
  state: 'failed'
  errorCode: string
  message: string
}

export type ChallengeAiRun = ChallengeAiRunSuccess | ChallengeAiRunFailure

function requireDb(): NonNullable<typeof firebaseDb> {
  if (!firebaseDb || !isFirebaseConfigured) {
    throw {
      code: 'firebase/not-configured',
      message: 'Firebase is not configured.',
    }
  }
  return firebaseDb
}

/**
 * Writes an AI analysis document for a challenge.
 * Firestore rules make challenge_ai_analysis immutable after create
 * (update and delete are denied server-side), so this is create-only.
 */
export async function persistAiAnalysis(
  challengeId: string,
  document: Record<string, unknown>,
): Promise<void> {
  const db = requireDb()
  await setDoc(doc(db, 'challenge_ai_analysis', challengeId), document)
}

/**
 * Reads the stored AI analysis for a challenge, or null when unavailable.
 */
export async function getChallengeAiAnalysis(
  challengeId: string,
): Promise<Record<string, unknown> | null> {
  const db = requireDb()
  const snapshot = await getDoc(doc(db, 'challenge_ai_analysis', challengeId))
  if (!snapshot.exists()) return null
  return snapshot.data()
}

/**
 * Runs the full AI pipeline for a newly created challenge and persists the
 * result. Returns a structured result for the UI and never throws.
 *
 * - Missing Gemini key / request failure / invalid JSON / validation failure
 *   map to their respective error codes and surface in the UI.
 * - Low confidence (< 0.70) is flagged for reviewer attention, not rejected.
 */
export async function runChallengeAiAnalysis(
  challengeId: string,
  submission: ChallengeSubmission,
): Promise<ChallengeAiRun> {
  try {
    const result = await analyzeChallenge(submission)

    if (!result.ok) {
      return {
        ok: false,
        state: 'failed',
        errorCode: result.code,
        message: result.message,
      }
    }

    const document = buildAnalysisDocument(
      challengeId,
      submission,
      result.analysis,
      result.rawResponse,
    )

    try {
      await persistAiAnalysis(challengeId, document)
    } catch (error) {
      return {
        ok: false,
        state: 'failed',
        errorCode: 'persist_failed',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to persist the AI analysis.',
      }
    }

    return {
      ok: true,
      state: 'completed',
      analysis: document as unknown as ChallengeAiAnalysis,
      lowConfidence: needsReviewerAttention(result.analysis.confidence),
    }
  } catch (error) {
    return {
      ok: false,
      state: 'failed',
      errorCode: 'unknown',
      message:
        error instanceof Error
          ? `Unexpected error: ${error.message}`
          : 'An unexpected error occurred during AI analysis.',
    }
  }
}