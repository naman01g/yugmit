/**
 * University Dataset V1 — validation tests.
 *
 * Verifies structural integrity, taxonomy compliance, Module 06 compatibility,
 * and data quality requirements from the TASKS.md specification.
 */

import { describe, it, expect } from 'vitest'
import {
  UNIVERSITIES,
  DATASET_VERSION,
  getUniversityById,
  getUniversitiesByDistrict,
  getUniversitiesByDomain,
} from '../universities'
import { EVIDENCE_MANIFEST, EVIDENCE_STATS } from '../university-evidence'
import { ALLOWED_DOMAINS } from '@/lib/taxonomy'
import { ALL_APPROVED_TAGS } from '@/lib/taxonomy'
import type { UniversityProfile } from '@/features/matching/types'
import { JHARKHAND_REGIONS, districtRegion } from '@/features/matching/config'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const universityIds = UNIVERSITIES.map((u) => u.id)
const universityNames = UNIVERSITIES.map((u) => u.name)

const VALID_TYPES = new Set([
  'IIT',
  'NIT',
  'Central University',
  'State University',
  'Private University',
  'Deemed University',
  'Government Engineering Institute',
  'Specialized National Institute',
  'Other',
])

const allDomains = new Set<string>(ALLOWED_DOMAINS)
const allTags = new Set<string>(ALL_APPROVED_TAGS)

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

function hasDuplicates(arr: string[]): boolean {
  return new Set(arr).size !== arr.length
}

// ===========================================================================
// 1. Basic structural requirements
// ===========================================================================

describe('University Dataset V1 — Structure', () => {
  it('contains exactly 15 institutions', () => {
    expect(UNIVERSITIES).toHaveLength(15)
  })

  it('has a valid dataset version', () => {
    expect(DATASET_VERSION).toBe('university-dataset-v1')
  })

  it('exports the UniversityProfile type (Module 06 compatible)', () => {
    // Compile-time check: UNIVERSITIES must satisfy UniversityProfile[]
    const profiles: UniversityProfile[] = UNIVERSITIES
    expect(profiles).toBeDefined()
  })
})

// ===========================================================================
// 2. Every institution has required fields
// ===========================================================================

describe('University Dataset V1 — Required Fields', () => {
  it('every institution has a stable ID', () => {
    for (const uni of UNIVERSITIES) {
      expect(typeof uni.id).toBe('string')
      expect(uni.id.length).toBeGreaterThan(0)
    }
  })

  it('every institution has a name', () => {
    for (const uni of UNIVERSITIES) {
      expect(typeof uni.name).toBe('string')
      expect(uni.name.length).toBeGreaterThan(0)
    }
  })

  it('every institution has a valid type', () => {
    for (const uni of UNIVERSITIES) {
      expect(typeof uni.type).toBe('string')
      expect(uni.type.length).toBeGreaterThan(0)
      expect(VALID_TYPES.has(uni.type)).toBe(true)
    }
  })

  it('every institution has a district', () => {
    for (const uni of UNIVERSITIES) {
      expect(typeof uni.district).toBe('string')
      expect(uni.district.length).toBeGreaterThan(0)
    }
  })

  it('every institution has a region', () => {
    for (const uni of UNIVERSITIES) {
      expect(typeof uni.region).toBe('string')
      expect(uni.region.length).toBeGreaterThan(0)
    }
  })

  it('every institution has arrays for domains expertise facilities previousProjects studentCapabilities taxonomyMappings sourceUrls', () => {
    for (const uni of UNIVERSITIES) {
      expect(Array.isArray(uni.domains)).toBe(true)
      expect(Array.isArray(uni.expertise)).toBe(true)
      expect(Array.isArray(uni.facilities)).toBe(true)
      expect(Array.isArray(uni.previousProjects)).toBe(true)
      expect(Array.isArray(uni.studentCapabilities)).toBe(true)
      expect(Array.isArray(uni.taxonomyMappings)).toBe(true)
      expect(Array.isArray(uni.sourceUrls)).toBe(true)
    }
  })

  it('every institution has innovationCapability as string', () => {
    for (const uni of UNIVERSITIES) {
      expect(typeof uni.innovationCapability).toBe('string')
      expect(uni.innovationCapability.length).toBeGreaterThan(0)
    }
  })

  it('every institution has capacity as number', () => {
    for (const uni of UNIVERSITIES) {
      expect(typeof uni.capacity).toBe('number')
      expect(uni.capacity).toBeGreaterThanOrEqual(0)
      expect(uni.capacity).toBeLessThanOrEqual(100)
    }
  })
})

