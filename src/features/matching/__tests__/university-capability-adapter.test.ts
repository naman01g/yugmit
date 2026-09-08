import { describe, expect, it } from 'vitest'
import { UNIVERSITIES } from '@/data/universities'
import { adaptUniversityCapabilities, adaptUniversityCapabilitiesForScoring } from '../university-capability-adapter'

describe('evidence-backed university capability adapter', () => {
  const bit = UNIVERSITIES.find((profile) => profile.id === 'bit-mesra')!

  it('leaves the canonical profile untouched while exposing explicit taxonomy tags to scorer expertise', () => {
    const before = [...bit.expertise]
    const adapted = adaptUniversityCapabilities(bit)
    expect(bit.expertise).toEqual(before)
    expect(bit.expertise).not.toContain('Water Quality')
    expect(adapted.expertise).toContain('Water Quality')
  })

  it('does not infer facilities, projects, or student capabilities from taxonomy metadata', () => {
    const adapted = adaptUniversityCapabilities(bit)
    expect(adapted.facilities).toEqual(bit.facilities)
    expect(adapted.previousProjects).toEqual(bit.previousProjects)
    expect(adapted.studentCapabilities).toEqual(bit.studentCapabilities)
    expect(adapted.facilities).not.toContain('Water Testing Lab')
    expect(adapted.studentCapabilities).not.toContain('Water Quality Testing')
  })

  it('applies one uniform adapter to every profile without university-specific branches', () => {
    const adapted = adaptUniversityCapabilitiesForScoring(UNIVERSITIES)
    expect(adapted).toHaveLength(UNIVERSITIES.length)
    for (const profile of adapted) {
      for (const tag of profile.taxonomyMappings) expect(profile.expertise).toContain(tag)
    }
  })
})
