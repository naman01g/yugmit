import { describe, expect, it } from 'vitest'

import { buildAnalysisPrompt } from '../ai-prompt'
import {
  buildAnalysisDocument,
  needsReviewerAttention,
} from '@/features/ai/services/ai-analysis-service'
import type { AiAnalysisOutput, ChallengeSubmission } from '@/types/ai'

const submission: ChallengeSubmission = {
  id: 'challenge-1',
  citizenId: 'user-1',
  title: 'Village irrigation shortage',
  description: 'The village has no reliable water supply for farming in summer.',
  location: { district: 'Ranchi', lat: 23.3, lng: 85.3 },
}

const output: AiAnalysisOutput = {
  primaryDomain: 'Agriculture',
  secondaryDomain: null,
  tags: ['Crop Management', 'Irrigation'],
  urgency: 'medium',
  impactScale: 'village_ward',
  requiredExpertise: ['Agronomist'],
  requiredFacilities: ['Irrigation Infrastructure'],
  problemSummary: 'Irrigation shortage.',
  duplicateSearchText: 'irrigation shortage agriculture',
  confidence: 0.85,
}

describe('buildAnalysisPrompt', () => {
  it('includes title, description, and location', () => {
    const prompt = buildAnalysisPrompt(submission)
    expect(prompt).toContain(submission.title)
    expect(prompt).toContain(submission.description)
    expect(prompt).toContain('Ranchi')
    expect(prompt).toContain('23.3')
  })

  it('includes the locked allowed-domains list', () => {
    const prompt = buildAnalysisPrompt(submission)
    expect(prompt).toContain('Education')
    expect(prompt).toContain('Rural Livelihoods')
    expect(prompt).toContain('Water Management')
  })
})

describe('buildAnalysisDocument', () => {
  it('produces a document with challengeId and immutable contract fields', () => {
    const doc = buildAnalysisDocument(
      submission.id,
      submission,
      output,
      'raw-json',
    )
    expect(doc['challengeId']).toBe('challenge-1')
    expect(doc['primaryDomain']).toBe('Agriculture')
    expect(doc['confidence']).toBe(0.85)
    expect(doc['locationContext']).toBe('Ranchi')
    expect(doc['rawAiResponse']).toBe('raw-json')
    expect(doc['duplicate_candidates']).toEqual([])
  })

  it('copies secondaryDomain null exactly', () => {
    const doc = buildAnalysisDocument(
      submission.id,
      submission,
      output,
      'raw',
    )
    expect(doc['secondaryDomain']).toBeNull()
  })
})

describe('needsReviewerAttention', () => {
  it('flags confidence below 0.70', () => {
    expect(needsReviewerAttention(0.69)).toBe(true)
    expect(needsReviewerAttention(0.5)).toBe(true)
    expect(needsReviewerAttention(0.0)).toBe(true)
  })

  it('does not flag confidence at 0.70 or above', () => {
    expect(needsReviewerAttention(0.7)).toBe(false)
    expect(needsReviewerAttention(0.85)).toBe(false)
    expect(needsReviewerAttention(1.0)).toBe(false)
  })
})
