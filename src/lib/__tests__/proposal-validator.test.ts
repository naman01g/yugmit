import { describe, expect, it } from 'vitest'

import {
  validateProposalContent,
  validateProposalSubmission,
  proposalDocumentId,
  fieldLimit,
  PROPOSAL_FIELD_LIMITS,
  type FieldError,
} from '@/lib/proposal-validator'
import {
  isProposalContentComplete,
  isProposalEditable,
  VALID_PROPOSAL_TRANSITIONS,
  type ProposalContent,
  type ProposalStatus,
} from '@/types/proposal'

const COMPLETE: ProposalContent = {
  title: 'Rural Drinking Water Monitoring',
  solutionDescription: 'A sensor-based monitoring system',
  implementationPlan: 'Install sensors, build dashboard',
  estimatedCost: 'INR 12 lakh over 12 months',
  timeline: '12 months',
  expectedImpact: 'Improve water quality visibility',
}

function validContent(over: Partial<ProposalContent> = {}): ProposalContent {
  return { ...COMPLETE, ...over }
}

describe('proposal validator — completed content', () => {
  it('validates a complete proposal', () => {
    const result = validateProposalContent(validContent())
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects missing title', () => {
    const result = validateProposalContent(validContent({ title: '   ' }))
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.field === 'title')).toBe(true)
  })

  it('rejects missing solution description', () => {
    const result = validateProposalContent(validContent({ solutionDescription: '' }))
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.field === 'solutionDescription')).toBe(true)
  })

  it('rejects missing implementation plan', () => {
    const result = validateProposalContent(validContent({ implementationPlan: '' }))
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.field === 'implementationPlan')).toBe(true)
  })

  it('rejects missing estimated cost', () => {
    const result = validateProposalContent(validContent({ estimatedCost: '' }))
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.field === 'estimatedCost')).toBe(true)
  })

  it('rejects missing timeline', () => {
    const result = validateProposalContent(validContent({ timeline: '' }))
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.field === 'timeline')).toBe(true)
  })

  it('rejects missing expected impact', () => {
    const result = validateProposalContent(validContent({ expectedImpact: '' }))
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.field === 'expectedImpact')).toBe(true)
  })
})

describe('proposal validator — character limits', () => {
  it('rejects a title longer than its limit', () => {
    const result = validateProposalContent(
      validContent({ title: 'x'.repeat(fieldLimit('title') + 1) }),
    )
    expect(result.valid).toBe(false)
  })

  it('accepts a title at its exact limit', () => {
    const result = validateProposalContent(
      validContent({ title: 'x'.repeat(fieldLimit('title')) }),
    )
    expect(result.valid).toBe(true)
  })

  it('returns a field error for oversized fields', () => {
    const result = validateProposalContent(
      validContent({ estimatedCost: 'y'.repeat(fieldLimit('estimatedCost') + 1) }),
    )
    const err: FieldError | undefined = result.errors.find(
      (e) => e.field === 'estimatedCost',
    )
    expect(err).toBeDefined()
    expect(err?.message).toContain('characters or fewer')
  })

  it('defines a per-field limit for every editable field', () => {
    const fields: (keyof ProposalContent)[] = [
      'title',
      'solutionDescription',
      'implementationPlan',
      'estimatedCost',
      'timeline',
      'expectedImpact',
    ]
    for (const f of fields) {
      expect(fieldLimit(f)).toBeGreaterThan(0)
    }
    expect(PROPOSAL_FIELD_LIMITS.length).toBe(fields.length)
  })
})

describe('proposal submission validation', () => {
  it('allows submitting a complete draft', () => {
    const result = validateProposalSubmission(COMPLETE, 'draft')
    expect(result.valid).toBe(true)
  })

  it('rejects submitting an incomplete draft', () => {
    const result = validateProposalSubmission(
      validContent({ timeline: '' }),
      'draft',
    )
    expect(result.valid).toBe(false)
    expect(result.reason).toBeTruthy()
  })

  it('rejects submitting a non-draft proposal', () => {
    const result = validateProposalSubmission(COMPLETE, 'submitted')
    expect(result.valid).toBe(false)
  })

  it('rejects submitting a government_review proposal', () => {
    const result = validateProposalSubmission(COMPLETE, 'government_review')
    expect(result.valid).toBe(false)
  })
})

describe('proposal document id', () => {
  it('is deterministic per team (equals team id)', () => {
    expect(proposalDocumentId('team-x')).toBe('team-x')
    expect(proposalDocumentId('team-x')).toBe(proposalDocumentId('team-x'))
  })

  it('differs across teams — preventing cross-team collision', () => {
    expect(proposalDocumentId('team-a')).not.toBe(proposalDocumentId('team-b'))
  })
})

describe('proposal lifecycle transitions', () => {
  it('draft can transition to submitted', () => {
    expect(VALID_PROPOSAL_TRANSITIONS.draft).toContain('submitted')
  })

  it('submitted can transition to government_review', () => {
    expect(VALID_PROPOSAL_TRANSITIONS.submitted).toContain('government_review')
  })

  it('government_review is terminal', () => {
    expect(VALID_PROPOSAL_TRANSITIONS.government_review).toHaveLength(0)
  })

  it('draft cannot jump directly to government_review', () => {
    expect(VALID_PROPOSAL_TRANSITIONS.draft).not.toContain('government_review')
  })

  it('submitted cannot go back to draft', () => {
    expect(VALID_PROPOSAL_TRANSITIONS.submitted).not.toContain('draft')
  })

  it('all statuses are covered', () => {
    const statuses: ProposalStatus[] = ['draft', 'submitted', 'government_review']
    for (const s of statuses) {
      expect(VALID_PROPOSAL_TRANSITIONS[s]).toBeDefined()
    }
  })
})

describe('proposal editability', () => {
  it('draft is editable', () => {
    expect(isProposalEditable('draft')).toBe(true)
  })

  it('submitted is not editable by team', () => {
    expect(isProposalEditable('submitted')).toBe(false)
  })

  it('government_review is not editable by team', () => {
    expect(isProposalEditable('government_review')).toBe(false)
  })
})

describe('isProposalContentComplete', () => {
  it('returns true when all fields non-empty', () => {
    expect(isProposalContentComplete(COMPLETE)).toBe(true)
  })

  it('returns false when any field is empty', () => {
    expect(isProposalContentComplete(validContent({ title: '' }))).toBe(false)
    expect(isProposalContentComplete(validContent({ expectedImpact: ' ' }))).toBe(false)
  })
})
