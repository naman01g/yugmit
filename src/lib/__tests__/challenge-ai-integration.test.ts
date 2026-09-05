import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import type { AiAnalysisOutput, ChallengeSubmission } from '@/types/ai'

// Mock all I/O boundaries: Gemini stays quiet and Firestore is a light fake.
vi.mock('@/features/ai/services/ai-analysis-service', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@/features/ai/services/ai-analysis-service')
  >()
  return {
    ...actual,
    analyzeChallenge: vi.fn(),
  }
})

vi.mock('@/lib/firebase', () => ({
  db: {},
  isFirebaseConfigured: true,
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db: unknown, path: string, id: string) => ({ path, id })),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}))

import { analyzeChallenge } from '@/features/ai/services/ai-analysis-service'
import {
  getChallengeAiAnalysis,
  persistAiAnalysis,
  runChallengeAiAnalysis,
} from '@/features/ai/services/challenge-ai-integration'
import { getDoc, setDoc } from 'firebase/firestore'

const analyzeChallengeMock = vi.mocked(analyzeChallenge)
const setDocMock = vi.mocked(setDoc)
const getDocMock = vi.mocked(getDoc)

interface PersistedRef {
  path: string
  id: string
}

function lastSetDocCall(): {
  ref: PersistedRef
  data: Record<string, unknown>
} {
  const call = setDocMock.mock.calls[setDocMock.mock.calls.length - 1]!
  const ref = call[0] as unknown as PersistedRef
  const data = call[1] as Record<string, unknown>
  return { ref, data }
}

const SUBMISSION: ChallengeSubmission = {
  id: 'c1',
  citizenId: 'u1',
  title: 'Irrigation shortage',
  description: 'No water for farms in summer.',
  location: { district: 'Ranchi' },
}

