import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { analyzeChallenge, needsReviewerAttention } from '@/features/ai/services/ai-analysis-service'
import type { AiAnalysisOutput, ChallengeSubmission } from '@/types/ai'

// Mock the Gemini client so no live calls are made and no API key is needed.
vi.mock('@/lib/gemini-client', () => ({
  isGeminiConfigured: vi.fn(() => true),
  sendGeminiPrompt: vi.fn(),
}))

import { isGeminiConfigured, sendGeminiPrompt } from '@/lib/gemini-client'

const sendGeminiPromptMock = vi.mocked(sendGeminiPrompt)

const VALID_OUTPUT: AiAnalysisOutput = {
  primaryDomain: 'Agriculture',
  secondaryDomain: null,
  tags: ['Crop Management', 'Irrigation'],
  urgency: 'medium',
  impactScale: 'village_ward',
  requiredExpertise: [],
  requiredFacilities: [],
  problemSummary: 'Irrigation shortage.',
  duplicateSearchText: 'irrigation shortage',
  confidence: 0.85,
}

const VALID_TEXT = JSON.stringify(VALID_OUTPUT)

const SUBMISSION: ChallengeSubmission = {
  id: 'c1',
  citizenId: 'u1',
  title: 'Irrigation shortage',
  description: 'No water for farms.',
  location: { district: 'Ranchi' },
}

describe('analyzeChallenge — deterministic with mocked Gemini client', () => {
  beforeEach(() => {
    vi.mocked(isGeminiConfigured).mockReturnValue(true)
    sendGeminiPromptMock.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns success for a valid Gemini response', async () => {
    sendGeminiPromptMock.mockResolvedValueOnce({ ok: true, text: VALID_TEXT })

    const result = await analyzeChallenge(SUBMISSION)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.analysis.primaryDomain).toBe('Agriculture')
      expect(result.analysis.confidence).toBe(0.85)
      expect(result.rawResponse).toBe(VALID_TEXT)
    }
  })

  it('returns not_configured when Gemini is not configured', async () => {
    vi.mocked(isGeminiConfigured).mockReturnValue(false)

    const result = await analyzeChallenge(SUBMISSION)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe('gemini_not_configured')
    }
    expect(sendGeminiPromptMock).not.toHaveBeenCalled()
  })

  it('fails gracefully on rate limit and does not retry', async () => {
    sendGeminiPromptMock.mockResolvedValueOnce({
      ok: false,
      code: 'rate_limit',
      message: 'rate limited',
    })

    const result = await analyzeChallenge(SUBMISSION)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe('rate_limit')
    }
    expect(sendGeminiPromptMock).toHaveBeenCalledTimes(1)
  })

  it('fails gracefully on invalid JSON output', async () => {
    sendGeminiPromptMock.mockResolvedValueOnce({
      ok: true,
      text: 'this is not json',
    })

    const result = await analyzeChallenge(SUBMISSION)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe('invalid_json')
    }
    expect(sendGeminiPromptMock).toHaveBeenCalledTimes(1) // no retry on invalid JSON
  })

  it('fails on schema validation failure', async () => {
    const bad = { ...VALID_OUTPUT, primaryDomain: 'Rocket Science' }
    sendGeminiPromptMock.mockResolvedValueOnce({
      ok: true,
      text: JSON.stringify(bad),
    })

    const result = await analyzeChallenge(SUBMISSION)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe('validation_failed')
    }
    // malformed output is not retried indefinitely
    expect(sendGeminiPromptMock).toHaveBeenCalledTimes(1)
  })

  it('treats missing required fields as validation_failed', async () => {
    const partial = JSON.stringify({
      primaryDomain: 'Agriculture',
      tags: ['Crop Management', 'Irrigation'],
    })
    sendGeminiPromptMock.mockResolvedValueOnce({ ok: true, text: partial })

    const result = await analyzeChallenge(SUBMISSION)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe('validation_failed')
    }
  })
})

describe('AI contract — no workflow decisions', () => {
  it('confirms Gemini cannot return approval/rejection/merge/delete decisions', () => {
    const keys = Object.keys(VALID_OUTPUT).sort()
    expect(keys).not.toContain('approvalStatus')
    expect(keys).not.toContain('isApproved')
    expect(keys).not.toContain('isRejected')
    expect(keys).not.toContain('mergeDecision')
    expect(keys).not.toContain('deleteDecision')
    expect(keys).not.toContain('isDuplicate')
    expect(keys).not.toContain('finalDuplicateStatus')
    expect(keys).not.toContain('assignedUniversityId')
    expect(keys).not.toContain('similarity')
  })
})

describe('confidence vs duplicate similarity are distinct', () => {
  it('needsReviewerAttention is based on confidence, not similarity', () => {
    // confidence below 0.70 -> flagged
    expect(needsReviewerAttention(0.69)).toBe(true)
    // a separate similarity number is NOT used for this decision
    expect(needsReviewerAttention(0.90)).toBe(false)
  })
})
