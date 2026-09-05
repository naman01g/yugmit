import { describe, expect, it } from 'vitest'

import { buildChallengeInput } from '../university-matching-service'
import type { Challenge } from '@/types/challenge'
import type { ChallengeAiAnalysis } from '@/types/ai'

const baseChallenge: Challenge = {
  id: 'challenge-1',
  citizenId: 'citizen-1',
  title: 'Safe drinking water in Ranchi',
  description: 'Community needs clean drinking water access.',
  domain: 'Water Management',
  tags: ['Water Quality', 'Drinking Water'],
  location: { district: 'Ranchi' },
  evidence: [],
  status: 'validated',
  createdAt: 1000,
  updatedAt: 2000,
}

const analysis: ChallengeAiAnalysis = {
  challengeId: 'challenge-1',
  primaryDomain: 'Water Management',
  secondaryDomain: 'Environment',
  tags: ['Drinking Water', 'Water Quality', 'Water Supply'],
  urgency: 'high',
  impactScale: 'neighborhood',
  locationContext: 'Ranchi',
  requiredExpertise: ['Hydrology', 'Water Quality Testing'],
  requiredFacilities: ['Water Testing Lab'],
  problemSummary: 'Community needs clean drinking water access.',
  duplicateSearchText: 'drinking water',
  duplicate_candidates: [],
  confidence: 0.9,
  rawAiResponse: '',
  createdAt: 1500,
}

describe('university matching — buildChallengeInput (AI analysis authoritative)', () => {
  it('prefers AI analysis fields over citizen-selected-challenge fields', () => {
    const input = buildChallengeInput(baseChallenge, analysis)
    expect(input.challengeId).toBe('challenge-1')
    expect(input.primaryDomain).toBe('Water Management')
    expect(input.secondaryDomain).toBe('Environment')
    expect(input.tags).toEqual(['Drinking Water', 'Water Quality', 'Water Supply'])
    expect(input.requiredExpertise).toEqual(['Hydrology', 'Water Quality Testing'])
    expect(input.requiredFacilities).toEqual(['Water Testing Lab'])
    expect(input.location).toEqual({ district: 'Ranchi' })
  })

  it('falls back to the challenge fields when no AI analysis exists', () => {
    const input = buildChallengeInput(baseChallenge, null)
    expect(input.primaryDomain).toBe('Water Management')
    expect(input.secondaryDomain).toBeNull()
    expect(input.tags).toEqual(['Water Quality', 'Drinking Water'])
    expect(input.requiredExpertise).toEqual([])
    expect(input.requiredFacilities).toEqual([])
    expect(input.location).toEqual({ district: 'Ranchi' })
  })

  it('uses challenge domain when AI analysis has no primaryDomain', () => {
    const input = buildChallengeInput(baseChallenge, { ...analysis, primaryDomain: '' })
    expect(input.primaryDomain).toBe('')
    expect(input.secondaryDomain).toBe('Environment')
  })
})