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
  runTransaction,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'

import { db as firebaseDb, isFirebaseConfigured } from './firebase'
import {
  runMatchingEngine,
  persistMatches,
  scoreAndRank,
} from '@/features/matching'
import type { ChallengeInput, MatchFactors, UniversityProfile } from '@/features/matching'
import type { Challenge } from '@/types/challenge'
import type { ChallengeAiAnalysis } from '@/types/ai'
import { getAuth } from 'firebase/auth'
import { ALGORITHM_VERSION, DEFAULT_WEIGHTS } from '@/features/matching/config'
import { adaptUniversityCapabilitiesForScoring } from '@/features/matching/university-capability-adapter'

export interface UniversityMatchingError {
  code: string
  message: string
}

export interface MatchingRunResult {
  status: 'matched' | 'no-match'
  matchCount: number
  reasons: string[]
}

/** Government-only, non-persisted comparison of every verified profile. */
export interface UniversityCompatibility {
  university: Pick<UniversityProfile, 'id' | 'name' | 'district'>
  score: number
  rank: number
  factors: MatchFactors
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

async function loadMatchingContext(challengeId: string): Promise<{
  challenge: Challenge
  universities: UniversityProfile[]
}> {
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
    assignedUniversityId: raw.assignedUniversityId,
    assignedUniversityName: raw.assignedUniversityName,
    assignmentStatus: raw.assignmentStatus,
    matchingStatus: raw.matchingStatus,
    createdAt: raw.createdAt instanceof Timestamp ? raw.createdAt.toMillis() : typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
    updatedAt: raw.updatedAt instanceof Timestamp ? raw.updatedAt.toMillis() : typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now(),
  }
  const universitySnap = await getDocs(collection(db, 'universities'))
  const universities = universitySnap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as unknown as UniversityProfile)
    .filter((u) => typeof u.id === 'string' && u.id.length > 0)
  return { challenge, universities: adaptUniversityCapabilitiesForScoring(universities) }
}

/**
 * Scores every verified profile with the existing deterministic engine.
 * This deliberately does not persist below-threshold entries or expose them
 * outside the Government review view.
 */
export async function getUniversityCompatibility(
  challengeId: string,
): Promise<UniversityCompatibility[]> {
  const { challenge, universities } = await loadMatchingContext(challengeId)
  const analysis = await getAnalysisForChallenge(challengeId)
  return scoreAndRank(buildChallengeInput(challenge, analysis), universities).map((entry) => ({
    university: {
      id: entry.university.id,
      name: entry.university.name,
      district: entry.university.district,
    },
    score: entry.score,
    rank: entry.rank,
    factors: entry.factors,
  }))
}

/**
 * Runs the university matching engine for a challenge and persists the
 * qualifying matches. Only runs from the `validated` state.
 *
 * Matching is a government-controlled process, not a lifecycle state. It
 * persists only meaningful routing matches and records completion separately.
 */
export async function runUniversityMatching(
  challengeId: string,
): Promise<MatchingRunResult> {
  const db = requireDb()

  const { challenge, universities } = await loadMatchingContext(challengeId)
  const status = challenge.status
  if (status !== 'validated') {
    throw {
      code: 'invalid-status',
      message: `Matching can only run on a validated challenge. Current status: "${status}".`,
    } satisfies UniversityMatchingError
  }

  const analysis = await getAnalysisForChallenge(challengeId)

  const input = buildChallengeInput(challenge, analysis)
  const result = runMatchingEngine(input, universities)

  if (result.status === 'no-match') {
    await updateDoc(doc(db, 'challenges', challengeId), {
      matchingStatus: 'completed',
      updatedAt: serverTimestamp(),
    })
    return { status: 'no-match', matchCount: 0, reasons: result.reasons }
  }

  const matches = result.matches.map(({ match }) => match)
  await persistMatches(matches)

  await updateDoc(doc(db, 'challenges', challengeId), {
    matchingStatus: 'completed',
    updatedAt: serverTimestamp(),
  })

  return { status: 'matched', matchCount: matches.length, reasons: [] }
}

/**
 * Explicitly assigns an evaluated university. Compatibility informs this
 * decision but never authorizes or blocks it. A below-threshold university
 * receives an immutable match record with its actual deterministic score so
 * its own admin can accept or decline without seeing other institutions.
 */
export async function assignUniversity(params: {
  challengeId: string
  compatibility: UniversityCompatibility
  assignedBy: string
}): Promise<void> {
  const db = requireDb()
  const { challengeId, compatibility, assignedBy } = params
  const authUid = getAuth().currentUser?.uid
  if (!authUid || authUid !== assignedBy) {
    throw { code: 'unauthorized', message: 'Only the signed-in Government reviewer can assign a university.' } satisfies UniversityMatchingError
  }

  const challengeRef = doc(db, 'challenges', challengeId)
  const matchRef = doc(db, 'challenge_matches', `${challengeId}_${compatibility.university.id}`)
  const reviewRef = doc(collection(db, 'challenge_reviews'))

  await runTransaction(db, async (transaction) => {
    const challengeSnap = await transaction.get(challengeRef)
    if (!challengeSnap.exists()) throw { code: 'not-found', message: 'Challenge not found.' } satisfies UniversityMatchingError
    const data = challengeSnap.data()
    const status = data.status as Challenge['status']
    if (status !== 'validated') {
      throw { code: 'invalid-status', message: 'Only a validated, unassigned challenge can be assigned.' } satisfies UniversityMatchingError
    }
    if (data.assignmentStatus === 'pending') {
      throw { code: 'assignment-pending', message: 'This challenge already has an assignment awaiting a university response.' } satisfies UniversityMatchingError
    }

    const matchSnap = await transaction.get(matchRef)
    if (!matchSnap.exists()) {
      transaction.set(matchRef, {
        challengeId,
        universityId: compatibility.university.id,
        score: compatibility.score,
        rank: compatibility.rank,
        factors: compatibility.factors,
        weightsSnapshot: DEFAULT_WEIGHTS,
        algorithmVersion: ALGORITHM_VERSION,
        createdAt: Date.now(),
      })
    }
    transaction.update(challengeRef, {
      assignedUniversityId: compatibility.university.id,
      assignedUniversityName: compatibility.university.name,
      assignedAt: serverTimestamp(),
      assignedBy,
      assignmentStatus: 'pending',
      status: 'university_assigned',
      updatedAt: serverTimestamp(),
    })
    transaction.set(reviewRef, {
      challengeId,
      action: 'university_assigned',
      content: `Assigned to ${compatibility.university.name} (${compatibility.score.toFixed(1)} / 100).`,
      createdAt: serverTimestamp(),
    })
  })
}
