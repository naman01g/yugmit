/**
 * Solution Proposal Firestore service — Module 08
 *
 * Provides draft, submit, read, and government-review operations for the
 * `proposals` collection.
 *
 * Enforces the Module 08 gates at the service layer:
 *  - Only members/faculty of an ACTIVE team may create/edit/submit its proposal.
 *  - Team must belong to the challenge, and its university must match the
 *    challenge's assigned university.
 *  - Identity fields (teamId/challengeId/universityId) are immutable.
 *  - A submitted proposal cannot be edited through the normal team write path.
 *  - Government reviews via separate review metadata, not by rewriting content.
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore'

import { db as firebaseDb, isFirebaseConfigured } from '@/lib/firebase'
import type { Proposal, ProposalStatus, ProposalContent } from '@/types/proposal'
import {
  validateProposalContent,
  validateProposalSubmission,
  proposalDocumentId,
  evaluateProposalAuthorization,
} from '@/lib/proposal-validator'
import type { Challenge } from '@/types/challenge'

export interface ProposalServiceError {
  code: string
  message: string
}

function requireDb(): NonNullable<typeof firebaseDb> {
  if (!firebaseDb || !isFirebaseConfigured) {
    throw {
      code: 'firebase/not-configured',
      message: 'Firebase is not configured.',
    } satisfies ProposalServiceError
  }
  return firebaseDb
}

function toProposalDocId(teamId: string): string {
  return proposalDocumentId(teamId)
}

interface LoadedContext {
  team: { status: string; challengeId: string; universityId: string; facultyLeadId: string; memberIds: string[] } | null
  challenge: Challenge | null
}

async function loadContext(db: ReturnType<typeof requireDb>, teamId: string, challengeId: string): Promise<LoadedContext> {
  const teamRef = doc(db, 'teams', teamId)
  const teamSnap = await getDoc(teamRef)
  let team: LoadedContext['team'] = null
  if (teamSnap.exists()) {
    const d = teamSnap.data()
    team = {
      status: d.status as string,
      challengeId: d.challengeId as string,
      universityId: d.universityId as string,
      facultyLeadId: d.facultyLeadId as string,
      memberIds: (d.memberIds as string[]) ?? [],
    }
  }

  const challengeRef = doc(db, 'challenges', challengeId)
  const challengeSnap = await getDoc(challengeRef)
  let challenge: Challenge | null = null
  if (challengeSnap.exists()) {
    const d = challengeSnap.data()
    challenge = {
      ...(d as Challenge),
      id: challengeSnap.id,
      createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toMillis() : (d.createdAt as number),
      updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toMillis() : (d.updatedAt as number),
    }
  }

  return { team, challenge }
}

/**
 * Core authorization gate. Verifies:
 *  1. team exists and is active
 *  2. user is faculty lead or an accepted member
 *  3. team belongs to the given challenge
 *  4. team's university matches the challenge's assigned university
 *
 * Delegates to the pure `evaluateProposalAuthorization` so the exact same
 * boundary is unit-tested and enforced.
 */
function assertCanAuthorProposal(
  ctx: LoadedContext,
  params: { teamId: string; challengeId: string; universityId: string; uid: string },
  errorFactory: (code: string, message: string) => never,
): NonNullable<LoadedContext['team']> {
  const decision = evaluateProposalAuthorization({
    team: ctx.team,
    challenge: ctx.challenge
      ? { assignedUniversityId: ctx.challenge.assignedUniversityId }
      : null,
    request: {
      teamId: params.teamId,
      challengeId: params.challengeId,
      universityId: params.universityId,
      uid: params.uid,
    },
  })

  if (!decision.allowed) {
    errorFactory(decision.reason ?? 'not-authorized', proposalGateMessage(decision.reason))
  }

  return ctx.team as NonNullable<LoadedContext['team']>
}

const PROPOSAL_GATE_MESSAGES: Record<string, string> = {
  'team-not-found': 'Team not found.',
  'team-not-active': 'The team must be active before a solution proposal can be created.',
  'challenge-mismatch': 'The team does not belong to this challenge.',
  'university-mismatch': 'The team does not belong to this university.',
  'challenge-not-found': 'Challenge not found.',
  'university-not-assigned': 'The challenge is not assigned to this university.',
  'not-authorized': 'Only an active team member or the faculty lead may author this proposal.',
}

function proposalGateMessage(reason: string | null): string {
  return (reason && PROPOSAL_GATE_MESSAGES[reason]) || 'Not authorized to author this proposal.'
}

function throwError(code: string, message: string): never {
  throw { code, message } satisfies ProposalServiceError
}

/**
 * Creates a draft proposal for an active team.
 * Uses a deterministic document id (the team id) so a duplicate create fails.
 */
