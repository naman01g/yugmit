/**
 * Team Formation types — Module 07
 *
 * These types define the Firestore document schemas for teams and team invitations.
 * Schema follows ARCHITECTURE.md locked collections: teams, team_invites.
 */

// ---------------------------------------------------------------------------
// Team status
// ---------------------------------------------------------------------------

/**
 * Team lifecycle status.
 * forming → active (when 3-4 students accept invitations)
 */
export type TeamStatus = 'forming' | 'active'

// ---------------------------------------------------------------------------
// Team document: teams/{teamId}
// ---------------------------------------------------------------------------

export interface Team {
  id: string
  challengeId: string
  universityId: string
  facultyLeadId: string
  memberIds: string[]
  status: TeamStatus
  createdAt: number
  updatedAt: number
}

// ---------------------------------------------------------------------------
// Team invitation status
// ---------------------------------------------------------------------------

export type InvitationStatus = 'pending' | 'accepted' | 'declined'

// ---------------------------------------------------------------------------
// Team invitation document: team_invites/{inviteId}
// ---------------------------------------------------------------------------

export interface TeamInvitation {
  id: string
  teamId: string
  studentUid: string
  sentBy: string
  status: InvitationStatus
  createdAt: number
  respondedAt?: number
}

// ---------------------------------------------------------------------------
// Team formation constants
// ---------------------------------------------------------------------------

/**
 * Minimum students required for a team to become active.
 */
export const MIN_TEAM_SIZE = 3

/**
 * Maximum students allowed in a team.
 */
export const MAX_TEAM_SIZE = 4

/**
 * Valid team status transitions.
 */
export const VALID_TEAM_TRANSITIONS: Record<TeamStatus, TeamStatus[]> = {
  forming: ['active'],
  active: [],
}

/**
 * Valid invitation status transitions (student-initiated only).
 */
export const VALID_INVITATION_TRANSITIONS: Record<InvitationStatus, InvitationStatus[]> = {
  pending: ['accepted', 'declined'],
  accepted: [],
  declined: [],
}
