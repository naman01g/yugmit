import { describe, expect, it } from 'vitest'

import {
  challengeEvidenceCount,
  mapChallengeData,
  normalizeChallengeEvidence,
} from '@/lib/challenge-service'

const baseChallenge = {
  citizenId: 'citizen-1',
  title: 'Village water issue',
  description: 'A water source needs inspection.',
  domain: 'Water Management',
  tags: ['Drinking Water'],
  location: { district: 'Ranchi' },
  status: 'submitted',
  createdAt: 1,
  updatedAt: 1,
} as const

describe('challenge evidence normalization', () => {
  it('preserves an evidence URL array', () => {
    expect(normalizeChallengeEvidence(['https://res.cloudinary.com/yugmit/evidence.jpg']))
      .toEqual(['https://res.cloudinary.com/yugmit/evidence.jpg'])
  })

  it('preserves an empty evidence array', () => {
    expect(normalizeChallengeEvidence([])).toEqual([])
  })

  it('maps a missing legacy evidence field to an empty array', () => {
    const challenge = mapChallengeData('legacy-challenge', { ...baseChallenge })
    expect(challenge.evidence).toEqual([])
  })

  it('keeps a mixed list robust: one missing field is zero evidence while real URLs remain', () => {
    const legacy = mapChallengeData('legacy', { ...baseChallenge })
    const withEvidence = mapChallengeData('photo', {
      ...baseChallenge,
      evidence: ['https://res.cloudinary.com/yugmit/evidence.jpg'],
    })
    expect([legacy, withEvidence].map(challengeEvidenceCount)).toEqual([0, 1])
    expect([legacy, withEvidence].filter((challenge) => challengeEvidenceCount(challenge) > 0)).toHaveLength(1)
  })
})