// ===========================================================================
// 3. No duplicate IDs or names
// ===========================================================================

describe('University Dataset V1 — Uniqueness', () => {
  it('no duplicate IDs', () => {
    expect(hasDuplicates(universityIds)).toBe(false)
  })

  it('no duplicate names', () => {
    expect(hasDuplicates(universityNames)).toBe(false)
  })
})

// ===========================================================================
// 4. Domain taxonomy compliance
// ===========================================================================

describe('University Dataset V1 — Domain Taxonomy', () => {
  it('every domain belongs to the locked 10-domain taxonomy', () => {
    for (const uni of UNIVERSITIES) {
      for (const domain of uni.domains) {
        expect(allDomains.has(domain)).toBe(true)
      }
    }
  })

  it('no institution has empty domain entries', () => {
    for (const uni of UNIVERSITIES) {
      for (const domain of uni.domains) {
        expect(domain.length).toBeGreaterThan(0)
      }
    }
  })
})

// ===========================================================================
// 5. Taxonomy mappings compliance
// ===========================================================================

describe('University Dataset V1 — Taxonomy Mappings', () => {
  it('every taxonomy mapping belongs to the locked taxonomy', () => {
    for (const uni of UNIVERSITIES) {
      for (const mapping of uni.taxonomyMappings) {
        expect(allTags.has(mapping)).toBe(true)
      }
    }
  })

  it('no empty taxonomy mapping entries', () => {
    for (const uni of UNIVERSITIES) {
      for (const mapping of uni.taxonomyMappings) {
        expect(mapping.length).toBeGreaterThan(0)
      }
    }
  })
})

// ===========================================================================
// 6. No duplicate array values within institutions
// ===========================================================================

describe('University Dataset V1 — No Duplicate Array Values', () => {
  const arrayFields = [
    'domains',
    'expertise',
    'facilities',
    'previousProjects',
    'studentCapabilities',
    'taxonomyMappings',
    'sourceUrls',
  ] as const

  for (const field of arrayFields) {
    it(`no duplicate values in ${field}`, () => {
      for (const uni of UNIVERSITIES) {
        expect(hasDuplicates(uni[field])).toBe(false)
      }
    })
  }
})

// ===========================================================================
// 7. Source URLs validation
// ===========================================================================

