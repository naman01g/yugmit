/**
 * Government Analytics types — Module 09
 *
 * The analytics model is derived entirely from real authoritative Firestore
 * records. No metric is ever fabricated, seeded, or extrapolated.
 */

import type { ChallengeStatus } from '@/types/challenge'

export interface StatusCount {
  status: ChallengeStatus
  label: string
  count: number
}

export interface KeyValueCount {
  key: string
  count: number
}

export interface PipelineStageCount {
  stage: ChallengeStatus
  label: string
  count: number
}

/**
 * University engagement aggregates. `accepted` is derived from the
 * challenge_matches accepted flag; `activeTeams` from active teams;
 * `proposals` from proposals scoped to that university.
 */
export interface UniversityEngagement {
  universityId: string
  name: string
  assignedChallenges: number
  acceptedChallenges: number
  activeTeams: number
  proposals: number
}

export interface AnalyticsData {
  // Overview counts from real challenge statuses
  totalChallenges: number
  byStatus: StatusCount[]
  byDomain: KeyValueCount[]
  byDistrict: KeyValueCount[]

  // Pipeline
  pipeline: PipelineStageCount[]

  // Proposals
  totalProposals: number
  submittedProposals: number
  proposalsUnderReview: number

  // University engagement
  universities: UniversityEngagement[]

  // Review time (only when real timestamps support it)
  avgReviewHours: number | null
  reviewedCount: number
}

export const PIPELINE_STAGES: ChallengeStatus[] = [
  'submitted',
  'under_review',
  'validated',
  'university_matching',
  'team_formation',
  'proposal',
]

export const PIPELINE_LABELS: Record<ChallengeStatus, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  validated: 'Validated',
  university_matching: 'University Matching',
  team_formation: 'Team Formation',
  proposal: 'Proposal',
  rejected: 'Rejected',
  merged: 'Merged',
}
