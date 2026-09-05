/**
 * Module 09 security contract — the single source of truth for which proposal
 * statuses the government analytics layer is permitted to aggregate.
 *
 * Must stay in lock-step with the `proposals` read rule in `firestore.rules`,
 * which grants government read access only to submitted / government_review
 * proposals (drafts are private to the owning team).
 */

import type { ProposalStatus } from '@/types/proposal'

/**
 * Proposal statuses visible to government analytics.
 * Exactly mirrors the government read rule in firestore.rules.
 */
export const GOVERNMENT_VISIBLE_PROPOSAL_STATUSES: ProposalStatus[] = [
  'submitted',
  'government_review',
]

export function aggregatedProposalStatuses(): ProposalStatus[] {
  return [...GOVERNMENT_VISIBLE_PROPOSAL_STATUSES]
}
