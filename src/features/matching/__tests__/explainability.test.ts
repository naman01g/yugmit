import { describe, it, expect } from 'vitest'

import { buildExplanation } from '../explanations'
import { computeFactors } from '../score'
import {
  makeChallenge,
  waterUniversity,
  agricultureUniversity,
} from './fixtures'

describe('buildExplanation', () => {
  it('claims only capabilities present in the university profile', () => {
    const challenge = makeChallenge({
      primaryDomain: 'Water Management',
      secondaryDomain: null,
      tags: ['Water Quality'],
      requiredFacilities: ['Water Testing Lab'],
    })
    const factors = computeFactors(challenge, waterUniversity)
    const explanation = buildExplanation(challenge, waterUniversity, factors)

    expect(explanation.reasons.some((r) => r.includes('strong Water Management expertise'))).toBe(true)
    expect(
      explanation.reasons.some((r) =>
        r.includes('water testing lab facilities available'),
      ),
    ).toBe(true)
  })

  it('does NOT claim expertise absent from a profile', () => {
    const challenge = makeChallenge({
      primaryDomain: 'Water Management',
      secondaryDomain: null,
      tags: ['Water Quality'],
    })
    const factors = computeFactors(challenge, agricultureUniversity)
    const explanation = buildExplanation(challenge, agricultureUniversity, factors)

    const claimedStrong = explanation.reasons.some((r) =>
      r.includes('strong Water Management expertise'),
    )
    expect(claimedStrong).toBe(false)
    // It should explicitly say the domain expertise did not match.
    expect(
      explanation.reasons.some((r) => r.includes('no matching domain expertise')),
    ).toBe(true)
  })

  it('explains location based on the actual districts', () => {
    const challenge = makeChallenge({ location: { district: 'Ranchi' } })
    const factors = computeFactors(challenge, waterUniversity)
    const explanation = buildExplanation(challenge, waterUniversity, factors)
    expect(
      explanation.reasons.some((r) => r.includes('same district')),
    ).toBe(true)
  })

  it('produces a deterministic, non-empty set of reasons mapped to real factors', () => {
    const challenge = makeChallenge()
    const factors = computeFactors(challenge, waterUniversity)
    const first = buildExplanation(challenge, waterUniversity, factors)
    const second = buildExplanation(challenge, waterUniversity, factors)

    expect(first.reasons).toEqual(second.reasons)
    expect(first.summary).toBe(second.summary)
    expect(first.reasons.length).toBeGreaterThan(0)
  })
})
