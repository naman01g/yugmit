/**
 * Matching engine configuration.
 *
 * This is the single source of truth for the five locked factors and their
 * default weights. Weights are configurable here (admin-tunable) rather than
 * scattered as magic numbers, but the V1 defaults are locked exactly as
 * specified in AI_ENGINE.md / PROJECT_RULES.md.
 *
 * Default weights are NOT editable by ordinary users from the UI.
 */
import type { MatchingWeights } from './types'

export const ALGORITHM_VERSION = 'v1.0'

/**
 * Default locked weights. Do not change these values without explicit approval.
 */
export const DEFAULT_WEIGHTS: MatchingWeights = {
  expertise: 0.35,
  facilities: 0.25,
  previousProjects: 0.15,
  studentCapability: 0.15,
  location: 0.10,
}

/**
 * The five factor keys, in the canonical order used for explanation, ranking
 * and document generation. Keep stable to preserve determinism.
 */
export const FACTOR_KEYS = [
  'expertise',
  'facilities',
  'previousProjects',
  'studentCapability',
  'location',
] as const

/**
 * Locked fallback scores / constants used by the factor formulas.
 */
export const FACILITY_FALLBACK = 70 // no required facilities
export const STUDENT_FALLBACK = 70 // no required student skills
export const NO_FACILITY_MATCH = 0

/**
 * Previous-project relevance scale (from seeded dataset, never from Gemini).
 */
export const PROJECT_RELEVANCE_SCALE = {
  none: 0,
  weak: 25,
  related: 50,
  strong: 75,
  direct: 100,
} as const

/**
 * Location scoring values.
 */
export const LOCATION_SCORE = {
  sameDistrict: 100,
  differentDistrictSameRegion: 80,
  elsewhereInJharkhand: 70,
  outsideJharkhand: 50,
} as const

/**
 * Jharkhand districts grouped by region.
 *
 * The V1 use case is Jharkhand. "Different district, same region" resolves
 * against this mapping. Must cover every district exposed in
 * `src/lib/districts.ts` (the controlled citizen-facing list). Districts not
 * listed here are treated as outside the known mapping and scored
 * deterministically (see `mapDistrictToRegion`).
 */
export const JHARKHAND_REGIONS: Record<string, string[]> = {
  North: ['Dumka', 'Godda', 'Pakur', 'Sahebganj', 'Deoghar'],
  Chotanagpur: [
    'Ranchi',
    'Lohardaga',
    'Gumla',
    'Simdega',
    'Khunti',
    'Latehar',
    'Chatra',
    'Hazaribagh',
    'Koderma',
    'Ramgarh',
  ],
  South: [
    'East Singhbhum',
    'West Singhbhum',
    'Seraikela Kharsawan',
    'Seraikela-Kharsawan',
    'Palamu',
    'Garhwa',
  ],
  Santhal: ['Jamtara', 'Giridih', 'Bokaro', 'Dhanbad'],
}

/**
 * Returns the region name for a district, or null if the district is unknown.
 * Normalization is applied so casing/punctuation differences do not break
 * region resolution.
 */
export function districtRegion(district: string): string | null {
  const key = normalizeDistrict(district)
  for (const [region, districts] of Object.entries(JHARKHAND_REGIONS)) {
    for (const d of districts) {
      const normalized = normalizeDistrict(d)
      if (normalized === key || normalized.replace(/-/g, ' ') === key.replace(/-/g, ' ')) {
        return region
      }
    }
  }
  return null
}

/**
 * Normalizes a district name for region lookup: trims, lowercases and
 * collapses internal whitespace. Hyphens are kept so they can be compared
 * hyphen-insensitively by `districtRegion`.
 */
function normalizeDistrict(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ').replace(/-/g, '-')
}
