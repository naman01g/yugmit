/**
 * Evidence-backed adapter between canonical university profiles and the locked
 * matching-engine input. `taxonomyMappings` is verified, controlled capability
 * metadata in the canonical dataset. The scorer's tag signal reads expertise,
 * so the adapter exposes those explicit mappings there without changing any
 * scoring function, formula, threshold, or profile stored in Firestore.
 *
 * Deliberately excluded: facilities, projects, and student capabilities.
 * Their values remain literal evidence claims because broad instrumentation,
 * adjacent projects, or department-level skills do not prove an exact
 * operational capability such as water testing or public health.
 */
import type { UniversityProfile } from './types'

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

export function adaptUniversityCapabilities(
  profile: UniversityProfile,
): UniversityProfile {
  return {
    ...profile,
    domains: [...profile.domains],
    expertise: unique([...profile.expertise, ...profile.taxonomyMappings]),
    facilities: [...profile.facilities],
    previousProjects: [...profile.previousProjects],
    studentCapabilities: [...profile.studentCapabilities],
    taxonomyMappings: [...profile.taxonomyMappings],
    sourceUrls: [...profile.sourceUrls],
  }
}

export function adaptUniversityCapabilitiesForScoring(
  profiles: UniversityProfile[],
): UniversityProfile[] {
  return profiles.map(adaptUniversityCapabilities)
}
