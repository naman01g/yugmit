/**
 * Proposal input validation — Module 08
 *
 * Pure validation of the team-authored proposal content fields
 * (and the submission gate). Kept separate from the Firestore service so it
 * can be unit-tested without Firebase.
 */

import {
  isProposalContentComplete,
  type ProposalContent,
  type ProposalStatus,
} from '@/types/proposal'

export interface FieldError {
  field: keyof ProposalContent
  message: string
}

export const PROPOSAL_FIELD_LIMITS: { field: string; max: number }[] = [
  { field: 'title', max: 200 },
  { field: 'solutionDescription', max: 4000 },
  { field: 'implementationPlan', max: 4000 },
  { field: 'estimatedCost', max: 1000 },
  { field: 'timeline', max: 1000 },
  { field: 'expectedImpact', max: 2000 },
]

export function fieldLimit(field: keyof ProposalContent): number {
  const entry = PROPOSAL_FIELD_LIMITS.find((f) => f.field === field)
  return entry ? entry.max : Infinity
}

export interface ValidateProposalResult {
  valid: boolean
  errors: FieldError[]
}

function validateField(
  value: string,
  field: keyof ProposalContent,
  label: string,
): FieldError | null {
  const max = fieldLimit(field)
  if (value.trim().length === 0) {
    return { field, message: `${label} is required.` }
  }
  if (value.length > max) {
    return {
      field,
      message: `${label} must be ${max} characters or fewer.`,
    }
  }
  return null
}

/**
 * Validates a proposal draft. Returns per-field errors.
 * Does not validate identity/team references (handled by the service gates).
 */
export function validateProposalContent(
  content: ProposalContent,
): ValidateProposalResult {
  const errors: FieldError[] = []

  const titleErr = validateField(content.title, 'title', 'Proposal title')
  if (titleErr) errors.push(titleErr)

  const descErr = validateField(
    content.solutionDescription,
    'solutionDescription',
    'Solution description',
  )
  if (descErr) errors.push(descErr)

  const planErr = validateField(
    content.implementationPlan,
    'implementationPlan',
    'Implementation plan',
  )
  if (planErr) errors.push(planErr)

  const costErr = validateField(content.estimatedCost, 'estimatedCost', 'Estimated cost')
  if (costErr) errors.push(costErr)

  const timelineErr = validateField(content.timeline, 'timeline', 'Timeline')
  if (timelineErr) errors.push(timelineErr)

  const impactErr = validateField(content.expectedImpact, 'expectedImpact', 'Expected impact')
  if (impactErr) errors.push(impactErr)

  return { valid: errors.length === 0, errors }
}

/**
 * Validates that a proposal can be submitted. Requires complete content and a
 * draft status.
 */
export function validateProposalSubmission(
  content: ProposalContent,
  status: ProposalStatus,
): { valid: boolean; reason?: string } {
  if (status !== 'draft') {
    return { valid: false, reason: 'Only a draft proposal can be submitted.' }
  }
  if (!isProposalContentComplete(content)) {
    return { valid: false, reason: 'All proposal fields must be completed before submission.' }
  }
  return { valid: true }
}

/**
 * Builds a proposal document id deterministically from the team id.
 * A team owns at most one proposal, so this id prevents duplicates.
 */
export function proposalDocumentId(teamId: string): string {
  return teamId
}

/**
 * Pure authorization evaluation for proposal authoring.
 *
 * This mirrors the gate enforced in the proposal service and Firestore rules.
 * Returns the team's authorization decision and a reason. Kept pure so the
 * Module 08 security boundaries can be unit-tested without Firebase.
 */
export interface ProposalGateInput {
  team: {
    status: string
    challengeId: string
    universityId: string
    facultyLeadId: string
    memberIds: string[]
  } | null
  challenge: {
    assignedUniversityId?: string | null
  } | null
  request: {
    teamId: string
    challengeId: string
    universityId: string
    uid: string
  }
}

export interface ProposalGateResult {
  allowed: boolean
  reason: string | null
}

/**
 * Verifies:
 *  1. team exists and is active
 *  2. user is faculty lead or an accepted member
 *  3. team belongs to the given challenge
 *  4. team's university matches the challenge's assigned university
 */
export function evaluateProposalAuthorization(
  input: ProposalGateInput,
): ProposalGateResult {
  const { team, challenge, request } = input

  if (!team) {
    return { allowed: false, reason: 'team-not-found' }
  }
  if (team.status !== 'active') {
    return { allowed: false, reason: 'team-not-active' }
  }
  if (team.challengeId !== request.challengeId) {
    return { allowed: false, reason: 'challenge-mismatch' }
  }
  if (team.universityId !== request.universityId) {
    return { allowed: false, reason: 'university-mismatch' }
  }
  if (!challenge) {
    return { allowed: false, reason: 'challenge-not-found' }
  }
  if (challenge.assignedUniversityId !== request.universityId) {
    return { allowed: false, reason: 'university-not-assigned' }
  }
  const isAuthor =
    request.uid === team.facultyLeadId || team.memberIds.includes(request.uid)
  if (!isAuthor) {
    return { allowed: false, reason: 'not-authorized' }
  }

  return { allowed: true, reason: null }
}
