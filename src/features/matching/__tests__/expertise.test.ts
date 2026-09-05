import { describe, it, expect } from 'vitest'

import { expertiseScore } from '../factors'
import { makeChallenge, waterUniversity } from './fixtures'
import type { UniversityProfile } from '../types'

function profile(overrides: Partial<UniversityProfile>): UniversityProfile {
  return { ...waterUniversity, ...overrides }
}

describe('expertiseScore', () => {
  it('returns domain score 100 when primary domain is supported', () => {
    const challenge = makeChallenge({
      primaryDomain: 'Water Management',
      secondaryDomain: null,
      tags: [],
      requiredExpertise: [],
    })
    // domainScore = 100, tagScore = 0 (no tags) => 100 * 0.6 + 0 = 60
    expect(expertiseScore(challenge, waterUniversity)).toBe(60)
  })

  it('returns domain score 50 when only the secondary domain is supported', () => {
    const challenge = makeChallenge({
      primaryDomain: 'Energy',
      secondaryDomain: 'Environment',
      tags: [],
      requiredExpertise: [],
    })
    // domainScore = 50 (secondary), tagScore = 0 => 50 * 0.6 = 30
    expect(expertiseScore(challenge, waterUniversity)).toBe(30)
  })

  it('returns domain score 0 when neither domain is supported', () => {
    const challenge = makeChallenge({
      primaryDomain: 'Education',
      secondaryDomain: 'Energy',
      tags: [],
      requiredExpertise: [],
    })
    expect(expertiseScore(challenge, waterUniversity)).toBe(0)
  })

  it('returns 100 expertise when primary domain and all tags match', () => {
    const challenge = makeChallenge({
      primaryDomain: 'Water Management',
      secondaryDomain: null,
      tags: ['Water Management', 'Environment'],
    })
    // domainScore=100, tagScore=(2/2*100)=100 => 100*0.6 + 100*0.4 = 100
    expect(expertiseScore(challenge, waterUniversity)).toBe(100)
  })

  it('computes partial tag matches correctly', () => {
    const challenge = makeChallenge({
      primaryDomain: 'Water Management',
      secondaryDomain: null,
      tags: ['Water Management', 'Education'],
    })
    // domainScore=100, tagScore=(1/2*100)=50 => 100*0.6 + 50*0.4 = 80
    expect(expertiseScore(challenge, waterUniversity)).toBe(80)
  })

  it('handles no tags (tag component is 0, driven by domain) deterministically', () => {
    const challenge = makeChallenge({
      primaryDomain: 'Water Management',
      secondaryDomain: null,
      tags: [],
      requiredExpertise: [],
    })
    const result = expertiseScore(challenge, waterUniversity)
    expect(result).toBe(60)
    // Deterministic: two identical calls return the same value.
    expect(expertiseScore(challenge, waterUniversity)).toBe(result)
  })

  it('accounts for required expertise when no controlled tags are present', () => {
    const challenge = makeChallenge({
      primaryDomain: 'Water Management',
      secondaryDomain: null,
      tags: [],
      requiredExpertise: ['Hydrology', 'Geology'],
    })
    // domainScore=100, required expertise match = 1/2 => expertiseRatio=50
    // => 100*0.6 + 50*0.4 = 80
    expect(expertiseScore(challenge, waterUniversity)).toBe(80)
  })

  it('is case/whitespace-insensitive (normalization)', () => {
    const challenge = makeChallenge({
      primaryDomain: '  water MANAGEMENT ',
      secondaryDomain: null,
      tags: ['water quality'],
    })
    const normalizedInput = makeChallenge({
      primaryDomain: 'Water Management',
      secondaryDomain: null,
      tags: ['Water Quality'],
    })
    expect(expertiseScore(challenge, waterUniversity)).toBe(
      expertiseScore(normalizedInput, waterUniversity),
    )
  })

  it('returns 0 when domain and tag and expertise all fail', () => {
    const challenge = makeChallenge({
      primaryDomain: 'Education',
      secondaryDomain: 'Energy',
      tags: ['Education'],
      requiredExpertise: [],
    })
    const unrelated = profile({
      domains: ['Healthcare'],
      expertise: ['Medicine'],
    })
    expect(expertiseScore(challenge, unrelated)).toBe(0)
  })

  it('is deterministic for identical inputs', () => {
    const challenge = makeChallenge()
    const a = expertiseScore(challenge, waterUniversity)
    const b = expertiseScore(challenge, waterUniversity)
    expect(a).toBe(b)
  })
})
