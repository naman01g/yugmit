import { describe, it, expect } from 'vitest'

import { locationScore } from '../factors'
import { makeChallenge, waterUniversity } from './fixtures'
import type { UniversityProfile } from '../types'

function profile(overrides: Partial<UniversityProfile>): UniversityProfile {
  return { ...waterUniversity, ...overrides }
}

describe('locationScore', () => {
  it('returns 100 when the university is in the same district as the challenge', () => {
    const challenge = makeChallenge({ location: { district: 'Ranchi' } })
    const uni = profile({ district: 'Ranchi' })
    expect(locationScore(challenge, uni)).toBe(100)
  })

  it('returns 80 for different district, same region', () => {
    // Ranchi and Gumla are both in Chotanagpur.
    const challenge = makeChallenge({ location: { district: 'Ranchi' } })
    const uni = profile({ district: 'Gumla' })
    expect(locationScore(challenge, uni)).toBe(80)
  })

  it('returns 70 for elsewhere in Jharkhand (different region)', () => {
    // Bokaro is in Santhal, Ranchi in Chotanagpur.
    const challenge = makeChallenge({ location: { district: 'Ranchi' } })
    const uni = profile({ district: 'Bokaro' })
    expect(locationScore(challenge, uni)).toBe(70)
  })

  it('returns 50 for a university outside Jharkhand', () => {
    const challenge = makeChallenge({ location: { district: 'Ranchi' } })
    const uni = profile({ district: 'Mumbai' })
    expect(locationScore(challenge, uni)).toBe(50)
  })

  it('returns 50 for a university whose district is unknown (never invents)', () => {
    const challenge = makeChallenge({ location: { district: 'Ranchi' } })
    const uni = profile({ district: 'unknown' })
    expect(locationScore(challenge, uni)).toBe(50)
  })

  it('is case/whitespace-insensitive', () => {
    const challenge = makeChallenge({ location: { district: '  ranchi ' } })
    const uni = profile({ district: 'Ranchi' })
    const challengeNorm = makeChallenge({ location: { district: 'Ranchi' } })
    expect(locationScore(challenge, uni)).toBe(
      locationScore(challengeNorm, uni),
    )
  })

  it('is deterministic for identical inputs', () => {
    const challenge = makeChallenge({ location: { district: 'Ranchi' } })
    const uni = profile({ district: 'Bokaro' })
    expect(locationScore(challenge, uni)).toBe(
      locationScore(challenge, uni),
    )
  })
})
