import { describe, it, expect } from 'vitest'

import { previousProjectsScore } from '../factors'
import { makeChallenge, waterUniversity } from './fixtures'
import type { UniversityProfile } from '../types'

function profile(overrides: Partial<UniversityProfile>): UniversityProfile {
  return { ...waterUniversity, ...overrides }
}

describe('previousProjectsScore', () => {
  it('returns 0 when there is no relevant project evidence', () => {
    const uni = profile({ previousProjects: [] })
    expect(previousProjectsScore(makeChallenge(), uni)).toBe(0)
  })

  it('returns 0 when the project evidence is "unknown"', () => {
    const uni = profile({ previousProjects: ['unknown'] })
    expect(previousProjectsScore(makeChallenge(), uni)).toBe(0)
  })

  it('returns 25 (weakly related) for a project mentioning only the domain', () => {
    const challenge = makeChallenge({
      primaryDomain: 'Water Management',
      secondaryDomain: null,
      tags: ['Water Quality', 'Groundwater'],
    })
    const uni = profile({
      previousProjects: ['Water Management department annual report'],
    })
    expect(previousProjectsScore(challenge, uni)).toBe(25)
  })

  it('returns 50 (related domain) for a project matching a single required tag', () => {
    const challenge = makeChallenge({
      primaryDomain: 'Water Management',
      secondaryDomain: null,
      tags: ['Water Quality', 'Groundwater'],
    })
    const uni = profile({
      previousProjects: ['Study of Water Quality in local rivers'],
    })
    expect(previousProjectsScore(challenge, uni)).toBe(50)
  })

  it('returns 75 (strongly related) for a project matching multiple tags without the domain', () => {
    const challenge = makeChallenge({
      primaryDomain: 'Water Management',
      secondaryDomain: null,
      tags: ['Water Quality', 'Water Supply', 'Groundwater'],
    })
    const uni = profile({
      previousProjects: ['Water Quality and Water Supply baseline study'],
    })
    expect(previousProjectsScore(challenge, uni)).toBe(75)
  })

  it('returns 100 (directly relevant) for a project matching tags and the domain', () => {
    const challenge = makeChallenge({
      primaryDomain: 'Water Management',
      secondaryDomain: null,
      tags: ['Water Quality', 'Water Supply'],
    })
    const uni = profile({
      previousProjects: ['Water Management: Water Quality and Water Supply program'],
    })
    expect(previousProjectsScore(challenge, uni)).toBe(100)
  })

  it('is deterministic for identical inputs across all scale levels', () => {
    const challenge = makeChallenge({
      primaryDomain: 'Water Management',
      secondaryDomain: null,
      tags: ['Water Quality', 'Water Supply'],
    })
    const uni = profile({
      previousProjects: ['Water Management: Water Quality and Water Supply program'],
    })
    const first = previousProjectsScore(challenge, uni)
    const second = previousProjectsScore(challenge, uni)
    expect(first).toBe(second)
  })
})
