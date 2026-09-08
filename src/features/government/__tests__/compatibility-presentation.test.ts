import { describe, expect, it } from 'vitest'
import {
  compatibilityLabel,
  compatibilityState,
  prepareCompatibilityView,
} from '../compatibility-presentation'
import type { UniversityCompatibility } from '@/lib/university-matching-service'

function item(id: string, score: number): UniversityCompatibility {
  return {
    university: { id, name: id, district: 'Ranchi' },
    score,
    rank: 1,
    factors: { expertise: score, facilities: score, previousProjects: score, studentCapability: score, location: score },
  }
}

describe('Government compatibility presentation', () => {
  it('keeps every scored university, including below-threshold entries, in descending order', () => {
    const view = prepareCompatibilityView([item('low', 12), item('strong', 86.5), item('moderate', 40)])
    expect(view.universities.map((entry) => entry.university.id)).toEqual(['strong', 'moderate', 'low'])
    expect(view.universities).toHaveLength(3)
  })

  it('classifies deterministic final-score boundaries exactly', () => {
    expect(compatibilityState(80)).toBe('strong')
    expect(compatibilityState(79.9)).toBe('moderate')
    expect(compatibilityState(40)).toBe('moderate')
    expect(compatibilityState(39.9)).toBe('low')
    expect(compatibilityLabel('strong')).toBe('Strong compatibility')
  })

  it('calculates summary counts dynamically and supports an empty dataset', () => {
    expect(prepareCompatibilityView([item('a', 90), item('b', 60), item('c', 10)]).counts)
      .toEqual({ strong: 1, moderate: 1, low: 1 })
    expect(prepareCompatibilityView([])).toEqual({ universities: [], counts: { strong: 0, moderate: 0, low: 0 } })
  })
})
