/**
 * University Acceptance Service — Module 07 Hardening
 *
 * Handles university acceptance of matched challenges.
 * This is the gate between University Matching and Team Formation.
 */

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore'

import { db as firebaseDb, isFirebaseConfigured } from './firebase'
import type { ChallengeMatch } from '@/features/matching/types'

export interface AcceptanceError {
  code: string
  message: string
}

export type UniversityMatch = ChallengeMatch & { accepted: boolean }

/** Lists only active Government assignments for the current university.
 * Qualifying routing matches are not invitations and must not be actionable.
 */
export async function getUniversityMatches(universityId: string): Promise<UniversityMatch[]> {
  const db = requireDb()
  // Firestore rules are not filters: constrain the first collection query to
  // the authenticated profile's canonical university before reading anything.
  // This also avoids touching non-assigned routing matches in the dashboard.
  const assignedChallenges = await getDocs(query(
    collection(db, 'challenges'),
    where('assignedUniversityId', '==', universityId),
  ))
  const activeChallengeIds = assignedChallenges.docs
    .filter((challenge) => ['university_assigned', 'team_formation'].includes(String(challenge.data().status)))
    .map((challenge) => challenge.id)

  const matches = await Promise.all(activeChallengeIds.map(async (challengeId) => {
    const snapshot = await getDoc(doc(db, 'challenge_matches', `${challengeId}_${universityId}`))
    if (!snapshot.exists()) return null
    const data = snapshot.data()
    if (data.universityId !== universityId || data.challengeId !== challengeId) return null
    return {
      challengeId,
      universityId,
      score: data.score,
      rank: data.rank,
      factors: data.factors,
      weightsSnapshot: data.weightsSnapshot,
      algorithmVersion: data.algorithmVersion,
      accepted: data.accepted === true,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
    } satisfies UniversityMatch
  }))
  return matches.filter((match): match is UniversityMatch => match !== null)
}

function requireDb(): NonNullable<typeof firebaseDb> {
  if (!firebaseDb || !isFirebaseConfigured) {
    throw {
      code: 'firebase/not-configured',
      message: 'Firebase is not configured.',
    } satisfies AcceptanceError
  }
  return firebaseDb
}

/**
 * Gets a match document by challenge and university ID.
 */
export async function getMatch(
  challengeId: string,
  universityId: string,
): Promise<ChallengeMatch | null> {
  const db = requireDb()
  const docId = `${challengeId}_${universityId}`
  const snapshot = await getDoc(doc(db, 'challenge_matches', docId))
  if (!snapshot.exists()) return null

  const data = snapshot.data()
  return {
    challengeId: data.challengeId,
    universityId: data.universityId,
    score: data.score,
    rank: data.rank,
    factors: data.factors,
    weightsSnapshot: data.weightsSnapshot,
    algorithmVersion: data.algorithmVersion,
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toMillis()
      : typeof data.createdAt === 'number'
        ? data.createdAt
        : Date.now(),
  }
}

/**
 * Gets all matches for a challenge.
 */
export async function getChallengeMatches(
  challengeId: string,
): Promise<ChallengeMatch[]> {
  const db = requireDb()
  const q = query(
    collection(db, 'challenge_matches'),
    where('challengeId', '==', challengeId),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => {
    const data = d.data()
    return {
      challengeId: data.challengeId,
      universityId: data.universityId,
      score: data.score,
      rank: data.rank,
      factors: data.factors,
      weightsSnapshot: data.weightsSnapshot,
      algorithmVersion: data.algorithmVersion,
      createdAt: data.createdAt instanceof Timestamp
        ? data.createdAt.toMillis()
        : typeof data.createdAt === 'number'
          ? data.createdAt
          : Date.now(),
    }
  })
}

/**
 * Accepts a university match.
 * 
 * Validates:
 * - Match exists
 * - University is authorized
 * - Match is not already accepted
 * 
 * After acceptance:
 * - Updates match document with accepted flag
 * - Updates challenge with assignedUniversityId
 * - Updates challenge status to team_formation
 */
