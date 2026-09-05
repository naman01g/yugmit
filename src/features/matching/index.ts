/**
 * University Matching Engine — public API.
 */
export * from './types'
export {
  ALGORITHM_VERSION,
  DEFAULT_WEIGHTS,
  FACTOR_KEYS,
  JHARKHAND_REGIONS,
  LOCATION_SCORE,
  PROJECT_RELEVANCE_SCALE,
  NO_FACILITY_MATCH,
  districtRegion,
} from './config'
export * from './normalize'
export {
  computeFactors,
  finalScore,
  scoreAndRank,
  validateWeights,
} from './score'
export * from './factors'
export { buildExplanation } from './explanations'
export { createMatchDocument, runMatchingEngine, MIN_MEANINGFUL_SCORE } from './match'
export { matchDocumentId, persistMatches, writeMatchDocument } from './firestore'
