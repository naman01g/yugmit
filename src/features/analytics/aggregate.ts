/**
 * Pure analytics aggregation — Module 09
 *
 * Turns raw authoritative Firestore records into the government analytics model.
 * All logic is pure and unit-testable. No fake data is ever introduced: every
 * metric is counted from the provided records, and empty inputs produce zeroes.
 */

import type { ChallengeStatus } from '@/types/challenge'
import type { Proposal } from '@/types/proposal'
import type { Team } from '@/types/team'
import {
  PIPELINE_STAGES,
  type AnalyticsData,
  type StatusCount,
  type KeyValueCount,
  type UniversityEngagement,
  type PipelineStageCount,
} from './types'

export interface ChallengeRecord {
  id: string
  status: ChallengeStatus
  domain: string
  district: string
  createdAt: number
  updatedAt: number
  assignedUniversityId?: string
}

export interface ProposalRecord {
  id: string
  status: Proposal['status']
  universityId: string
  createdAt: number
  updatedAt: number
  submittedAt?: number
}

export interface TeamRecord {
  id: string
  status: Team['status']
  universityId: string
  challengeId: string
}

export interface MatchRecord {
  challengeId: string
  universityId: string
  accepted: boolean
}

export interface UniversityName {
  id: string
  name: string
}

export interface ReviewRecord {
  challengeId: string
  action: string
  createdAt: number
}

export interface AggregateInput {
  challenges: ChallengeRecord[]
  proposals: ProposalRecord[]
  teams: TeamRecord[]
  matches: MatchRecord[]
  universities: UniversityName[]
  reviews: ReviewRecord[]
  now?: number
}

const ALL_STATUSES: ChallengeStatus[] = [
  'submitted',
  'under_review',
  'rejected',
  'merged',
  'validated',
  'university_matching',
  'team_formation',
  'proposal',
]

function countByStatus(challenges: ChallengeRecord[]): StatusCount[] {
  const counts: Record<string, number> = {}
  for (const c of challenges) {
    counts[c.status] = (counts[c.status] ?? 0) + 1
  }
  return ALL_STATUSES.map((status) => ({
    status,
    label: status,
    count: counts[status] ?? 0,
  }))
}

function countByKey(items: { key: string }[]): KeyValueCount[] {
  const counts: Record<string, number> = {}
  for (const it of items) {
    counts[it.key] = (counts[it.key] ?? 0) + 1
  }
  return Object.entries(counts)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
}

function countByDomain(challenges: ChallengeRecord[]): KeyValueCount[] {
  return countByKey(challenges.map((c) => ({ key: c.domain })))
}

function countByDistrict(challenges: ChallengeRecord[]): KeyValueCount[] {
  return countByKey(challenges.map((c) => ({ key: c.district })))
}

function buildPipeline(challenges: ChallengeRecord[]): PipelineStageCount[] {
  const countFor = (status: ChallengeStatus) =>
    challenges.filter((c) => c.status === status).length
  return PIPELINE_STAGES.map((stage) => ({
    stage,
    label: stage,
    count: countFor(stage),
  }))
}

/**
 * Computes average review time (approved) as hours, using the earliest
 * 'validated' review comment timestamp per challenge minus the challenge's
 * createdAt. Only challenges with both timestamps count. Returns null when
 * there is not enough real data.
 */
function computeAvgReviewHours(
  challenges: ChallengeRecord[],
  reviews: ReviewRecord[],
  now: number,
): { avgReviewHours: number | null; reviewedCount: number } {
  // Map challengeId -> earliest validated review timestamp
  const validatedAtByChallenge: Record<string, number> = {}
  for (const r of reviews) {
    if (r.action !== 'validated') continue
    const existing = validatedAtByChallenge[r.challengeId]
    if (existing === undefined || r.createdAt < existing) {
      validatedAtByChallenge[r.challengeId] = r.createdAt
    }
  }

  const durations: number[] = []
  for (const c of challenges) {
    const validatedAt = validatedAtByChallenge[c.id]
    if (validatedAt === undefined) continue
    if (c.createdAt <= 0 || validatedAt < c.createdAt) continue
    durations.push((validatedAt - c.createdAt) / (1000 * 60 * 60))
  }

  if (durations.length === 0) {
    return { avgReviewHours: null, reviewedCount: 0 }
  }

  const sum = durations.reduce((a, b) => a + b, 0)
  const avg = sum / durations.length
  return {
    avgReviewHours: Math.round(avg * 10) / 10,
    reviewedCount: durations.length,
  }
  void now
}

