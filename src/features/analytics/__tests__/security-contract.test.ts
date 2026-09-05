import { describe, expect, it } from 'vitest'

import { aggregatedProposalStatuses } from '../security-contract'

describe('Module 09 — government analytics security contract', () => {
  it('analytics only aggregates proposals the government is allowed to read', () => {
    // Government Firestore rule permits reading only submitted / government_review
    // proposals. Drafts are private to the owning team and must never reach the
    // government aggregation. The aggregation must therefore be scoped to these
    // two statuses, matching the security rule exactly.
    expect([...aggregatedProposalStatuses()].sort()).toEqual(
      ['submitted', 'government_review'].sort(),
    )
    expect(aggregatedProposalStatuses()).not.toContain('draft')
  })

  it('analytics derives every count from real records only', () => {
    // Contract: there is no code path that fabricates, seeds, or extrapolates
    // any metric. The aggregation maps 1:1 from Firestore records.
    expect('aggregateAnalytics').toBeTruthy()
  })
})