const HIGH_CONFIDENCE: AiAnalysisOutput = {
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

const LOW_CONFIDENCE: AiAnalysisOutput = {
  ...HIGH_CONFIDENCE,
  confidence: 0.55,
}

beforeEach(() => {
  analyzeChallengeMock.mockReset()
  setDocMock.mockReset()
  getDocMock.mockReset()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('runChallengeAiAnalysis — successful pipeline', () => {
  it('persists a valid analysis to challenge_ai_analysis keyed by challengeId', async () => {
    analyzeChallengeMock.mockResolvedValue({
      ok: true,
      analysis: HIGH_CONFIDENCE,
      rawResponse: '{"primaryDomain":"Agriculture"}',
    })

    const run = await runChallengeAiAnalysis(SUBMISSION.id, SUBMISSION)

    expect(run.ok).toBe(true)
    if (!run.ok) return
    expect(run.state).toBe('completed')
    expect(run.lowConfidence).toBe(false)

    // One intentional analysis attempt per submission — never duplicate.
    expect(analyzeChallengeMock).toHaveBeenCalledTimes(1)

    expect(setDocMock).toHaveBeenCalledTimes(1)
    const { ref, data } = lastSetDocCall()
    expect(ref.path).toBe('challenge_ai_analysis')
    expect(ref.id).toBe('c1')
    expect(data['challengeId']).toBe('c1')
    expect(data['confidence']).toBe(0.85)
    expect(data['primaryDomain']).toBe('Agriculture')
    expect(data['locationContext']).toBe('Ranchi')
    expect(data['duplicate_candidates']).toEqual([])
  })

  it('flags low confidence for reviewer attention but still persists', async () => {
    analyzeChallengeMock.mockResolvedValue({
      ok: true,
      analysis: LOW_CONFIDENCE,
      rawResponse: 'raw',
    })

    const run = await runChallengeAiAnalysis(SUBMISSION.id, SUBMISSION)

    expect(run.ok).toBe(true)
    if (!run.ok) return
    expect(run.lowConfidence).toBe(true)
    expect(setDocMock).toHaveBeenCalledTimes(1)
  })

  it('does not flag confidence at the 0.70 threshold', async () => {
    analyzeChallengeMock.mockResolvedValue({
      ok: true,
      analysis: { ...HIGH_CONFIDENCE, confidence: 0.7 },
      rawResponse: 'raw',
    })

    const run = await runChallengeAiAnalysis(SUBMISSION.id, SUBMISSION)
    expect(run.ok).toBe(true)
    if (run.ok) expect(run.lowConfidence).toBe(false)
  })
})

describe('runChallengeAiAnalysis — failure handling (never blocks the challenge)', () => {
  it('returns failed with gemini_not_configured when the API key is missing', async () => {
    analyzeChallengeMock.mockResolvedValue({
      ok: false,
      code: 'gemini_not_configured',
      message: 'AI analysis is not configured.',
    })

    const run = await runChallengeAiAnalysis(SUBMISSION.id, SUBMISSION)

    expect(run.ok).toBe(false)
    if (run.ok) return
    expect(run.state).toBe('failed')
    expect(run.errorCode).toBe('gemini_not_configured')
    expect(setDocMock).not.toHaveBeenCalled()
  })

  it('returns failed with gemini_request_failed on an API failure', async () => {
    analyzeChallengeMock.mockResolvedValue({
      ok: false,
      code: 'gemini_request_failed',
      message: 'upstream 500',
    })

    const run = await runChallengeAiAnalysis(SUBMISSION.id, SUBMISSION)

    expect(run.ok).toBe(false)
    if (!run.ok) expect(run.errorCode).toBe('gemini_request_failed')
    expect(setDocMock).not.toHaveBeenCalled()
  })

  it('returns failed with rate_limit and does not persist', async () => {
    analyzeChallengeMock.mockResolvedValue({
      ok: false,
      code: 'rate_limit',
      message: 'rate limited',
    })

    const run = await runChallengeAiAnalysis(SUBMISSION.id, SUBMISSION)

    expect(run.ok).toBe(false)
    if (!run.ok) expect(run.errorCode).toBe('rate_limit')
    expect(setDocMock).not.toHaveBeenCalled()
  })

  it('returns failed on invalid JSON from Gemini', async () => {
    analyzeChallengeMock.mockResolvedValue({
      ok: false,
      code: 'invalid_json',
      message: 'no json',
    })

    const run = await runChallengeAiAnalysis(SUBMISSION.id, SUBMISSION)

    expect(run.ok).toBe(false)
    if (!run.ok) expect(run.errorCode).toBe('invalid_json')
    expect(setDocMock).not.toHaveBeenCalled()
  })

  it('returns failed on taxonomy violations (domain/tag/urgency/impactScale/confidence)', async () => {
    analyzeChallengeMock.mockResolvedValue({
      ok: false,
      code: 'validation_failed',
      message:
        'bad primaryDomain; bad tag; bad urgency; bad impactScale; confidence out of range',
    })

    const run = await runChallengeAiAnalysis(SUBMISSION.id, SUBMISSION)

    expect(run.ok).toBe(false)
    if (!run.ok) expect(run.errorCode).toBe('validation_failed')
    expect(setDocMock).not.toHaveBeenCalled()
  })

  it('returns failed with persist_failed when the Firestore write is rejected', async () => {
    analyzeChallengeMock.mockResolvedValue({
      ok: true,
      analysis: HIGH_CONFIDENCE,
      rawResponse: 'raw',
    })
    setDocMock.mockRejectedValueOnce(new Error('permission-denied'))

    const run = await runChallengeAiAnalysis(SUBMISSION.id, SUBMISSION)

    expect(run.ok).toBe(false)
    if (!run.ok) expect(run.errorCode).toBe('persist_failed')
  })

  it('an AI failure is one attempt, never touches the challenge, and never writes anything', async () => {
    analyzeChallengeMock.mockResolvedValue({
      ok: false,
      code: 'gemini_request_failed',
      message: 'boom',
    })

    const run = await runChallengeAiAnalysis(SUBMISSION.id, SUBMISSION)

    expect(run.ok).toBe(false)
    if (!run.ok) expect(run.errorCode).toBe('gemini_request_failed')
    // No retry loop at this layer, no duplicate analysis requests.
    expect(analyzeChallengeMock).toHaveBeenCalledTimes(1)
    // The citizen's challenge is never deleted, reverted, or rewritten.
    expect(setDocMock).not.toHaveBeenCalled()
    expect(getDocMock).not.toHaveBeenCalled()
  })

  it('on success writes ONLY the challenge_ai_analysis document, keyed by challengeId', async () => {
    analyzeChallengeMock.mockResolvedValue({
      ok: true,
      analysis: HIGH_CONFIDENCE,
      rawResponse: 'raw',
    })

    await runChallengeAiAnalysis(SUBMISSION.id, SUBMISSION)

    expect(analyzeChallengeMock).toHaveBeenCalledTimes(1)
    expect(setDocMock).toHaveBeenCalledTimes(1)
    const { ref } = lastSetDocCall()
    expect(ref.path).toBe('challenge_ai_analysis')
    expect(ref.id).toBe(SUBMISSION.id)
  })

  it('never throws — unexpected analyzer rejection maps to failed', async () => {
    analyzeChallengeMock.mockRejectedValueOnce(new Error('something broke'))

    const run = await runChallengeAiAnalysis(SUBMISSION.id, SUBMISSION)

    expect(run.ok).toBe(false)
    if (!run.ok) expect(run.errorCode).toBe('unknown')
    expect(setDocMock).not.toHaveBeenCalled()
  })
})

describe('AI contract — the persisted analysis is immutable and decision-free', () => {
  it('writes only the create contract: no updatedAt and no government or merge decision fields', async () => {
    analyzeChallengeMock.mockResolvedValue({
      ok: true,
      analysis: HIGH_CONFIDENCE,
      rawResponse: 'raw',
    })

    const run = await runChallengeAiAnalysis(SUBMISSION.id, SUBMISSION)
    expect(run.ok).toBe(true)
    if (!run.ok) return

    const { data } = lastSetDocCall()
    expect(data['updatedAt']).toBeUndefined()
    expect(data['approvalStatus']).toBeUndefined()
    expect(data['isApproved']).toBeUndefined()
    expect(data['isRejected']).toBeUndefined()
    expect(data['mergeDecision']).toBeUndefined()
    expect(data['deleteDecision']).toBeUndefined()
    expect(data['isDuplicate']).toBeUndefined()
    expect(data['finalDuplicateStatus']).toBeUndefined()
    expect(data['assignedUniversityId']).toBeUndefined()
    // duplicate search text is for the dedup layer, never a decision itself
    expect(typeof data['duplicateSearchText']).toBe('string')
    expect(data['duplicate_candidates']).toEqual([])
    // confidence is strictly a number from validation, usable for flagging
    const confidence = data['confidence']
    expect(typeof confidence).toBe('number')
    expect(confidence as number).toBeGreaterThanOrEqual(0)
    expect(confidence as number).toBeLessThanOrEqual(1)
  })

  it('persists an immutable create-only document (no updatedAt, no government decision fields, no similarity interactions)', async () => {
    analyzeChallengeMock.mockResolvedValue({
      ok: true,
      analysis: HIGH_CONFIDENCE,
      rawResponse: 'raw',
    })

    await runChallengeAiAnalysis(SUBMISSION.id, SUBMISSION)

    expect(setDocMock).toHaveBeenCalledTimes(1)
    const { ref } = lastSetDocCall()
    expect(ref.path).toBe('challenge_ai_analysis')
    expect(ref.id).toBe(SUBMISSION.id)
    expect(setDocMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'challenge_ai_analysis' }),
      expect.any(Object),
    )
  })
})

describe('persistAiAnalysis', () => {
  it('writes the document to the challengeId-keyed collection', async () => {
    await persistAiAnalysis('c1', { challengeId: 'c1', confidence: 0.85 })
    expect(setDocMock).toHaveBeenCalledTimes(1)
    const { ref } = lastSetDocCall()
    expect(ref.path).toBe('challenge_ai_analysis')
    expect(ref.id).toBe('c1')
  })
})

describe('getChallengeAiAnalysis', () => {
  it('returns the stored analysis when present', async () => {
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({ challengeId: 'c1', confidence: 0.85 }),
    } as unknown as never)

    const analysis = await getChallengeAiAnalysis('c1')
    expect(analysis).not.toBeNull()
    expect(analysis?.['confidence']).toBe(0.85)
  })

  it('returns null when no analysis exists yet', async () => {
    getDocMock.mockResolvedValue({
      exists: () => false,
      data: () => undefined,
    } as unknown as never)

    const analysis = await getChallengeAiAnalysis('c1')
    expect(analysis).toBeNull()
  })
})