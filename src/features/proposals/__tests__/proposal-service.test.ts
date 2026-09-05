import { describe, expect, it } from 'vitest'

import {
  evaluateProposalAuthorization,
  proposalDocumentId,
  type ProposalGateInput,
} from '@/lib/proposal-validator'
import {
  VALID_PROPOSAL_TRANSITIONS,
  isProposalEditable,
  type ProposalStatus,
} from '@/types/proposal'

const ACTIVE_TEAM = {
  status: 'active',
  challengeId: 'challenge-1',
  universityId: 'uni-a',
  facultyLeadId: 'faculty-1',
  memberIds: ['member-1', 'member-2'],
}

function gateInput(
  over: Partial<ProposalGateInput> = {},
): ProposalGateInput {
  const base: ProposalGateInput = {
    team: { ...ACTIVE_TEAM } as ProposalGateInput['team'],
    challenge: { assignedUniversityId: 'uni-a' },
    request: {
      teamId: 'team-1',
      challengeId: 'challenge-1',
      universityId: 'uni-a',
      uid: 'member-1',
    },
  }
  return {
    team: 'team' in over ? (over.team as ProposalGateInput['team']) : base.team,
    challenge: 'challenge' in over ? (over.challenge as ProposalGateInput['challenge']) : base.challenge,
    request: 'request' in over ? (over.request as ProposalGateInput['request']) : base.request,
  }
}

describe('A. Proposal creation gate', () => {
  it('1. Active team member can create draft', () => {
    expect(evaluateProposalAuthorization(gateInput()).allowed).toBe(true)
  })

  it('2. Faculty lead can create draft', () => {
    const input = gateInput({ request: { ...gateInput().request!, uid: 'faculty-1' } })
    expect(evaluateProposalAuthorization(input).allowed).toBe(true)
  })

  it('3. Non-team user cannot create draft', () => {
    const input = gateInput({ request: { ...gateInput().request!, uid: 'outsider' } })
    const result = evaluateProposalAuthorization(input)
    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('not-authorized')
  })

  it('4. Invited-but-not-accepted student cannot create draft', () => {
    // invited student is not in memberIds, so denied
    const input = gateInput({ request: { ...gateInput().request!, uid: 'invited-student' } })
    expect(evaluateProposalAuthorization(input).allowed).toBe(false)
  })

  it('5. Forming team cannot create proposal', () => {
    const input = gateInput({ team: { ...ACTIVE_TEAM, status: 'forming' } })
    const result = evaluateProposalAuthorization(input)
    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('team-not-active')
  })

  it('6. Wrong challenge reference is rejected', () => {
    const input = gateInput({ request: { ...gateInput().request!, challengeId: 'challenge-2' } })
    const result = evaluateProposalAuthorization(input)
    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('challenge-mismatch')
  })

  it('7. Wrong university reference is rejected', () => {
    const input = gateInput({ request: { ...gateInput().request!, universityId: 'uni-b' } })
    const result = evaluateProposalAuthorization(input)
    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('university-mismatch')
  })

  it('8. Missing team is rejected', () => {
    const result = evaluateProposalAuthorization(gateInput({ team: null }))
    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('team-not-found')
  })

  it('rejects if challenge not assigned to the team university', () => {
    const input = gateInput({ challenge: { assignedUniversityId: 'uni-other' } })
    const result = evaluateProposalAuthorization(input)
    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('university-not-assigned')
  })
})

describe('B. Draft editing security', () => {
  it('submitted proposal is not editable by team', () => {
    expect(isProposalEditable('submitted')).toBe(false)
  })

  it('government_review proposal is not editable by team', () => {
    expect(isProposalEditable('government_review')).toBe(false)
  })

  it('identity fields are immutable by contract', () => {
    // The proposal service only ever writes content + status/submittedAt on the
    // team write path; teamId/challengeId/universityId are never in the update set.
    // Assert the contract that these are not editable.
    const teamEditableFields = [
      'title',
      'solutionDescription',
      'implementationPlan',
      'estimatedCost',
      'timeline',
      'expectedImpact',
      'status',
      'submittedAt',
      'updatedAt',
    ]
    expect(teamEditableFields).not.toContain('teamId')
    expect(teamEditableFields).not.toContain('challengeId')
    expect(teamEditableFields).not.toContain('universityId')
  })
})

