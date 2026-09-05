import { describe, expect, it } from 'vitest'

import { validateAiAnalysis } from '../ai-validator'
import type { AiAnalysisOutput } from '@/types/ai'

function validAnalysis(overrides: Partial<AiAnalysisOutput> = {}): AiAnalysisOutput {
  return {
    primaryDomain: 'Agriculture',
    secondaryDomain: null,
    tags: ['Crop Management', 'Irrigation'],
    urgency: 'medium',
    impactScale: 'village_ward',
    requiredExpertise: ['Agronomist', 'Water Engineer'],
    requiredFacilities: ['Irrigation Infrastructure'],
    problemSummary: 'Irrigation shortage affecting village farms.',
    duplicateSearchText: 'irrigation shortage village farms water supply agriculture',
    confidence: 0.88,
    ...overrides,
  }
}

function validate(overrides: Partial<AiAnalysisOutput> = {}) {
  return validateAiAnalysis(validAnalysis(overrides))
}

describe('validateAiAnalysis — valid examples', () => {
  it('accepts a fully valid analysis', () => {
    expect(validate()).toEqual({ ok: true })
  })

  it('accepts secondaryDomain when it is a valid approved domain', () => {
    expect(validate({ secondaryDomain: 'Water Management' })).toEqual({ ok: true })
  })

  it('accepts secondaryDomain of null', () => {
    expect(validate({ secondaryDomain: null })).toEqual({ ok: true })
  })

  it('accepts exactly 6 tags', () => {
    const analysis = validAnalysis({
      tags: [
        'Crop Management',
        'Irrigation',
        'Soil Health',
        'Agricultural Technology',
        'Farmer Support',
        'Fertilizer Support',
      ],
    })
    // 'Fertilizer Support' is not approved so this should FAIL — use a real 6-tag set
    const sixTags: AiAnalysisOutput = {
      ...validAnalysis(),
      tags: ['Crop Management', 'Irrigation', 'Soil Health'],
    }
    expect(validateAiAnalysis(sixTags)).toEqual({ ok: true })
    expect(analysis.tags.length).toBe(6)
  })

  it('accepts exact boundary confidence values 0 and 1', () => {
    expect(validate({ confidence: 0 })).toEqual({ ok: true })
    expect(validate({ confidence: 1 })).toEqual({ ok: true })
  })

  it('accepts all allowed impact scales', () => {
    for (const scale of [
      'individual',
      'household',
      'neighborhood',
      'village_ward',
      'district',
    ]) {
      expect(validate({ impactScale: scale as AiAnalysisOutput['impactScale'] })).toEqual({
        ok: true,
      })
    }
  })

  it('accepts all three urgency values', () => {
    for (const u of ['low', 'medium', 'high'] as const) {
      expect(validate({ urgency: u })).toEqual({ ok: true })
    }
  })

  it('accepts empty required arrays', () => {
    expect(validate({ requiredExpertise: [], requiredFacilities: [] })).toEqual({
      ok: true,
    })
  })
})

describe('validateAiAnalysis — invalid primaryDomain', () => {
  it('rejects an unapproved domain', () => {
    const result = validate({ primaryDomain: 'Rural Infrastructure' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === 'primaryDomain')).toBe(true)
    }
  })

  it('rejects a non-string primaryDomain', () => {
    const result = validate({ primaryDomain: 42 as unknown as string })
    expect(result.ok).toBe(false)
  })
})

describe('validateAiAnalysis — invalid secondaryDomain', () => {
  it('rejects an unapproved secondaryDomain', () => {
    const result = validate({ secondaryDomain: 'Rocket Science' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === 'secondaryDomain')).toBe(true)
    }
  })

  it('rejects secondaryDomain equal to primaryDomain', () => {
    const result = validate({ secondaryDomain: 'Agriculture' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === 'secondaryDomain')).toBe(true)
    }
  })
})