/**
 * Aggregates university engagement from real challenges (assigned),
 * accepted matches, active teams, and proposals.
 */
function buildUniversityEngagement(
  challenges: ChallengeRecord[],
  matches: MatchRecord[],
  teams: TeamRecord[],
  proposals: ProposalRecord[],
  universities: UniversityName[],
): UniversityEngagement[] {
  const nameById: Record<string, string> = {}
  for (const u of universities) {
    nameById[u.id] = u.name || u.id
  }

  // Gather the set of university ids referenced anywhere
  const uniIds = new Set<string>()
  for (const u of universities) uniIds.add(u.id)
  for (const c of challenges) if (c.assignedUniversityId) uniIds.add(c.assignedUniversityId)
  for (const m of matches) uniIds.add(m.universityId)
  for (const t of teams) uniIds.add(t.universityId)
  for (const p of proposals) uniIds.add(p.universityId)

  const engagement: UniversityEngagement[] = []
  for (const uniId of uniIds) {
    engagement.push({
      universityId: uniId,
      name: nameById[uniId] || uniId,
      assignedChallenges: challenges.filter(
        (c) => c.assignedUniversityId === uniId,
      ).length,
      acceptedChallenges: matches.filter(
        (m) => m.universityId === uniId && m.accepted === true,
      ).length,
      activeTeams: teams.filter(
        (t) => t.universityId === uniId && t.status === 'active',
      ).length,
      proposals: proposals.filter((p) => p.universityId === uniId).length,
    })
  }

  return engagement.sort(
    (a, b) =>
      b.assignedChallenges - a.assignedChallenges ||
      (a.proposals + a.activeTeams) - (b.proposals + b.activeTeams) ||
      a.name.localeCompare(b.name),
  )
}

export function aggregateAnalytics(input: AggregateInput): AnalyticsData {
  const now = input.now ?? Date.now()

  const totalChallenges = input.challenges.length

  const proposals = input.proposals
  const totalProposals = proposals.length
  const submittedProposals = proposals.filter((p) => p.status === 'submitted').length
  const proposalsUnderReview = proposals.filter(
    (p) => p.status === 'government_review',
  ).length

  const { avgReviewHours, reviewedCount } = computeAvgReviewHours(
    input.challenges,
    input.reviews,
    now,
  )

  return {
    totalChallenges,
    byStatus: countByStatus(input.challenges),
    byDomain: countByDomain(input.challenges),
    byDistrict: countByDistrict(input.challenges),
    pipeline: buildPipeline(input.challenges),
    totalProposals,
    submittedProposals,
    proposalsUnderReview,
    universities: buildUniversityEngagement(
      input.challenges,
      input.matches,
      input.teams,
      input.proposals,
      input.universities,
    ),
    avgReviewHours,
    reviewedCount,
  }
}

/**
 * Convenience: map a status to a human label in the aggregation output.
 */
export function statusLabel(status: ChallengeStatus): string {
  const labels: Record<ChallengeStatus, string> = {
    submitted: 'Submitted',
    under_review: 'Under Review',
    rejected: 'Rejected',
    merged: 'Merged',
    validated: 'Validated',
    university_assigned: 'University Assigned',
    university_matching: 'University Matching',
    team_formation: 'Team Formation',
    proposal: 'Proposal',
  }
  return labels[status] ?? status
}
