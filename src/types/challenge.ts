import type { Domain } from '@/lib/taxonomy'

/**
 * Challenge status lifecycle (PRODUCT.md state machine).
 * Citizen-facing statuses shown in the lifecycle timeline.
 */
export type ChallengeStatus =
  | 'submitted'
  | 'under_review'
  | 'rejected'
  | 'merged'
  | 'validated'
  | 'university_matching'
  | 'team_formation'
  | 'proposal'

/**
 * Ordered lifecycle steps for the timeline display.
 * Citizens see all steps; future/pending steps are visually distinct.
 */
export const LIFECYCLE_STEPS: {
  status: ChallengeStatus
  label: string
}[] = [
  { status: 'submitted', label: 'Submitted' },
  { status: 'under_review', label: 'Under Review' },
  { status: 'validated', label: 'Validated' },
  { status: 'university_matching', label: 'University Matching' },
  { status: 'team_formation', label: 'Team Formation' },
  { status: 'proposal', label: 'Proposal' },
]

/**
 * Jharkhand district location structure.
 * ARCHITECTURE.md: location: { district: string, lat?: number, lng?: number }
 */
export interface ChallengeLocation {
  district: string
  lat?: number
  lng?: number
}

/**
 * Firestore challenge document — challenges/{challengeId}.
 * Follows ARCHITECTURE.md schema with citizen-selected domain and tags
 * added per MODULE 03 requirements.
 */
export interface Challenge {
  id: string
  citizenId: string
  title: string
  description: string
  domain: Domain
  tags: string[]
  location: ChallengeLocation
  evidence: string[]
  status: ChallengeStatus
  assignedUniversityId?: string
  createdAt: number
  updatedAt: number
}

/**
 * Writable fields a citizen may provide when creating a challenge.
 * citizenId, status, createdAt, updatedAt, and assignedUniversityId
 * are server-controlled or set by the service layer.
 */
export interface ChallengeFormData {
  title: string
  description: string
  domain: Domain
  tags: string[]
  district: string
  evidence: string[]
}
