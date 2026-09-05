import { describe, it, expect } from 'vitest'

import { studentCapabilityScore } from '../factors'
import { makeChallenge, waterUniversity } from './fixtures'
import type { UniversityProfile } from '../types'

function profile(overrides: Partial<UniversityProfile>): UniversityProfile {
  return { ...waterUniversity, ...overrides }
}

describe('studentCapabilityScore', () => {
  it('returns 100 when all required skills are matched by student capabilities', () => {
    const challenge = makeChallenge({
      requiredExpertise: ['Hydrology', 'Water Quality'],
    })
    expect(studentCapabilityScore(challenge, waterUniversity)).toBe(100)
  })

  it('returns 50 when half the required skills are matched', () => {
    const challenge = makeChallenge({
      requiredExpertise: ['Hydrology', 'Economics'],
    })
    expect(studentCapabilityScore(challenge, waterUniversity)).toBe(50)
  })

  it('returns 0 when no required skills are matched', () => {
    const challenge = makeChallenge({
      requiredExpertise: ['Economics', 'Geography'],
    })
    expect(studentCapabilityScore(challenge, waterUniversity)).toBe(0)
  })

  it('returns 70 when no specific student skills are required (LOCKED fallback)', () => {
    const challenge = makeChallenge({
      requiredExpertise: [],
    })
    expect(studentCapabilityScore(challenge, waterUniversity)).toBe(70)
  })

  it('is case/whitespace-insensitive', () => {
    const challenge = makeChallenge({
      requiredExpertise: ['  hydrology '],
    })
    const normalizedInput = makeChallenge({ requiredExpertise: ['Hydrology'] })
    expect(studentCapabilityScore(challenge, waterUniversity)).toBe(
      studentCapabilityScore(normalizedInput, waterUniversity),
    )
  })

  it('does NOT use university capacity as a substitute for capability', () => {
    const lowCapacity = profile({ capacity: 1, studentCapabilities: ['Hydrology'] })
    const highCapacity = profile({ capacity: 5, studentCapabilities: ['Hydrology'] })
    const challenge = makeChallenge({ requiredExpertise: ['Hydrology'] })
    expect(studentCapabilityScore(challenge, lowCapacity)).toBe(
      studentCapabilityScore(challenge, highCapacity),
    )
  })

  it('is deterministic for identical inputs', () => {
    const challenge = makeChallenge({ requiredExpertise: ['Hydrology'] })
    expect(studentCapabilityScore(challenge, waterUniversity)).toBe(
      studentCapabilityScore(challenge, waterUniversity),
    )
  })
})
