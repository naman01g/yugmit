/**
 * Government challenge review service layer.
 *
 * Provides read/write for government review operations:
 * - Fetch challenges for review queue
 * - Update challenge status (validate, reject, return-for-correction, merge, link)
 * - Add review comments
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  updateDoc,
  addDoc,
} from 'firebase/firestore'

import { db as firebaseDb, isFirebaseConfigured } from './firebase'
import type { Challenge, ChallengeStatus } from '@/types/challenge'
import type { Domain } from './taxonomy'

export interface GovernmentReviewError {
  code: string
  message: string
}

function requireDb(): NonNullable<typeof firebaseDb> {
  if (!firebaseDb || !isFirebaseConfigured) {
    throw {
      code: 'firebase/not-configured',
      message: 'Firebase is not configured.',
    } satisfies GovernmentReviewError
  }
  return firebaseDb
}

/**
 * Valid status transitions for government review.
 */
export const VALID_GOVERNMENT_TRANSITIONS: Record<ChallengeStatus, ChallengeStatus[]> = {
  submitted: ['under_review', 'rejected'],
  under_review: ['validated', 'rejected', 'merged', 'submitted'],
  validated: [],
  university_matching: [],
  team_formation: [],
  proposal: [],
  rejected: [],
  merged: [],
}

/**
 * Review filter options for the queue.
 */
export interface ReviewFilters {
  status?: ChallengeStatus
  domain?: Domain
  district?: string
  urgency?: 'low' | 'medium' | 'high'
  minConfidence?: number
}

/**
 * Moves a newly submitted challenge into government review.
 * Explicit `submitted -> under_review` transition (PRODUCT.md state machine).
 * A challenge cannot be validated directly from `submitted`.
 */
export async function startReview(
  challengeId: string,
  comment?: string,
): Promise<void> {
  const db = requireDb()
  const challengeRef = doc(db, 'challenges', challengeId)

  const challengeDoc = await getDoc(challengeRef)
  if (!challengeDoc.exists()) {
    throw { code: 'not-found', message: 'Challenge not found.' }
  }

  const currentStatus = challengeDoc.data().status as ChallengeStatus
  if (!VALID_GOVERNMENT_TRANSITIONS[currentStatus].includes('under_review')) {
    throw {
      code: 'invalid-transition',
      message: `Cannot move a challenge in "${currentStatus}" status to under review.`,
    }
  }

  await updateDoc(challengeRef, {
    status: 'under_review',
    updatedAt: serverTimestamp(),
  })

  if (comment) {
    await addReviewComment(challengeId, 'under_review', comment)
  }
}

/**
 * Fetches challenges for government review queue.
 * Applies optional filters and orders by createdAt descending.
 */