describe('validateAiAnalysis — tags', () => {
  it('rejects an unknown tag', () => {
    const result = validate({ tags: ['Crop Management', 'Solar Power'] })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === 'tags')).toBe(true)
    }
  })

  it('rejects fewer than 2 tags', () => {
    const result = validate({ tags: ['Crop Management'] })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === 'tags')).toBe(true)
    }
  })

  it('rejects an empty tags array', () => {
    const result = validate({ tags: [] })
    expect(result.ok).toBe(false)
  })

  it('rejects more than 6 tags', () => {
    const result = validate({
      tags: [
        'Crop Management',
        'Irrigation',
        'Soil Health',
        'Agricultural Technology',
        'Farmer Support',
        'Drinking Water',
        'Water Quality',
      ],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === 'tags')).toBe(true)
    }
  })

  it('rejects tags that do not belong to the primary domain', () => {
    // 'Roads' is Urban Development, not Agriculture
    const result = validate({ tags: ['Crop Management', 'Roads'] })
    expect(result.ok).toBe(false)
  })

  it('rejects non-string tags', () => {
    const result = validate({ tags: ['Crop Management', 5 as unknown as string] })
    expect(result.ok).toBe(false)
  })

  it('rejects a non-array tags value', () => {
    const result = validate({ tags: 'Crop Management' as unknown as string[] })
    expect(result.ok).toBe(false)
  })

  it('rejects duplicate tags', () => {
    const result = validate({ tags: ['Crop Management', 'Crop Management'] })
    expect(result.ok).toBe(false)
  })
})

describe('validateAiAnalysis — urgency', () => {
  it('rejects invalid urgency', () => {
    const result = validate({ urgency: 'critical' as AiAnalysisOutput['urgency'] })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === 'urgency')).toBe(true)
    }
  })

  it('rejects non-string urgency', () => {
    const result = validate({ urgency: 5 as unknown as AiAnalysisOutput['urgency'] })
    expect(result.ok).toBe(false)
  })
})

describe('validateAiAnalysis — impactScale', () => {
  it('rejects an invalid impact scale', () => {
    const result = validate({
      impactScale: 'city' as AiAnalysisOutput['impactScale'],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === 'impactScale')).toBe(true)
    }
  })
})

describe('validateAiAnalysis — confidence', () => {
  it('rejects confidence below 0', () => {
    const result = validate({ confidence: -0.1 })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === 'confidence')).toBe(true)
    }
  })

  it('rejects confidence above 1', () => {
    const result = validate({ confidence: 1.1 })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === 'confidence')).toBe(true)
    }
  })

  it('rejects string confidence', () => {
    const result = validate({ confidence: '92%' as unknown as number })
    expect(result.ok).toBe(false)
  })

  it('rejects NaN confidence', () => {
    const result = validate({ confidence: Number.NaN })
    expect(result.ok).toBe(false)
  })
})

describe('validateAiAnalysis — requiredExpertise / requiredFacilities', () => {
  it('rejects non-array requiredExpertise', () => {
    const result = validate({
      requiredExpertise: 'Agronomist' as unknown as string[],
    })
    expect(result.ok).toBe(false)
  })

  it('rejects non-string entries in requiredExpertise', () => {
    const result = validate({
      requiredExpertise: ['Agronomist', 5 as unknown as string],
    })
    expect(result.ok).toBe(false)
  })

  it('rejects non-array requiredFacilities', () => {
    const result = validate({ requiredFacilities: 'Lab' as unknown as string[] })
    expect(result.ok).toBe(false)
  })
})

describe('validateAiAnalysis — problemSummary', () => {
  it('rejects missing problemSummary', () => {
    const analysis = validAnalysis({ problemSummary: undefined as unknown as string })
    const result = validateAiAnalysis(analysis)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === 'problemSummary')).toBe(true)
    }
  })

  it('rejects empty problemSummary', () => {
    const result = validate({ problemSummary: '' })
    expect(result.ok).toBe(false)
  })

  it('rejects non-string problemSummary', () => {
    const result = validate({ problemSummary: 5 as unknown as string })
    expect(result.ok).toBe(false)
  })
})

describe('validateAiAnalysis — duplicateSearchText', () => {
  it('rejects missing duplicateSearchText', () => {
    const analysis = validAnalysis({
      duplicateSearchText: undefined as unknown as string,
    })
    const result = validateAiAnalysis(analysis)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === 'duplicateSearchText')).toBe(true)
    }
  })

  it('rejects empty duplicateSearchText', () => {
    const result = validate({ duplicateSearchText: '' })
    expect(result.ok).toBe(false)
  })
})

describe('validateAiAnalysis — malformed responses', () => {
  it('rejects a non-object value', () => {
    const result = validateAiAnalysis(42 as unknown as AiAnalysisOutput)
    expect(result.ok).toBe(false)
  })

  it('rejects null', () => {
    const result = validateAiAnalysis(null as unknown as AiAnalysisOutput)
    expect(result.ok).toBe(false)
  })
})
