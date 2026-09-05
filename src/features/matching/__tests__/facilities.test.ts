import { describe, it, expect } from 'vitest'

import { facilitiesScore } from '../factors'
import { makeChallenge, waterUniversity } from './fixtures'

describe('facilitiesScore', () => {
  it('returns 100 when all required facilities are matched', () => {
    const challenge = makeChallenge({
      requiredFacilities: ['Water Testing Lab'],
    })
    expect(facilitiesScore(challenge, waterUniversity)).toBe(100)
  })

  it('returns 50 when half of the required facilities are matched', () => {
    const challenge = makeChallenge({
      requiredFacilities: ['Water Testing Lab', 'Nuclear Lab'],
    })
    expect(facilitiesScore(challenge, waterUniversity)).toBe(50)
  })

  it('returns 0 when no required facilities are matched', () => {
    const challenge = makeChallenge({
      requiredFacilities: ['Nuclear Lab', 'Wind Tunnel'],
    })
    expect(facilitiesScore(challenge, waterUniversity)).toBe(0)
  })

  it('returns 70 when no facilities are required (LOCKED fallback, not 100)', () => {
    const challenge = makeChallenge({
      requiredFacilities: [],
    })
    expect(facilitiesScore(challenge, waterUniversity)).toBe(70)
  })

  it('is case/whitespace-insensitive', () => {
    const challenge = makeChallenge({
      requiredFacilities: ['  water testing LAB '],
    })
    const normalizedInput = makeChallenge({
      requiredFacilities: ['Water Testing Lab'],
    })
    expect(facilitiesScore(challenge, waterUniversity)).toBe(
      facilitiesScore(normalizedInput, waterUniversity),
    )
  })

  it('is deterministic for identical inputs', () => {
    const challenge = makeChallenge({ requiredFacilities: ['Water Testing Lab'] })
    expect(facilitiesScore(challenge, waterUniversity)).toBe(
      facilitiesScore(challenge, waterUniversity),
    )
  })
})