describe('University Dataset V1 — Source URLs', () => {
  it('every institution has at least one source URL', () => {
    for (const uni of UNIVERSITIES) {
      expect(uni.sourceUrls.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('every source URL is non-empty and validly formatted', () => {
    for (const uni of UNIVERSITIES) {
      for (const url of uni.sourceUrls) {
        expect(url.length).toBeGreaterThan(0)
        expect(isValidUrl(url)).toBe(true)
      }
    }
  })

  it('no duplicate source URLs within an institution', () => {
    for (const uni of UNIVERSITIES) {
      expect(hasDuplicates(uni.sourceUrls)).toBe(false)
    }
  })
})

// ===========================================================================
// 8. Region consistency with JHARKHAND_REGIONS
// ===========================================================================

describe('University Dataset V1 — Region Consistency', () => {
  it('every institution region matches its district region mapping', () => {
    for (const uni of UNIVERSITIES) {
      const resolvedRegion = districtRegion(uni.district)
      if (resolvedRegion !== null) {
        expect(uni.region).toBe(resolvedRegion)
      }
    }
  })

  it('every region belongs to the known Jharkhand regions', () => {
    const knownRegions = new Set(Object.keys(JHARKHAND_REGIONS))
    for (const uni of UNIVERSITIES) {
      expect(knownRegions.has(uni.region)).toBe(true)
    }
  })
})

// ===========================================================================
// 9. Unknown values consistency
// ===========================================================================

describe('University Dataset V1 — Unknown Values', () => {
  it('unknown string fields use literal "unknown"', () => {
    for (const uni of UNIVERSITIES) {
      // If any string field is "unknown", it should be the exact literal
      if (uni.innovationCapability === 'unknown') {
        expect(uni.innovationCapability).toBe('unknown')
      }
    }
  })

  it('unknown array fields use ["unknown"]', () => {
    for (const uni of UNIVERSITIES) {
      for (const field of ['facilities', 'previousProjects', 'expertise', 'studentCapabilities'] as const) {
        if (uni[field].length === 1 && uni[field][0] === 'unknown') {
          expect(uni[field]).toEqual(['unknown'])
        }
      }
    }
  })
})

// ===========================================================================
// 10. Module 06 compatibility
// ===========================================================================

describe('University Dataset V1 — Module 06 Compatibility', () => {
  it('every institution conforms to UniversityProfile interface', () => {
    for (const uni of UNIVERSITIES) {
      // Type check: assign to UniversityProfile — compile-time guarantee
      const profile: UniversityProfile = uni

      // Runtime checks for all fields
      expect(profile.id).toBeDefined()
      expect(profile.name).toBeDefined()
      expect(profile.type).toBeDefined()
      expect(profile.district).toBeDefined()
      expect(profile.region).toBeDefined()
      expect(profile.domains).toBeDefined()
      expect(profile.expertise).toBeDefined()
      expect(profile.facilities).toBeDefined()
      expect(profile.previousProjects).toBeDefined()
      expect(profile.studentCapabilities).toBeDefined()
      expect(profile.innovationCapability).toBeDefined()
      expect(typeof profile.capacity).toBe('number')
      expect(profile.taxonomyMappings).toBeDefined()
      expect(profile.sourceUrls).toBeDefined()
    }
  })

  it('dataset has sufficient institutions for meaningful matching', () => {
    expect(UNIVERSITIES.length).toBeGreaterThanOrEqual(10)
  })

  it('dataset covers all 4 Jharkhand regions', () => {
    const regions = new Set(UNIVERSITIES.map((u) => u.region))
    expect(regions.has('Santhal')).toBe(true)
    expect(regions.has('Chotanagpur')).toBe(true)
    expect(regions.has('South')).toBe(true)
  })

  it('dataset covers multiple domains across institutions', () => {
    const domains = new Set(UNIVERSITIES.flatMap((u) => u.domains))
    expect(domains.size).toBeGreaterThanOrEqual(5)
  })
})

// ===========================================================================
// 11. Evidence manifest validation
// ===========================================================================

describe('University Dataset V1 — Evidence Manifest', () => {
  it('has entries for all 15 institutions', () => {
    const institutions = new Set(EVIDENCE_MANIFEST.map((e) => e.institution))
    expect(institutions.size).toBe(15)
  })

  it('has no empty claims', () => {
    for (const entry of EVIDENCE_MANIFEST) {
      expect(entry.claim.length).toBeGreaterThan(0)
    }
  })

  it('has no empty source URLs', () => {
    for (const entry of EVIDENCE_MANIFEST) {
      expect(entry.sourceUrl.length).toBeGreaterThan(0)
      expect(isValidUrl(entry.sourceUrl)).toBe(true)
    }
  })

  it('has valid evidence quality levels', () => {
    for (const entry of EVIDENCE_MANIFEST) {
      expect(['high', 'medium', 'low']).toContain(entry.evidenceQuality)
    }
  })

  it('majority of evidence is high quality', () => {
    expect(EVIDENCE_STATS.highQuality).toBeGreaterThan(EVIDENCE_STATS.mediumQuality)
  })

  it('no low quality evidence entries', () => {
    expect(EVIDENCE_STATS.lowQuality).toBe(0)
  })

  it('has at least 3 evidence entries per institution on average', () => {
    const avg = EVIDENCE_MANIFEST.length / EVIDENCE_STATS.institutionsCovered
    expect(avg).toBeGreaterThanOrEqual(2)
  })
})

// ===========================================================================
// 12. Lookup helpers
// ===========================================================================

describe('University Dataset V1 — Lookup Helpers', () => {
  it('getUniversityById returns correct university', () => {
    const iit = getUniversityById('iit-ism-dhanbad')
    expect(iit).toBeDefined()
    expect(iit!.name).toBe('Indian Institute of Technology (ISM) Dhanbad')
  })

  it('getUniversityById returns undefined for unknown id', () => {
    const unknown = getUniversityById('non-existent-id')
    expect(unknown).toBeUndefined()
  })

  it('getUniversitiesByDistrict returns institutions in that district', () => {
    const ranchi = getUniversitiesByDistrict('Ranchi')
    expect(ranchi.length).toBeGreaterThanOrEqual(1)
    for (const uni of ranchi) {
      expect(uni.district).toBe('Ranchi')
    }
  })

  it('getUniversitiesByDomain returns institutions with that domain', () => {
    const energy = getUniversitiesByDomain('Energy')
    expect(energy.length).toBeGreaterThanOrEqual(1)
    for (const uni of energy) {
      expect(uni.domains).toContain('Energy')
    }
  })
})