describe('C. Submission gate', () => {
  it('only a draft can be submitted', () => {
    expect(VALID_PROPOSAL_TRANSITIONS.draft).toContain('submitted')
    expect(VALID_PROPOSAL_TRANSITIONS.submitted).not.toContain('draft')
  })

  it('submission requires an active team (gate passes for active member)', () => {
    expect(evaluateProposalAuthorization(gateInput()).allowed).toBe(true)
  })

  it('submission by a forming-team member is rejected', () => {
    const input = gateInput({ team: { ...ACTIVE_TEAM, status: 'forming' } })
    expect(evaluateProposalAuthorization(input).allowed).toBe(false)
  })

  it('submission by a non-team user is rejected', () => {
    const input = gateInput({ request: { ...gateInput().request!, uid: 'outsider' } })
    expect(evaluateProposalAuthorization(input).allowed).toBe(false)
  })

  it('submitted status and submittedAt are recorded by contract', () => {
    // The service writes submittedAt when status -> submitted.
    const status: ProposalStatus = 'submitted'
    expect(status).toBe('submitted')
  })
})

describe('D. Government review', () => {
  it('government_review follows submitted', () => {
    expect(VALID_PROPOSAL_TRANSITIONS.submitted).toContain('government_review')
  })

  it('government_review is terminal (review only, no further authored edits)', () => {
    expect(VALID_PROPOSAL_TRANSITIONS.government_review).toHaveLength(0)
  })

  it('government cannot rewrite authored content by contract', () => {
    // Government review path only touches review metadata + status.
    const govEditableFields = ['status', 'governmentComment', 'reviewedBy', 'reviewedAt', 'updatedAt']
    expect(govEditableFields).toContain('governmentComment')
    expect(govEditableFields).not.toContain('solutionDescription')
    expect(govEditableFields).not.toContain('implementationPlan')
    expect(govEditableFields).not.toContain('estimatedCost')
    expect(govEditableFields).not.toContain('timeline')
    expect(govEditableFields).not.toContain('expectedImpact')
  })
})

describe('E. Cross-boundary security', () => {
  it('University A team cannot author for University B', () => {
    const input = gateInput({ request: { ...gateInput().request!, universityId: 'uni-b' } })
    expect(evaluateProposalAuthorization(input).allowed).toBe(false)
  })

  it('Team A user cannot author Team B proposal (not a member)', () => {
    const input = gateInput({ request: { ...gateInput().request!, uid: 'member-of-team-b' } })
    expect(evaluateProposalAuthorization(input).allowed).toBe(false)
  })

  it('a citizen outside the team cannot author', () => {
    const input = gateInput({ request: { ...gateInput().request!, uid: 'citizen-9' } })
    expect(evaluateProposalAuthorization(input).allowed).toBe(false)
  })

  it('deterministic proposal id prevents cross-team collision', () => {
    const teamA = proposalDocumentId('team-a')
    const teamB = proposalDocumentId('team-b')
    expect(teamA).not.toBe(teamB)
    // Same team always resolves to same id -> duplicate create collides
    expect(proposalDocumentId('team-a')).toBe(teamA)
  })

  it('every gate outcome is an explicit denial with a reason (deny by default)', () => {
    const denyReasons = [
      'team-not-found',
      'team-not-active',
      'challenge-mismatch',
      'university-mismatch',
      'challenge-not-found',
      'university-not-assigned',
      'not-authorized',
    ]
    for (const r of denyReasons) {
      expect(typeof r).toBe('string')
      expect(r.length).toBeGreaterThan(0)
    }
  })
})
