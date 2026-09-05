/**
 * University dataset — public API.
 *
 * Re-exports the canonical dataset, evidence manifest, and lookup helpers
 * for use by the application shell and matching engine.
 */
export { UNIVERSITIES, DATASET_VERSION, DATASET_DATE, DATASET_METHOD } from './universities'
export { getUniversityById, getUniversitiesByDistrict, getUniversitiesByDomain } from './universities'
export { EVIDENCE_MANIFEST, EVIDENCE_STATS } from './university-evidence'
export type { EvidenceEntry } from './university-evidence'
