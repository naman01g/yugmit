/**
 * TEST FIXTURES — NOT verified real university data.
 *
 * These are typed fixtures used ONLY by the matching engine unit tests to
 * exercise the deterministic algorithm. They must NOT be presented as,
 * or mistaken for, verified real university capabilities. The real seed
 * dataset is owned by a separate agent (see TASKS.md §4) and satisfies the
 * same UniversityProfile interface.
 */
import type {
  ChallengeInput,
  UniversityProfile,
} from '../types'

export function makeChallenge(overrides: Partial<ChallengeInput> = {}): ChallengeInput {
  return {
    challengeId: 'challenge-test-1',
    primaryDomain: 'Water Management',
    secondaryDomain: 'Environment',
    tags: ['Water Quality', 'Water Supply'],
    requiredExpertise: ['Hydrology', 'water quality testing'],
    requiredFacilities: ['Water Testing Lab'],
    location: { district: 'Ranchi' },
    ...overrides,
  }
}

export const waterUniversity: UniversityProfile = {
  id: 'uni-water',
  name: 'Test Water Institute',
  type: 'university',
  district: 'Ranchi',
  region: 'Chotanagpur',
  domains: ['Water Management', 'Environment'],
  expertise: ['Hydrology', 'Water Quality', 'Water Supply'],
  facilities: ['Water Testing Lab', 'Environmental Lab'],
  previousProjects: [
    'Water Quality monitoring project in Jharkhand',
    'drinking Water Supply improvement program',
  ],
  studentCapabilities: ['Hydrology', 'Water Quality', 'Environmental Science'],
  innovationCapability: 'high',
  capacity: 4,
  taxonomyMappings: ['D04', 'D05'],
  sourceUrls: ['https://example.test/water-uni'],
}

export const agricultureUniversity: UniversityProfile = {
  id: 'uni-agri',
  name: 'Test Agriculture Institute',
  type: 'university',
  district: 'Bokaro',
  region: 'Santhal',
  domains: ['Agriculture', 'Rural Livelihoods'],
  expertise: ['Crop Management', 'Soil Health', 'Irrigation'],
  facilities: ['Soil Lab', 'Agri Field Station'],
  previousProjects: ['Soil Health improvement scheme', 'Crop yield study'],
  studentCapabilities: ['Agronomy', 'Soil Science', 'Crop Management'],
  innovationCapability: 'medium',
  capacity: 3,
  taxonomyMappings: ['D02', 'D10'],
  sourceUrls: ['https://example.test/agri-uni'],
}

export const outsideUniversity: UniversityProfile = {
  id: 'uni-outside',
  name: 'Test Outside University',
  type: 'university',
  district: 'Mumbai',
  region: 'Mumbai',
  domains: ['Water Management'],
  expertise: ['Hydrology'],
  facilities: ['Water Testing Lab'],
  previousProjects: [],
  studentCapabilities: ['Hydrology'],
  innovationCapability: 'low',
  capacity: 2,
  taxonomyMappings: ['D04'],
  sourceUrls: ['https://example.test/outside-uni'],
}

export const unknownUniversity: UniversityProfile = {
  id: 'uni-unknown',
  name: 'Test Unknown Uni',
  type: 'university',
  district: 'unknown',
  region: 'unknown',
  domains: ['unknown'],
  expertise: ['unknown'],
  facilities: ['unknown'],
  previousProjects: ['unknown'],
  studentCapabilities: ['unknown'],
  innovationCapability: 'unknown',
  capacity: 0,
  taxonomyMappings: [],
  sourceUrls: [],
}