export async function acceptMatch(params: {
  challengeId: string
  universityId: string
  universityAdminUid: string
}): Promise<void> {
  const db = requireDb()
  const { challengeId, universityId, universityAdminUid } = params

  // Verify the university admin belongs to this university
  const userDoc = await getDoc(doc(db, 'users', universityAdminUid))
  if (!userDoc.exists()) {
    throw {
      code: 'user-not-found',
      message: 'User not found.',
    } satisfies AcceptanceError
  }

  const userData = userDoc.data()
  if (userData.universityId !== universityId) {
    throw {
      code: 'unauthorized',
      message: 'You are not authorized to accept matches for this university.',
    } satisfies AcceptanceError
  }

  if (userData.role !== 'university_admin') {
    throw {
      code: 'unauthorized',
      message: 'Only university administrators can accept matches.',
    } satisfies AcceptanceError
  }

  // Get the match document
  const match = await getMatch(challengeId, universityId)
  if (!match) {
    throw {
      code: 'match-not-found',
      message: 'Match not found.',
    } satisfies AcceptanceError
  }

  // Get the match document to check accepted status
  const matchDocId = `${challengeId}_${universityId}`
  const matchDoc = await getDoc(doc(db, 'challenge_matches', matchDocId))
  if (!matchDoc.exists()) {
    throw {
      code: 'match-not-found',
      message: 'Match document not found.',
    } satisfies AcceptanceError
  }

  const matchData = matchDoc.data()
  if (matchData.accepted === true) {
    throw {
      code: 'already-accepted',
      message: 'This match has already been accepted.',
    } satisfies AcceptanceError
  }

  // Get the challenge to verify status
  const challengeDoc = await getDoc(doc(db, 'challenges', challengeId))
  if (!challengeDoc.exists()) {
    throw {
      code: 'challenge-not-found',
      message: 'Challenge not found.',
    } satisfies AcceptanceError
  }

  const challengeData = challengeDoc.data()
  const challengeStatus = challengeData.status as string

  // Only the university explicitly chosen by Government may accept.
  if (
    challengeStatus !== 'university_assigned' ||
    challengeData.assignedUniversityId !== universityId ||
    challengeData.assignmentStatus !== 'pending'
  ) {
    throw {
      code: 'challenge-not-eligible',
      message: `Challenge is in "${challengeStatus}" status and cannot be accepted.`,
    } satisfies AcceptanceError
  }

  // Update match document with accepted flag
  await updateDoc(doc(db, 'challenge_matches', matchDocId), {
    accepted: true,
    acceptedAt: serverTimestamp(),
    acceptedBy: universityAdminUid,
  })

  // Update challenge with assigned university and status
  await updateDoc(doc(db, 'challenges', challengeId), {
    status: 'team_formation',
    assignmentStatus: 'accepted',
    updatedAt: serverTimestamp(),
  })
}

/** Declines the current Government assignment without selecting a replacement. */
export async function declineAssignment(params: {
  challengeId: string
  universityId: string
  universityAdminUid: string
}): Promise<void> {
  const db = requireDb()
  const { challengeId, universityId, universityAdminUid } = params
  const userDoc = await getDoc(doc(db, 'users', universityAdminUid))
  if (!userDoc.exists() || userDoc.data().role !== 'university_admin' || userDoc.data().universityId !== universityId) {
    throw { code: 'unauthorized', message: 'Only the assigned university administrator can decline.' } satisfies AcceptanceError
  }
  const challengeRef = doc(db, 'challenges', challengeId)
  const challengeDoc = await getDoc(challengeRef)
  if (!challengeDoc.exists()) throw { code: 'challenge-not-found', message: 'Challenge not found.' } satisfies AcceptanceError
  const challenge = challengeDoc.data()
  if (challenge.status !== 'university_assigned' || challenge.assignedUniversityId !== universityId || challenge.assignmentStatus !== 'pending') {
    throw { code: 'challenge-not-eligible', message: 'This assignment is no longer awaiting your decision.' } satisfies AcceptanceError
  }
  await updateDoc(challengeRef, {
    status: 'validated',
    assignmentStatus: 'declined',
    updatedAt: serverTimestamp(),
  })
}

/**
 * Checks if a university has accepted a match for a challenge.
 */
export async function isMatchAccepted(
  challengeId: string,
  universityId: string,
): Promise<boolean> {
  const db = requireDb()
  const matchDocId = `${challengeId}_${universityId}`
  const snapshot = await getDoc(doc(db, 'challenge_matches', matchDocId))
  if (!snapshot.exists()) return false

  const data = snapshot.data()
  return data.accepted === true
}

/**
 * Gets acceptance status for a challenge at a university.
 */
export async function getAcceptanceStatus(
  challengeId: string,
  universityId: string,
): Promise<{
  exists: boolean
  accepted: boolean
  acceptedAt?: number
  acceptedBy?: string
}> {
  const db = requireDb()
  const matchDocId = `${challengeId}_${universityId}`
  const snapshot = await getDoc(doc(db, 'challenge_matches', matchDocId))
  if (!snapshot.exists()) {
    return { exists: false, accepted: false }
  }

  const data = snapshot.data()
  return {
    exists: true,
    accepted: data.accepted === true,
    acceptedAt: data.acceptedAt instanceof Timestamp
      ? data.acceptedAt.toMillis()
      : typeof data.acceptedAt === 'number'
        ? data.acceptedAt
        : undefined,
    acceptedBy: data.acceptedBy as string | undefined,
  }
}
