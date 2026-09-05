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
  return {
    id: snapshot.id,
    citizenId: data.citizenId,
    title: data.title,
    description: data.description,
    domain: data.domain as Domain,
    tags: data.tags as string[],
    location: data.location,
    evidence: data.evidence as string[],
    status: data.status as ChallengeStatus,
    assignedUniversityId: data.assignedUniversityId as string | undefined,
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toMillis()
        : typeof data.createdAt === 'number'
          ? data.createdAt
          : Date.now(),
    updatedAt:
      data.updatedAt instanceof Timestamp
        ? data.updatedAt.toMillis()
        : typeof data.updatedAt === 'number'
          ? data.updatedAt
          : Date.now(),
  }
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
  return snapshot.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      citizenId: data.citizenId,
      title: data.title,
      description: data.description,
      domain: data.domain as Domain,
      tags: data.tags as string[],
      location: data.location,
      evidence: data.evidence as string[],
      status: data.status as ChallengeStatus,
      assignedUniversityId: data.assignedUniversityId as string | undefined,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toMillis()
          : typeof data.createdAt === 'number'
            ? data.createdAt
            : Date.now(),
      updatedAt:
        data.updatedAt instanceof Timestamp
          ? data.updatedAt.toMillis()
          : typeof data.updatedAt === 'number'
            ? data.updatedAt
            : Date.now(),
    }
  })
}
