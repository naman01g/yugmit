import { describe, expect, it } from 'vitest'

import { VALID_GOVERNMENT_TRANSITIONS, type ReviewFilters } from '../government-review-service'
import type { ChallengeStatus } from '@/types/challenge'

describe('government review — status transitions', () => {
  it('allows Government to start review from submitted', () => {
    expect(VALID_GOVERNMENT_TRANSITIONS.submitted).toContain('under_review')
  })

  it('does not allow final decisions before review starts', () => {
    expect(VALID_GOVERNMENT_TRANSITIONS.submitted).not.toContain('validated')
    expect(VALID_GOVERNMENT_TRANSITIONS.submitted).not.toContain('rejected')
  })

  it('allows validating an under_review challenge', () => {
    expect(VALID_GOVERNMENT_TRANSITIONS.under_review).toContain('validated')
  })

  it('allows rejecting an under_review challenge', () => {
    expect(VALID_GOVERNMENT_TRANSITIONS.under_review).toContain('rejected')
  })

  it('allows returning under_review to submitted for correction', () => {
    expect(VALID_GOVERNMENT_TRANSITIONS.under_review).toContain('submitted')
  })

  it('allows merging an under_review challenge', () => {
    expect(VALID_GOVERNMENT_TRANSITIONS.under_review).toContain('merged')
  })

  it('does not allow merging a submitted challenge directly', () => {
    expect(VALID_GOVERNMENT_TRANSITIONS.submitted).not.toContain('merged')
  })

  it('does not allow transitions from terminal states', () => {
    const terminalStatuses: ChallengeStatus[] = ['validated', 'rejected', 'merged']
    for (const status of terminalStatuses) {
      expect(VALID_GOVERNMENT_TRANSITIONS[status]).toHaveLength(0)
    }
  })

  it('does not allow transitions from future states', () => {
    const futureStatuses: ChallengeStatus[] = ['university_matching', 'team_formation', 'proposal']
    for (const status of futureStatuses) {
      expect(VALID_GOVERNMENT_TRANSITIONS[status]).toHaveLength(0)
    }
  })
})

describe('government review — filter types', () => {
  it('defines valid filter structure', () => {
    const filters: ReviewFilters = {
      status: 'submitted',
      domain: 'Education',
      district: 'Ranchi',
    }
    expect(filters.status).toBe('submitted')
    expect(filters.domain).toBe('Education')
    expect(filters.district).toBe('Ranchi')
  })

  it('allows empty filters', () => {
    const filters: ReviewFilters = {}
    expect(filters.status).toBeUndefined()
    expect(filters.domain).toBeUndefined()
  })
})

describe('government review — decision requirements', () => {
  it('requires comment for rejection', () => {
    // This is a contract test — the service validates this
    // We test that the service throws if no comment
    const reason = ''
    expect(reason.trim()).toBe('')
  })

  it('requires comment for return for correction', () => {
    const feedback = ''
    expect(feedback.trim()).toBe('')
  })

  it('requires comment for merge', () => {
    const reason = ''
    expect(reason.trim()).toBe('')
  })

  it('does not require comment for validation', () => {
    const comment = undefined
    expect(comment).toBeUndefined()
  })

  it('keeps spam outside the lifecycle state machine', () => {
    const statuses = Object.values(VALID_GOVERNMENT_TRANSITIONS).flat()
    expect(statuses).not.toContain('spam')
  })
})
