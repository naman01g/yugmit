/**
 * Solution Proposal types — Module 08
 *
 * Proposal model per ARCHITECTURE.md `proposals/{proposalId}`.
 *
 * The proposal is scoped to a (team, challenge, university) triple and the
 * document id is deterministic (= the team id) so a team can have at most one
 * proposal with no client-side duplicate race.
 */

export type ProposalStatus = 'draft' | 'submitted' | 'government_review'

export interface Proposal {
  id: string
  teamId: string
  challengeId: string
  universityId: string

  title: string
  solutionDescription: string
  implementationPlan: string
  estimatedCost: string
  timeline: string
  expectedImpact: string

  status: ProposalStatus

  createdAt: number
  updatedAt: number
  submittedAt?: number

  // Government review metadata — kept separate from authored content.
  governmentComment?: string
  reviewedAt?: number
  reviewedBy?: string
}

/**
 * Writable, team-authored content fields.
 * Identity + review fields are excluded from team editing.
 */
export type ProposalContent = Pick<
  Proposal,
  | 'title'
  | 'solutionDescription'
  | 'implementationPlan'
  | 'estimatedCost'
  | 'timeline'
  | 'expectedImpact'
>

/**
 * A proposal is considered complete (submittable) when all content fields are
 * non-empty. Expected impact is qualitative intent, never measured outcome.
 */
export function isProposalContentComplete(content: ProposalContent): boolean {
  return (
    content.title.trim().length > 0 &&
    content.solutionDescription.trim().length > 0 &&
    content.implementationPlan.trim().length > 0 &&
    content.estimatedCost.trim().length > 0 &&
    content.timeline.trim().length > 0 &&
    content.expectedImpact.trim().length > 0
  )
}

/**
 * Whether a proposal in the given status can be edited by its team.
 */
export function isProposalEditable(status: ProposalStatus): boolean {
  return status === 'draft'
}

export const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  government_review: 'Under Government Review',
}

export const VALID_PROPOSAL_TRANSITIONS: Record<
  ProposalStatus,
  ProposalStatus[]
> = {
  draft: ['submitted'],
  submitted: ['government_review'],
  government_review: [],
}
