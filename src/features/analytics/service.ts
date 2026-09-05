/**
 * Government Analytics Firestore service — Module 09
 *
 * Fetches authoritative Firestore records and derives the analytics model.
 * Government-role gated. Client-side aggregation is acceptable for the V1
 * dataset under the ₹0 architecture (no Cloud Functions / backend).
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore'

import { db as firebaseDb, isFirebaseConfigured } from '@/lib/firebase'
import type { ChallengeStatus } from '@/types/challenge'
import { aggregateAnalytics, type AggregateInput, type ChallengeRecord } from './aggregate'
import { GOVERNMENT_VISIBLE_PROPOSAL_STATUSES } from './security-contract'
import type { AnalyticsData } from './types'
import type { ProposalStatus } from '@/types/proposal'
import type { TeamStatus } from '@/types/team'

export interface AnalyticsServiceError {
  code: string
  message: string
}

function requireDb(): NonNullable<typeof firebaseDb> {
  if (!firebaseDb || !isFirebaseConfigured) {
    throw {
      code: 'firebase/not-configured',
      message: 'Firebase is not configured.',
    } satisfies AnalyticsServiceError
  }
  return firebaseDb
}

function ms(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis()
  if (typeof value === 'number') return value
  return Number.isFinite(value as number) ? (value as number) : 0
}

async function assertGovernment(uid: string): Promise<void> {
  const db = requireDb()
  const userSnap = await getDoc(doc(db, 'users', uid))
  if (!userSnap.exists()) {
    throw { code: 'not-authorized', message: 'User not found.' } satisfies AnalyticsServiceError
  }
  if (userSnap.data().role !== 'government') {
    throw {
      code: 'not-authorized',
      message: 'Only government users may access government analytics.',
    } satisfies AnalyticsServiceError
  }
}

/**
 * Returns the full analytics model derived from real Firestore records.
 * Throws for non-government callers.
 */
export async function getAnalytics(
  uid: string,
): Promise<AnalyticsData> {
  const db = requireDb()
  await assertGovernment(uid)

  const challengesSnap = await getDocs(collection(db, 'challenges'))
  const challengeRecords: ChallengeRecord[] = challengesSnap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      status: (data.status as ChallengeStatus) ?? 'submitted',
      domain: (data.domain as string) ?? 'unknown',
      district: (data.location?.district as string) ?? 'unknown',
      createdAt: ms(data.createdAt),
      updatedAt: ms(data.updatedAt),
      assignedUniversityId: data.assignedUniversityId as string | undefined,
    }
  })

  // Government may read only submitted / government_review proposals
  // (drafts are private to the owning team). Query is scoped to those statuses
  // so the bulk read satisfies Firestore security rules.
  const proposalsSnap = await getDocs(
    query(
      collection(db, 'proposals'),
      where('status', 'in', GOVERNMENT_VISIBLE_PROPOSAL_STATUSES),
    ),
  )
  const proposalRecords = proposalsSnap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      status: (data.status as ProposalStatus) ?? 'draft',
      universityId: (data.universityId as string) ?? '',
      createdAt: ms(data.createdAt),
      updatedAt: ms(data.updatedAt),
      submittedAt: data.submittedAt ? ms(data.submittedAt) : undefined,
    }
  })

  const teamsSnap = await getDocs(collection(db, 'teams'))
  const teamRecords = teamsSnap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      status: (data.status as TeamStatus) ?? 'forming',
      universityId: (data.universityId as string) ?? '',
      challengeId: (data.challengeId as string) ?? '',
    }
  })

  const matchesSnap = await getDocs(collection(db, 'challenge_matches'))
  const matchRecords = matchesSnap.docs.map((d) => {
    const data = d.data()
    return {
      challengeId: (data.challengeId as string) ?? '',
      universityId: (data.universityId as string) ?? '',
      accepted: data.accepted === true,
    }
  })

  const universitiesSnap = await getDocs(collection(db, 'universities'))
  const universityNames = universitiesSnap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      name: (data.name as string) ?? d.id,
    }
  })

  const reviewsSnap = await getDocs(collection(db, 'challenge_reviews'))
  const reviewRecords = reviewsSnap.docs.map((d) => {
    const data = d.data()
    return {
      challengeId: (data.challengeId as string) ?? '',
      action: (data.action as string) ?? '',
      createdAt: ms(data.createdAt),
    }
  })

  const input: AggregateInput = {
    challenges: challengeRecords,
    proposals: proposalRecords,
    teams: teamRecords,
    matches: matchRecords,
    universities: universityNames,
    reviews: reviewRecords,
  }

  return aggregateAnalytics(input)
}
