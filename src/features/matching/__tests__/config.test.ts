import { describe, it, expect } from 'vitest'

import { JHARKHAND_REGIONS, districtRegion } from '../config'
import { JHARKHAND_DISTRICTS } from '@/lib/districts'

describe('JHARKHAND_REGIONS — coverage of the controlled district list', () => {
  it('covers every district the citizen can select for a challenge', () => {
    const unresolved = JHARKHAND_DISTRICTS.filter((d) => districtRegion(d) === null)
    expect(unresolved).toEqual([])
  })

  it('covers the university dataset districts', () => {
    const datasetDistricts = [
      'Dhanbad',
      'East Singhbhum',
      'Palamu',
      'Ranchi',
      'West Singhbhum',
    ]
    for (const d of datasetDistricts) {
      expect(districtRegion(d), `district "${d}" should resolve`).not.toBeNull()
    }
  })

  it('resolves the space vs hyphen spelling of Seraikela consistently', () => {
    expect(districtRegion('Seraikela Kharsawan')).toBe('South')
    expect(districtRegion('Seraikela-Kharsawan')).toBe('South')
  })

  it('includes the four formerly-unmapped districts', () => {
    expect(JHARKHAND_REGIONS.Chotanagpur).toContain('Chatra')
    expect(JHARKHAND_REGIONS.Chotanagpur).toContain('Hazaribagh')
    expect(JHARKHAND_REGIONS.Chotanagpur).toContain('Koderma')
    expect(JHARKHAND_REGIONS.Chotanagpur).toContain('Ramgarh')
  })

  it('returns null for a district outside Jharkhand', () => {
    expect(districtRegion('Mumbai')).toBeNull()
  })

  it('returns null for an unknown district value', () => {
    expect(districtRegion('unknown')).toBeNull()
  })
})