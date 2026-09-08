/**
 * Challenge Firestore service layer.
 *
 * Provides clean CRUD for the challenges collection.
 * Follows existing project conventions: uses the shared Firebase instance
 * from src/lib/firebase.ts, checks for null before use.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'

import { db as firebaseDb, isFirebaseConfigured } from './firebase'
import type { Challenge, ChallengeFormData, ChallengeStatus } from '@/types/challenge'
import type { Domain } from './taxonomy'

export interface ChallengeError {
  code: string
  message: string
}

/**
 * Normalizes the optional legacy Firestore evidence field to the Challenge
 * contract. New writes always include an array, but older/manual documents may
 * omit it. Non-string values are not evidence URLs and are ignored.
 */
export function normalizeChallengeEvidence(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : []
}

/** Safe display count for callers receiving a legacy Challenge shape. */
export function challengeEvidenceCount(challenge: Pick<Challenge, 'evidence'>): number {
  return Array.isArray(challenge.evidence) ? challenge.evidence.length : 0
}

/** Maps an untrusted Firestore challenge document into the application model. */
export function mapChallengeData(
  id: string,
  data: Record<string, unknown>,
): Challenge {
  return {
    id,
    citizenId: data['citizenId'] as string,
    title: data['title'] as string,
    description: data['description'] as string,
    domain: data['domain'] as Domain,
    tags: data['tags'] as string[],
    location: data['location'] as Challenge['location'],
    evidence: normalizeChallengeEvidence(data['evidence']),
    status: data['status'] as ChallengeStatus,
    assignedUniversityId: data['assignedUniversityId'] as string | undefined,
    assignedUniversityName: data['assignedUniversityName'] as string | undefined,
    assignedAt:
      data['assignedAt'] instanceof Timestamp
        ? data['assignedAt'].toMillis()
        : typeof data['assignedAt'] === 'number' ? data['assignedAt'] : undefined,
    assignedBy: data['assignedBy'] as string | undefined,
    assignmentStatus: data['assignmentStatus'] as Challenge['assignmentStatus'],
    matchingStatus: data['matchingStatus'] as Challenge['matchingStatus'],
    createdAt:
      data['createdAt'] instanceof Timestamp
        ? data['createdAt'].toMillis()
        : typeof data['createdAt'] === 'number'
          ? data['createdAt']
          : Date.now(),
    updatedAt:
      data['updatedAt'] instanceof Timestamp
        ? data['updatedAt'].toMillis()
        : typeof data['updatedAt'] === 'number'
          ? data['updatedAt']
          : Date.now(),
  }
}

function requireDb(): NonNullable<typeof firebaseDb> {
  if (!firebaseDb || !isFirebaseConfigured) {
    throw {
      code: 'firebase/not-configured',
      message: 'Firebase is not configured.',
    } satisfies ChallengeError
  }
  return firebaseDb
}

/**
 * Creates a new challenge document in Firestore.
 * Sets status to 'submitted' and uses server timestamps.
 * Returns the new challenge ID.
 */
export async function createChallenge(
  citizenId: string,
  data: ChallengeFormData,
): Promise<string> {
  const db = requireDb()
  const now = serverTimestamp()

  const docRef = await addDoc(collection(db, 'challenges'), {
    citizenId,
    title: data.title.trim(),
    description: data.description.trim(),
    domain: data.domain,
    tags: data.tags,
    location: { district: data.district },
    evidence: data.evidence,
    status: 'submitted' as ChallengeStatus,
    createdAt: now,
    updatedAt: now,
  })

  return docRef.id
}

/**
 * Fetches a single challenge by ID.
 * Returns null if the document does not exist.
 */
export async function getChallenge(
  challengeId: string,
): Promise<Challenge | null> {
  const db = requireDb()
  const snapshot = await getDoc(doc(db, 'challenges', challengeId))
  if (!snapshot.exists()) return null
  const data = snapshot.data()
  return mapChallengeData(snapshot.id, data)
}

/**
 * Fetches all challenges owned by a specific citizen.
 * Ordered by createdAt descending (newest first).
 */
export async function getCitizenChallenges(
  citizenId: string,
): Promise<Challenge[]> {
  const db = requireDb()
  const q = query(
    collection(db, 'challenges'),
    where('citizenId', '==', citizenId),
    orderBy('createdAt', 'desc'),
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => mapChallengeData(d.id, d.data()))
}
