import { describe, expect, it } from 'vitest'

import { buildAnalysisDocument } from '@/features/ai/services/ai-analysis-service'
import type { AiAnalysisOutput, ChallengeSubmission } from '@/types/ai'
import {
  ALL_APPROVED_TAGS,
  ALLOWED_DOMAINS,
  ALLOWED_IMPACT_SCALES,
  ALLOWED_URGENCY,
  TAGS_BY_DOMAIN,
  isApprovedTag,
  isDomain,
  isImpactScale,
  isUrgency,
} from '@/lib/taxonomy'

import rulesSource from '../../../firestore.rules?raw'

function extractStringsFromArray(
  source: string,
  functionSignature: RegExp,
): string[] {
  const fnBody = source.match(functionSignature)
  if (!fnBody) throw new Error(`Missing function: ${functionSignature}`)
  const body = fnBody[1]
  if (body === undefined) return []
  const result: string[] = []
  for (const match of body.matchAll(/'([^']+)'/g)) {
    const value = match[1]
    if (value !== undefined) result.push(value)
  }
  return result
}

const ruleDomains = extractStringsFromArray(
  rulesSource,
  /function isApprovedDomain\(d\) \{\n      return d in \[(.*?)\];/s,
)
const ruleTags = extractStringsFromArray(
  rulesSource,
  /function approvedTags\(\) \{\n      return \[(.*?)\];/s,
)
const rulesUrgency = extractStringsFromArray(
  rulesSource,
  /request\.resource\.data\.urgency in \[(.*?)\]/,
)
const rulesImpactScale = extractStringsFromArray(
  rulesSource,
  /request\.resource\.data\.impactScale in \[(.*?)\]/,
)

const taxonomyTagValues = Object.values(TAGS_BY_DOMAIN).flat()

function mirrorsAiAnalysisValid(doc: Record<string, unknown>): boolean {
  if (typeof doc['primaryDomain'] !== 'string') return false
  if (!isDomain(doc['primaryDomain'])) return false
  const secondary = doc['secondaryDomain']
  if (secondary !== null && secondary !== undefined) {
    if (typeof secondary !== 'string') return false
    if (!isDomain(secondary)) return false
  }
  if (!Array.isArray(doc['tags'])) return false
  if (doc['tags'].length < 2 || doc['tags'].length > 6) return false
  if (doc['tags'].some((t) => typeof t !== 'string')) return false
  if (new Set(doc['tags'] as string[]).size !== doc['tags'].length) return false
  if (!(doc['tags'] as string[]).every((t) => isApprovedTag(t))) {
    return false
  }
  if (!isUrgency(doc['urgency'])) return false
  if (!isImpactScale(doc['impactScale'])) return false
  if (typeof doc['confidence'] !== 'number') return false
  if (doc['confidence'] < 0 || doc['confidence'] > 1) return false
  return true
}

const SUBMISSION: ChallengeSubmission = {
  id: 'c1',
  citizenId: 'u1',
  title: 'Irrigation shortage',
  description: 'No water for farms in summer.',
  location: { district: 'Ranchi' },
}

const OUTPUT: AiAnalysisOutput = {
  primaryDomain: 'Agriculture',
  secondaryDomain: 'Water Management',
  tags: ['Crop Management', 'Irrigation', 'Water Supply'],
  urgency: 'medium',
  impactScale: 'village_ward',
  requiredExpertise: ['Agronomist'],
  requiredFacilities: ['Irrigation Infrastructure'],
  problemSummary: 'Irrigation shortage.',
  duplicateSearchText: 'irrigation shortage agriculture',
  confidence: 0.85,
}

describe('firestore.rules ← taxonomy lock-step (drift regression guard)', () => {
  it('deployed domains exactly match ALLOWED_DOMAINS', () => {
    expect(new Set(ruleDomains)).toEqual(new Set(ALLOWED_DOMAINS))
  })

  it('deployed tags exactly match the taxonomy union (49 unique values)', () => {
    expect(new Set(ruleTags)).toEqual(new Set(taxonomyTagValues))
    expect(new Set(taxonomyTagValues)).toEqual(new Set(ALL_APPROVED_TAGS))
    expect(new Set(ruleTags).size).toBe(49)
  })

  it('deployed urgency list exactly matches ALLOWED_URGENCY', () => {
    expect(rulesUrgency).toEqual([...ALLOWED_URGENCY])
  })

  it('deployed impact scale list exactly matches ALLOWED_IMPACT_SCALES', () => {
    expect(rulesImpactScale).toEqual([...ALLOWED_IMPACT_SCALES])
  })

  it('aiAnalysisValid still enforces tag count, dedup, and confidence bounds', () => {
    expect(rulesSource).toContain('request.resource.data.tags.size() >= 2')
    expect(rulesSource).toContain('request.resource.data.tags.size() <= 6')
    expect(rulesSource).toContain('request.resource.data.tags.hasOnly(approvedTags())')
    expect(rulesSource).toContain(
      'request.resource.data.tags.toSet().size() == request.resource.data.tags.size()',
    )
    expect(rulesSource).toContain('request.resource.data.confidence <= 1')
    // Firestore rules has NO lambda/iterator methods — `.all(x, fn)` is invalid
    // and silently denies every create the moment it is evaluated. Regression guard.
    expect(rulesSource).not.toMatch(/\.all\(/)
    expect(rulesSource).toMatch(/allow create: if isSignedIn/)
    expect(rulesSource).toMatch(/allow update: if false/)
    expect(rulesSource).toMatch(/allow delete: if false/)
    const block = rulesSource.match(
      /match \/challenge_ai_analysis\/\{analysisId\}[\s\S]*?\n    \}/,
    )
    expect(block).not.toBeNull()
    expect(block?.[0]).toContain('request.resource.data.challengeId == analysisId')
    expect(block?.[0]).toContain(
      'get(/databases/$(database)/documents/challenges/$(analysisId)).data.citizenId == request.auth.uid',
    )
  })

  it('challenge_ai_analysis read requires authorization for the challenge (no public read)', () => {
    const block = rulesSource.match(
      /match \/challenge_ai_analysis\/\{analysisId\}[\s\S]*?\n    \}/,
    )?.[0]
    expect(block).toBeDefined()
    // Citizens may only read analysis for a challenge they own.
    expect(block).toContain(
      'get(/databases/$(database)/documents/challenges/$(analysisId)).data.citizenId == request.auth.uid',
    )
    // Government may read any authorized analysis.
    expect(block).toContain('isGovernment()')
    // University members only for their own (assigned or matched) challenges.
    expect(block).toContain('isUniversityMember()')
    expect(block).toContain('assignedUniversityId == ownUniversityId()')
    expect(block).toContain('challenge_matches/$(analysisId + \'_\' + ownUniversityId())')
    // The old blanket allow-read-for-every-signed-in-user must not return.
    expect(block).not.toContain('allow read: if isSignedIn();')
    // Immutability + ownership gates remain.
    expect(block).toContain('allow create: if isSignedIn()')
    expect(block).toContain('allow update: if false;')
    expect(block).toContain('allow delete: if false;')
  })
})

describe('client write satisfies aiAnalysisValid (persist contract)', () => {
  it('buildAnalysisDocument output passes the aiAnalysisValid mirror', () => {
    const doc = buildAnalysisDocument(SUBMISSION.id, SUBMISSION, OUTPUT, 'raw')
    expect(doc['challengeId']).toBe(SUBMISSION.id)
    expect(mirrorsAiAnalysisValid(doc)).toBe(true)
  })

  it('rejects docs that drift outside the validated contract', () => {
    const doc = buildAnalysisDocument(SUBMISSION.id, SUBMISSION, OUTPUT, 'raw')
    expect(
      mirrorsAiAnalysisValid({ ...doc, primaryDomain: 'Not A Domain' }),
    ).toBe(false)
    expect(
      mirrorsAiAnalysisValid({ ...doc, tags: (doc['tags'] as string[]).slice(0, 1) }),
    ).toBe(false)
    expect(mirrorsAiAnalysisValid({ ...doc, tags: ['Not A Tag'] })).toBe(false)
    expect(mirrorsAiAnalysisValid({ ...doc, urgency: 'critical' })).toBe(false)
    expect(mirrorsAiAnalysisValid({ ...doc, impactScale: '10000' })).toBe(false)
    expect(mirrorsAiAnalysisValid({ ...doc, confidence: 1.5 })).toBe(false)
  })
})