export async function createDraft(params: {
  teamId: string
  challengeId: string
  universityId: string
  uid: string
  content: ProposalContent
}): Promise<string> {
  const db = requireDb()
  const { teamId, challengeId, universityId, content } = params

  const ctx = await loadContext(db, teamId, challengeId)
  assertCanAuthorProposal(ctx, params, throwError)

  // Validate content (title required even for draft)
  const validation = validateProposalContent(content)
  if (!validation.valid) {
    throwError('invalid-content', validation.errors[0]?.message ?? 'Invalid proposal content.')
  }

  const docId = toProposalDocId(teamId)

  // Deterministic id prevents duplicate proposals (second create collides).
  const existing = await getDoc(doc(db, 'proposals', docId))
  if (existing.exists()) {
    throwError('duplicate-proposal', 'A proposal already exists for this team.')
  }

  const now = serverTimestamp()
  await setDoc(doc(db, 'proposals', docId), {
    id: docId,
    teamId,
    challengeId,
    universityId,
    title: content.title,
    solutionDescription: content.solutionDescription,
    implementationPlan: content.implementationPlan,
    estimatedCost: content.estimatedCost,
    timeline: content.timeline,
    expectedImpact: content.expectedImpact,
    status: 'draft' as ProposalStatus,
    createdAt: now,
    updatedAt: now,
  })

  return docId
}

/**
 * Updates a draft proposal's authored content.
 * Only an authorized member/faculty of the active team may do so, and only
 * while the proposal is still a draft.
 */