export async function getReviewChallenges(
  filters?: ReviewFilters,
): Promise<Challenge[]> {
  const db = requireDb()

  let q = query(
    collection(db, 'challenges'),
    orderBy('createdAt', 'desc'),
    limit(100),
  )

  // Apply status filter
  if (filters?.status) {
    q = query(
      collection(db, 'challenges'),
      where('status', '==', filters.status),
      orderBy('createdAt', 'desc'),
      limit(100),
    )
  }

  const snapshot = await getDocs(q)
  let challenges = snapshot.docs.map((d) => {
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

  // Apply client-side filters for fields that may not be in Firestore index
  if (filters?.domain) {
    challenges = challenges.filter((c) => c.domain === filters.domain)
  }
  if (filters?.district) {
    challenges = challenges.filter((c) => c.location.district === filters.district)
  }

  return challenges
}

/**
 * Gets challenge with AI analysis data for review.
 */
export async function getChallengeForReview(
  challengeId: string,
): Promise<{ challenge: Challenge | null; aiAnalysis: Record<string, unknown> | null }> {
  const db = requireDb()

  const challengeDoc = await getDoc(doc(db, 'challenges', challengeId))
  if (!challengeDoc.exists()) {
    return { challenge: null, aiAnalysis: null }
  }

  const data = challengeDoc.data()
  const challenge: Challenge = {
    id: challengeDoc.id,
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

  // Fetch AI analysis if available
  let aiAnalysis: Record<string, unknown> | null = null
  try {
    const analysisDoc = await getDoc(doc(db, 'challenge_ai_analysis', challengeId))
    if (analysisDoc.exists()) {
      aiAnalysis = analysisDoc.data() as Record<string, unknown>
    }
  } catch {
    // AI analysis not available
  }

  return { challenge, aiAnalysis }
}

/**
 * Validates a challenge (sets status to validated).
 */
export async function validateChallenge(
  challengeId: string,
  comment?: string,
): Promise<void> {
  const db = requireDb()
  const challengeRef = doc(db, 'challenges', challengeId)

  // Get current challenge to verify status
  const challengeDoc = await getDoc(challengeRef)
  if (!challengeDoc.exists()) {
    throw { code: 'not-found', message: 'Challenge not found.' }
  }

  const currentStatus = challengeDoc.data().status as ChallengeStatus
  if (!VALID_GOVERNMENT_TRANSITIONS[currentStatus].includes('validated')) {
    throw {
      code: 'invalid-transition',
      message: `Cannot validate a challenge in "${currentStatus}" status.`,
    }
  }

  await updateDoc(challengeRef, {
    status: 'validated',
    updatedAt: serverTimestamp(),
  })

  // Add audit comment
  if (comment) {
    await addReviewComment(challengeId, 'validated', comment)
  }
}

/**
 * Rejects a challenge (sets status to rejected).
 */
export async function rejectChallenge(
  challengeId: string,
  reason: string,
): Promise<void> {
  if (!reason.trim()) {
    throw { code: 'validation-error', message: 'Rejection reason is required.' }
  }

  const db = requireDb()
  const challengeRef = doc(db, 'challenges', challengeId)

  const challengeDoc = await getDoc(challengeRef)
  if (!challengeDoc.exists()) {
    throw { code: 'not-found', message: 'Challenge not found.' }
  }

  const currentStatus = challengeDoc.data().status as ChallengeStatus
  if (!VALID_GOVERNMENT_TRANSITIONS[currentStatus].includes('rejected')) {
    throw {
      code: 'invalid-transition',
      message: `Cannot reject a challenge in "${currentStatus}" status.`,
    }
  }

  await updateDoc(challengeRef, {
    status: 'rejected',
    updatedAt: serverTimestamp(),
  })

  await addReviewComment(challengeId, 'rejected', reason)
}

/**
 * Returns a challenge for correction (sets status back to submitted).
 */
export async function returnForCorrection(
  challengeId: string,
  feedback: string,
): Promise<void> {
  if (!feedback.trim()) {
    throw { code: 'validation-error', message: 'Feedback is required for correction.' }
  }

  const db = requireDb()
  const challengeRef = doc(db, 'challenges', challengeId)

  const challengeDoc = await getDoc(challengeRef)
  if (!challengeDoc.exists()) {
    throw { code: 'not-found', message: 'Challenge not found.' }
  }

  const currentStatus = challengeDoc.data().status as ChallengeStatus
  if (!VALID_GOVERNMENT_TRANSITIONS[currentStatus].includes('submitted')) {
    throw {
      code: 'invalid-transition',
      message: `Cannot return a challenge in "${currentStatus}" status for correction.`,
    }
  }

  await updateDoc(challengeRef, {
    status: 'submitted',
    updatedAt: serverTimestamp(),
  })

  await addReviewComment(challengeId, 'returned', feedback)
}

/**
 * Merges a challenge as duplicate (sets status to merged).
 */
export async function mergeChallenge(
  challengeId: string,
  targetChallengeId: string,
  reason: string,
): Promise<void> {
  if (!reason.trim()) {
    throw { code: 'validation-error', message: 'Merge reason is required.' }
  }

  const db = requireDb()
  const challengeRef = doc(db, 'challenges', challengeId)

  const challengeDoc = await getDoc(challengeRef)
  if (!challengeDoc.exists()) {
    throw { code: 'not-found', message: 'Challenge not found.' }
  }

  const currentStatus = challengeDoc.data().status as ChallengeStatus
  if (!VALID_GOVERNMENT_TRANSITIONS[currentStatus].includes('merged')) {
    throw {
      code: 'invalid-transition',
      message: `Cannot merge a challenge in "${currentStatus}" status.`,
    }
  }

  // Verify target challenge exists
  const targetDoc = await getDoc(doc(db, 'challenges', targetChallengeId))
  if (!targetDoc.exists()) {
    throw { code: 'not-found', message: 'Target challenge not found.' }
  }

  await updateDoc(challengeRef, {
    status: 'merged',
    updatedAt: serverTimestamp(),
  })

  await addReviewComment(
    challengeId,
    'merged',
    `Merged as duplicate of ${targetChallengeId}. ${reason}`,
  )
}

/**
 * Links a related challenge (does not change status, adds metadata).
 */
export async function linkRelatedChallenge(
  challengeId: string,
  relatedChallengeId: string,
  note: string,
): Promise<void> {
  if (!note.trim()) {
    throw { code: 'validation-error', message: 'Note is required for linking.' }
  }

  const db = requireDb()
  const challengeRef = doc(db, 'challenges', challengeId)

  const challengeDoc = await getDoc(challengeRef)
  if (!challengeDoc.exists()) {
    throw { code: 'not-found', message: 'Challenge not found.' }
  }

  // Verify related challenge exists
  const relatedDoc = await getDoc(doc(db, 'challenges', relatedChallengeId))
  if (!relatedDoc.exists()) {
    throw { code: 'not-found', message: 'Related challenge not found.' }
  }

  // Add link comment (no status change)
  await addReviewComment(
    challengeId,
    'linked',
    `Linked to related challenge ${relatedChallengeId}. ${note}`,
  )
}

/**
 * Adds a review comment to a challenge.
 */
async function addReviewComment(
  challengeId: string,
  action: string,
  content: string,
): Promise<void> {
  const db = requireDb()
  await addDoc(collection(db, 'challenge_reviews'), {
    challengeId,
    action,
    content,
    createdAt: serverTimestamp(),
  })
}

/**
 * Gets review history for a challenge.
 */
export async function getReviewHistory(
  challengeId: string,
): Promise<{ action: string; content: string; createdAt: number }[]> {
  const db = requireDb()

  const q = query(
    collection(db, 'challenge_reviews'),
    where('challengeId', '==', challengeId),
    orderBy('createdAt', 'desc'),
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => {
    const data = d.data()
    return {
      action: data.action as string,
      content: data.content as string,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toMillis()
          : typeof data.createdAt === 'number'
            ? data.createdAt
            : Date.now(),
    }
  })
}

/**
 * Gets review statistics for the dashboard.
 */
export async function getReviewStats(): Promise<{
  submitted: number
  underReview: number
  validated: number
  rejected: number
  total: number
}> {
  const db = requireDb()

  const allChallenges = await getDocs(collection(db, 'challenges'))
  const counts = {
    submitted: 0,
    underReview: 0,
    validated: 0,
    rejected: 0,
    total: 0,
  }

  allChallenges.docs.forEach((d) => {
    const status = d.data().status as ChallengeStatus
    counts.total++
    if (status === 'submitted') counts.submitted++
    else if (status === 'under_review') counts.underReview++
    else if (status === 'validated') counts.validated++
    else if (status === 'rejected') counts.rejected++
  })

  return counts
}
