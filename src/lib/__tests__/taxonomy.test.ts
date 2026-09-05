import { describe, expect, it } from 'vitest'

import {
  ALL_APPROVED_TAGS,
  ALLOWED_DOMAINS,
  TAGS_BY_DOMAIN,
  isApprovedTag,
  isDomain,
  isImpactScale,
  isTagForDomain,
  isUrgency,
} from '../taxonomy'

describe('taxonomy — domains', () => {
  it('contains exactly the 10 approved domains', () => {
    expect(ALLOWED_DOMAINS).toHaveLength(10)
    expect(ALLOWED_DOMAINS).toEqual(
      expect.arrayContaining([
        'Education',
        'Agriculture',
        'Healthcare',
        'Water Management',
        'Environment',
        'Energy',
        'Urban Development',
        'Accessibility',
        'Public Administration',
        'Rural Livelihoods',
      ]),
    )
  })

  it('recognizes approved domains', () => {
    for (const d of ALLOWED_DOMAINS) {
      expect(isDomain(d)).toBe(true)
    }
  })

  it('rejects invented domains', () => {
    expect(isDomain('Rural Infrastructure')).toBe(false)
    expect(isDomain('Technology')).toBe(false)
  })
})

describe('taxonomy — tags', () => {
  it('contains no empty tag lists', () => {
    for (const domain of ALLOWED_DOMAINS) {
      expect(TAGS_BY_DOMAIN[domain].length).toBeGreaterThan(0)
    }
  })

  it('recognizes approved tags', () => {
    expect(isApprovedTag('Crop Management')).toBe(true)
    expect(isApprovedTag('Drinking Water')).toBe(true)
  })

  it('rejects invented tags', () => {
    expect(isApprovedTag('Solar Panels')).toBe(false)
    expect(isApprovedTag('Rural Roads')).toBe(false)
  })

  it('links tags to their owning domain', () => {
    expect(isTagForDomain('Agriculture', 'Irrigation')).toBe(true)
    expect(isTagForDomain('Urban Development', 'Drainage')).toBe(true)
  })

  it('rejects a tag not belonging to the domain', () => {
    expect(isTagForDomain('Agriculture', 'Roads')).toBe(false)
  })

  it('allows a tag to be shared across domains (e.g. Irrigation)', () => {
    // "Irrigation" legitimately appears in both Agriculture and Water Management.
    const count = ALL_APPROVED_TAGS.filter((t) => t === 'Irrigation').length
    expect(count).toBeGreaterThan(1)
    const unique = new Set(ALL_APPROVED_TAGS)
    expect(unique.size).toBeLessThan(ALL_APPROVED_TAGS.length)
  })
})

describe('taxonomy — urgency', () => {
  it('accepts only low, medium, high', () => {
    expect(isUrgency('low')).toBe(true)
    expect(isUrgency('medium')).toBe(true)
    expect(isUrgency('high')).toBe(true)
    expect(isUrgency('critical')).toBe(false)
  })
})

describe('taxonomy — impact scale', () => {
  it('accepts the 5 allowed scales, rejects numeric values', () => {
    for (const s of [
      'individual',
      'household',
      'neighborhood',
      'village_ward',
      'district',
    ]) {
      expect(isImpactScale(s)).toBe(true)
    }
    expect(isImpactScale('city')).toBe(false)
    expect(isImpactScale('2500')).toBe(false)
  })
})