export async function updateDraft(params: {
  proposalId: string
  teamId: string
  challengeId: string
  universityId: string
  uid: string
  content: ProposalContent
}): Promise<void> {
  const db = requireDb()
  const { proposalId, teamId, challengeId, content } = params

  const ctx = await loadContext(db, teamId, challengeId)
  assertCanAuthorProposal(ctx, params, throwError)

  const validation = validateProposalContent(content)
  if (!validation.valid) {
    throwError('invalid-content', validation.errors[0]?.message ?? 'Invalid proposal content.')
  }

  const proposalRef = doc(db, 'proposals', proposalId)
  const proposalSnap = await getDoc(proposalRef)
  if (!proposalSnap.exists()) {
    throwError('proposal-not-found', 'Proposal not found.')
  }

  const proposalData = proposalSnap.data()
  if (proposalData.status !== 'draft') {
    throwError('proposal-locked', 'A submitted proposal cannot be edited by the team.')
  }

  // Identity fields can never be changed.
  if (proposalData.teamId !== teamId) {
    throwError('identity-mismatch', 'Proposal team mismatch.')
  }

  await updateDoc(proposalRef, {
    title: content.title,
    solutionDescription: content.solutionDescription,
    implementationPlan: content.implementationPlan,
    estimatedCost: content.estimatedCost,
    timeline: content.timeline,
    expectedImpact: content.expectedImpact,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Submits a draft proposal. Validates:
 *  - user is still an authorized member/faculty of an active team
 *  - proposal still a draft
 *  - content is complete
 * Records submittedAt and locks the proposal.
 */
export async function submitProposal(params: {
  proposalId: string
  teamId: string
  challengeId: string
  universityId: string
  uid: string
}): Promise<void> {
  const db = requireDb()
  const { proposalId, teamId, challengeId } = params

  const ctx = await loadContext(db, teamId, challengeId)
  assertCanAuthorProposal(ctx, params, throwError)

  const proposalRef = doc(db, 'proposals', proposalId)
  const proposalSnap = await getDoc(proposalRef)
  if (!proposalSnap.exists()) {
    throwError('proposal-not-found', 'Proposal not found.')
  }

  const data = proposalSnap.data()
  const status = data.status as ProposalStatus

  const content: ProposalContent = {
    title: data.title as string,
    solutionDescription: data.solutionDescription as string,
    implementationPlan: data.implementationPlan as string,
    estimatedCost: data.estimatedCost as string,
    timeline: data.timeline as string,
    expectedImpact: data.expectedImpact as string,
  }

  const submissionCheck = validateProposalSubmission(content, status)
  if (!submissionCheck.valid) {
    throwError('invalid-submission', submissionCheck.reason ?? 'Cannot submit proposal.')
  }

  await updateDoc(proposalRef, {
    status: 'submitted' as ProposalStatus,
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

/**
 * Gets a proposal for an authorized team member/faculty.
 * Returns null if not found or not accessible.
 */
export async function getProposalForTeam(params: {
  proposalId: string
  teamId: string
  challengeId: string
  universityId: string
  uid: string
}): Promise<Proposal | null> {
  const db = requireDb()
  const { proposalId, teamId, challengeId } = params

  const ctx = await loadContext(db, teamId, challengeId)
  assertCanAuthorProposal(ctx, params, throwError)

  const proposalSnap = await getDoc(doc(db, 'proposals', proposalId))
  if (!proposalSnap.exists()) return null

  return mapProposal(proposalSnap.id, proposalSnap.data())
}

/**
 * Gets the proposal for a team (by its deterministic id = team id).
 * Authorization is the same as getProposalForTeam.
 */
export async function getProposalByTeam(params: {
  teamId: string
  challengeId: string
  universityId: string
  uid: string
}): Promise<Proposal | null> {
  return getProposalForTeam({
    proposalId: toProposalDocId(params.teamId),
    teamId: params.teamId,
    challengeId: params.challengeId,
    universityId: params.universityId,
    uid: params.uid,
  })
}

function mapProposal(id: string, data: Record<string, unknown>): Proposal {
  return {
    id,
    teamId: data.teamId as string,
    challengeId: data.challengeId as string,
    universityId: data.universityId as string,
    title: data.title as string,
    solutionDescription: data.solutionDescription as string,
    implementationPlan: data.implementationPlan as string,
    estimatedCost: data.estimatedCost as string,
    timeline: data.timeline as string,
    expectedImpact: data.expectedImpact as string,
    status: data.status as ProposalStatus,
    createdAt: tsToMs(data.createdAt),
    updatedAt: tsToMs(data.updatedAt),
    submittedAt: data.submittedAt ? tsToMs(data.submittedAt) : undefined,
    governmentComment: data.governmentComment as string | undefined,
    reviewedAt: data.reviewedAt ? tsToMs(data.reviewedAt) : undefined,
    reviewedBy: data.reviewedBy as string | undefined,
  }
}

function tsToMs(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis()
  if (typeof value === 'number') return value
  return Date.now()
}

// ---------------------------------------------------------------------------
// Government review
// ---------------------------------------------------------------------------

/**
 * Government reads a proposal that has entered the review workflow
 * (submitted or government_review). Non-government users are rejected.
 */
export async function getProposalForGovernmentReview(params: {
  proposalId: string
  reviewerUid: string
}): Promise<{ proposal: Proposal | null; challenge: Challenge | null } | null> {
  const db = requireDb()
  const { proposalId, reviewerUid } = params

  const userSnap = await getDoc(doc(db, 'users', reviewerUid))
  if (!userSnap.exists() || userSnap.data().role !== 'government') {
    throwError('not-authorized', 'Only government reviewers may access the review workflow.')
  }

  const proposalSnap = await getDoc(doc(db, 'proposals', proposalId))
  if (!proposalSnap.exists()) return null

  const proposal = mapProposal(proposalSnap.id, proposalSnap.data())
  if (proposal.status !== 'submitted' && proposal.status !== 'government_review') {
    return { proposal, challenge: null }
  }

  // Load challenge context
  const challengeSnap = await getDoc(doc(db, 'challenges', proposal.challengeId))
  let challenge: Challenge | null = null
  if (challengeSnap.exists()) {
    const d = challengeSnap.data()
    challenge = { ...(d as Challenge), id: challengeSnap.id, createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toMillis() : d.createdAt, updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toMillis() : d.updatedAt }
  }

  return { proposal, challenge }
}

/**
 * Transitions a submitted proposal into government_review and records the
 * government's review comment. Government never rewrites authored content.
 */
export async function submitGovernmentReview(params: {
  proposalId: string
  reviewerUid: string
  comment: string
}): Promise<void> {
  const db = requireDb()
  const { proposalId, reviewerUid, comment } = params

  const userSnap = await getDoc(doc(db, 'users', reviewerUid))
  if (!userSnap.exists() || userSnap.data().role !== 'government') {
    throwError('not-authorized', 'Only government reviewers may submit a review.')
  }

  const proposalRef = doc(db, 'proposals', proposalId)
  const proposalSnap = await getDoc(proposalRef)
  if (!proposalSnap.exists()) {
    throwError('proposal-not-found', 'Proposal not found.')
  }

  const data = proposalSnap.data()
  if (data.status !== 'submitted') {
    throwError('invalid-review', 'Only a submitted proposal can enter government review.')
  }

  await updateDoc(proposalRef, {
    status: 'government_review' as ProposalStatus,
    governmentComment: comment,
    reviewedBy: reviewerUid,
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

/**
 * Lists submitted proposals for the government review queue.
 */
export async function getProposalsForReview(reviewerUid: string): Promise<Proposal[]> {
  const db = requireDb()

  const userSnap = await getDoc(doc(db, 'users', reviewerUid))
  if (!userSnap.exists() || userSnap.data().role !== 'government') {
    throwError('not-authorized', 'Only government reviewers may access the review workflow.')
  }

  const q = query(
    collection(db, 'proposals'),
    where('status', 'in', ['submitted', 'government_review']),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => mapProposal(d.id, d.data()))
}
