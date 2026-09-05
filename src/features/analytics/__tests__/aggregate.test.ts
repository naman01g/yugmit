import { describe, expect, it } from 'vitest'

import {
  aggregateAnalytics,
  statusLabel,
  type AggregateInput,
  type ChallengeRecord,
  type ProposalRecord,
  type TeamRecord,
  type MatchRecord,
  type ReviewRecord,
} from '@/features/analytics/aggregate'

const empty: AggregateInput = {
  challenges: [],
  proposals: [],
  teams: [],
  matches: [],
  universities: [],
  reviews: [],
  now: 1_000_000,
}

function challenge(overrides: Partial<ChallengeRecord> = {}): ChallengeRecord {
  return {
    id: 'c1',
    status: 'submitted',
    domain: 'Agriculture',
    district: 'Ranchi',
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  }
}

describe('Module 09 — analytics aggregation invariants', () => {
  it('empty dataset yields honest zero counts, never fabricated metrics', () => {
    const data = aggregateAnalytics(empty)
    expect(data.totalChallenges).toBe(0)
    expect(data.byStatus).toHaveLength(8)
    expect(data.byStatus.every((s) => s.count === 0)).toBe(true)
    expect(data.byDomain).toEqual([])
    expect(data.byDistrict).toEqual([])
    expect(data.totalProposals).toBe(0)
    expect(data.submittedProposals).toBe(0)
    expect(data.proposalsUnderReview).toBe(0)
    expect(data.universities).toEqual([])
    expect(data.avgReviewHours).toBeNull()
    expect(data.reviewedCount).toBe(0)
  })

  it('sums challenge counts to exactly the total', () => {
    const challenges: ChallengeRecord[] = [
      challenge({ id: 'a', status: 'submitted' }),
      challenge({ id: 'b', status: 'under_review' }),
      challenge({ id: 'c', status: 'validated' }),
      challenge({ id: 'd', status: 'rejected' }),
    ]
    const data = aggregateAnalytics({ ...empty, challenges })
    expect(data.totalChallenges).toBe(4)
    const byStatusTotal = data.byStatus.reduce((a, s) => a + s.count, 0)
    expect(byStatusTotal).toBe(4)
    expect(data.byStatus.find((s) => s.status === 'submitted')?.count).toBe(1)
    expect(data.byStatus.find((s) => s.status === 'under_review')?.count).toBe(1)
    expect(data.byStatus.find((s) => s.status === 'validated')?.count).toBe(1)
    expect(data.byStatus.find((s) => s.status === 'rejected')?.count).toBe(1)
  })

  it('derives pipeline counts from the real statuses in order', () => {
    const challenges: ChallengeRecord[] = [
      challenge({ id: 'a', status: 'submitted' }),
      challenge({ id: 'b', status: 'under_review' }),
      challenge({ id: 'c', status: 'validated' }),
      challenge({ id: 'd', status: 'university_matching' }),
      challenge({ id: 'e', status: 'team_formation' }),
      challenge({ id: 'f', status: 'proposal' }),
    ]
    const data = aggregateAnalytics({ ...empty, challenges })
    expect(data.pipeline.map((p) => p.stage)).toEqual([
      'submitted',
      'under_review',
      'validated',
      'university_matching',
      'team_formation',
      'proposal',
    ])
    expect(data.pipeline.every((p) => p.count === 1)).toBe(true)
  })

  it('aggregates challenges by domain and district from real values', () => {
    const challenges: ChallengeRecord[] = [
      challenge({ id: 'a', domain: 'Agriculture', district: 'Ranchi' }),
      challenge({ id: 'b', domain: 'Agriculture', district: 'Ranchi' }),
      challenge({ id: 'c', domain: 'Education', district: 'Dhanbad' }),
    ]
    const data = aggregateAnalytics({ ...empty, challenges })
    expect(data.byDomain).toEqual([
      { key: 'Agriculture', count: 2 },
      { key: 'Education', count: 1 },
    ])
    expect(data.byDistrict).toEqual([
      { key: 'Ranchi', count: 2 },
      { key: 'Dhanbad', count: 1 },
    ])
  })

  it('counts proposals by status from real records', () => {
    const proposals: ProposalRecord[] = [
      { id: 'p1', status: 'submitted', universityId: 'u1', createdAt: 1, updatedAt: 1 },
      { id: 'p2', status: 'submitted', universityId: 'u1', createdAt: 1, updatedAt: 1 },
      { id: 'p3', status: 'government_review', universityId: 'u2', createdAt: 1, updatedAt: 1 },
    ]
    const data = aggregateAnalytics({ ...empty, proposals })
    expect(data.totalProposals).toBe(3)
    expect(data.submittedProposals).toBe(2)
    expect(data.proposalsUnderReview).toBe(1)
  })

  it('no proposal data produces zero proposal counts, not nulls', () => {
    const data = aggregateAnalytics(empty)
    expect(data.totalProposals).toBe(0)
    expect(data.submittedProposals).toBe(0)
    expect(data.proposalsUnderReview).toBe(0)
  })

  it('averages review hours only from real validated timestamps', () => {
    const baseMs = 10_000_000
    const challenges: ChallengeRecord[] = [
      challenge({ id: 'a', status: 'validated', createdAt: baseMs }),
      challenge({ id: 'b', status: 'validated', createdAt: baseMs }),
    ]
    const reviews: ReviewRecord[] = [
      { challengeId: 'a', action: 'validated', createdAt: baseMs + 2 * 3600000 }, // +2h
      { challengeId: 'b', action: 'validated', createdAt: baseMs + 6 * 3600000 }, // +6h
    ]
    const data = aggregateAnalytics({ ...empty, challenges, reviews })
    expect(data.reviewedCount).toBe(2)
    expect(data.avgReviewHours).toBe(4) // (2+6)/2 = 4h
  })

  it('returns null review time when no validated review exists (honest empty)', () => {
    const challenges: ChallengeRecord[] = [challenge({ id: 'a', status: 'validated' })]
    const data = aggregateAnalytics({ ...empty, challenges, reviews: [] })
    expect(data.avgReviewHours).toBeNull()
    expect(data.reviewedCount).toBe(0)
  })

  it('ignores review records whose action is not validated', () => {
    const challenges: ChallengeRecord[] = [challenge({ id: 'a', status: 'validated' })]
    const reviews: ReviewRecord[] = [
      { challengeId: 'a', action: 'rejected', createdAt: 5000 },
    ]
    const data = aggregateAnalytics({ ...empty, challenges, reviews })
    expect(data.reviewedCount).toBe(0)
    expect(data.avgReviewHours).toBeNull()
  })

  it('uses the EARLIEST validated review timestamp per challenge', () => {
    // challenge().createdAt defaults to 1000; place it hours earlier explicitly.
    const baseMs = 1_000_000
    const challenges: ChallengeRecord[] = [
      challenge({ id: 'a', status: 'validated', createdAt: baseMs }),
    ]
    const reviews: ReviewRecord[] = [
      { challengeId: 'a', action: 'validated', createdAt: baseMs + 5 * 3600000 }, // +5h
      { challengeId: 'a', action: 'validated', createdAt: baseMs + 2 * 3600000 }, // +2h earlier
      { challengeId: 'a', action: 'rejected', createdAt: baseMs + 1000 },
    ]
    const data = aggregateAnalytics({ ...empty, challenges, reviews })
    expect(data.reviewedCount).toBe(1)
    expect(data.avgReviewHours).toBe(2) // earliest validated wins, hours
  })

  it('builds university engagement from real relation counts', () => {
    const challenges: ChallengeRecord[] = [
      challenge({ id: 'a', assignedUniversityId: 'u1' }),
      challenge({ id: 'b', assignedUniversityId: 'u1' }),
      challenge({ id: 'c', assignedUniversityId: 'u2' }),
    ]
    const matches: MatchRecord[] = [
      { challengeId: 'a', universityId: 'u1', accepted: true },
      { challengeId: 'b', universityId: 'u1', accepted: false },
      { challengeId: 'c', universityId: 'u2', accepted: true },
    ]
    const teams: TeamRecord[] = [
      { id: 't1', status: 'active', universityId: 'u1', challengeId: 'a' },
      { id: 't2', status: 'forming', universityId: 'u1', challengeId: 'c' },
    ]
    const proposals: ProposalRecord[] = [
      { id: 'p1', status: 'submitted', universityId: 'u1', createdAt: 1, updatedAt: 1 },
    ]
    const universities = [
      { id: 'u1', name: 'Ranchi University' },
      { id: 'u2', name: 'Dhanbad Tech' },
    ]
    const data = aggregateAnalytics({ ...empty, challenges, matches, teams, proposals, universities })

    const u1 = data.universities.find((u) => u.universityId === 'u1')
    const u2 = data.universities.find((u) => u.universityId === 'u2')
    expect(u1).toBeDefined()
    expect(u1?.name).toBe('Ranchi University')
    expect(u1?.assignedChallenges).toBe(2)
    expect(u1?.acceptedChallenges).toBe(1) // only accepted:true counted
    expect(u1?.activeTeams).toBe(1) // only active status
    expect(u1?.proposals).toBe(1)
    expect(u2?.assignedChallenges).toBe(1)
    expect(u2?.activeTeams).toBe(0) // 'forming' is not active
  })

  it('no relationships produce zero university engagement, not null/undefined', () => {
    const data = aggregateAnalytics(empty)
    expect(data.universities).toEqual([])
  })

  it('maps every challenge status to a human label', () => {
    const statuses = [
      'submitted',
      'under_review',
      'validated',
      'university_matching',
      'team_formation',
      'proposal',
      'rejected',
      'merged',
    ] as const
    for (const s of statuses) {
      expect(statusLabel(s).length).toBeGreaterThan(0)
    }
  })
})
