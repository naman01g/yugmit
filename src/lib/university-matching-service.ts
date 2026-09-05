/**
 * University Matching Service — integration layer between government
 * validation and the pure matching engine (Module 06).
 *
 * Matching trigger (ARCHITECTURE.md): after a government user validates a
 * challenge, the government client runs the matching engine locally:
 *
 *   1. Loads the validated challenge and its immutable AI analysis
 *   2. Loads the full `universities` collection
 *   3. Builds a ChallengeInput from the AI analysis + challenge
 *   4. Runs the pure, deterministic matching engine
 *   5. Persists one immutable document per qualifying pair
 *   6. Advances the challenge `validated -> university_matching`
 *
 * If no university reaches the qualifying threshold, the challenge stays
 * `validated` and the reasons are returned for government inspection. A
 * fabricated match is never written, and the engine never touches Gemini.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'

import { db as firebaseDb, isFirebaseConfigured } from './firebase'
import {
  runMatchingEngine,
  persistMatches,
} from '@/features/matching'
import type { ChallengeInput, UniversityProfile } from '@/features/matching'
import type { Challenge } from '@/types/challenge'
import type { ChallengeAiAnalysis } from '@/types/ai'

export interface UniversityMatchingError {
  code: string
  message: string
}

export interface MatchingRunResult {
  status: 'matched' | 'no-match'
  matchCount: number
  reasons: string[]
}

function requireDb(): NonNullable<typeof firebaseDb> {
  if (!firebaseDb || !isFirebaseConfigured) {
    throw {
      code: 'firebase/not-configured',
      message: 'Firebase is not configured.',
    } satisfies UniversityMatchingError
  }
  return firebaseDb
}

/**
 * Builds the matching engine input from a challenge + its AI analysis.
 *
 * The AI analysis is authoritative for domains, tags, expertise and facility
 * requirements (it is immutable once written). When no analysis exists the
 * citizen-selected challenge fields are the fallback, so matching still works
 * even if Gemini was unavailable at submission time.
 */
export function buildChallengeInput(
  challenge: Challenge,
  analysis: ChallengeAiAnalysis | null,
): ChallengeInput {
  return {
    challengeId: challenge.id,
    primaryDomain: analysis?.primaryDomain ?? challenge.domain,
    secondaryDomain: analysis?.secondaryDomain ?? null,
    tags: Array.isArray(analysis?.tags) && (analysis?.tags.length ?? 0) > 0
      ? analysis!.tags
      : challenge.tags,
    requiredExpertise: analysis?.requiredExpertise ?? [],
    requiredFacilities: analysis?.requiredFacilities ?? [],
    location: { district: challenge.location.district },
  }
}

/**
 * Loads a challenge's immutable AI analysis document, or null.
 */
export async function getAnalysisForChallenge(
  challengeId: string,
): Promise<ChallengeAiAnalysis | null> {
  const db = requireDb()
  const snap = await getDoc(doc(db, 'challenge_ai_analysis', challengeId))
  if (!snap.exists()) return null
  const raw = snap.data()
  const createdAtValue: unknown = raw.createdAt
  const createdAt =
    typeof createdAtValue === 'number'
      ? createdAtValue
      : createdAtValue instanceof Timestamp
        ? createdAtValue.toMillis()
        : Date.now()
  return { ...(raw as ChallengeAiAnalysis), createdAt }
}

/**
 * Runs the university matching engine for a challenge and persists the
 * qualifying matches. Only runs from the `validated` state.
 *
 * On success the challenge advances `validated -> university_matching`.
 * On an empty match set the challenge remains `validated` and no match
 * documents are written.
 */
export async function runUniversityMatching(
  challengeId: string,
): Promise<MatchingRunResult> {
  const db = requireDb()

  const challengeSnap = await getDoc(doc(db, 'challenges', challengeId))
  if (!challengeSnap.exists()) {
    throw {
      code: 'not-found',
      message: 'Challenge not found.',
    } satisfies UniversityMatchingError
  }

  const raw = challengeSnap.data()
  const status = raw.status as Challenge['status']
  if (status !== 'validated') {
    throw {
      code: 'invalid-status',
      message: `Matching can only run on a validated challenge. Current status: "${status}".`,
    } satisfies UniversityMatchingError
  }

  const challenge: Challenge = {
    id: challengeSnap.id,
    citizenId: raw.citizenId,
    title: raw.title,
    description: raw.description,
    domain: raw.domain,
    tags: raw.tags ?? [],
    location: raw.location,
    evidence: raw.evidence ?? [],
    status,
    createdAt:
      raw.createdAt instanceof Timestamp
        ? raw.createdAt.toMillis()
        : typeof raw.createdAt === 'number'
          ? raw.createdAt
          : Date.now(),
    updatedAt:
      raw.updatedAt instanceof Timestamp
        ? raw.updatedAt.toMillis()
        : typeof raw.updatedAt === 'number'
          ? raw.updatedAt
          : Date.now(),
  }

  const analysis = await getAnalysisForChallenge(challengeId)

  const universitySnap = await getDocs(collection(db, 'universities'))
  const universities: UniversityProfile[] = universitySnap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as unknown as UniversityProfile)
    .filter((u) => typeof u.id === 'string' && u.id.length > 0)

  const input = buildChallengeInput(challenge, analysis)
  const result = runMatchingEngine(input, universities)

  if (result.status === 'no-match') {
    return { status: 'no-match', matchCount: 0, reasons: result.reasons }
  }

  const matches = result.matches.map(({ match }) => match)
  await persistMatches(matches)

  await updateDoc(doc(db, 'challenges', challengeId), {
    status: 'university_matching',
    updatedAt: serverTimestamp(),
  })

  return { status: 'matched', matchCount: matches.length, reasons: [] }
}