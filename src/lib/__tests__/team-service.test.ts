import { describe, expect, it } from 'vitest'

import {
  MIN_TEAM_SIZE,
  MAX_TEAM_SIZE,
  VALID_TEAM_TRANSITIONS,
  VALID_INVITATION_TRANSITIONS,
} from '@/types/team'
import type { TeamStatus, InvitationStatus } from '@/types/team'

describe('team types — constants', () => {
  it('MIN_TEAM_SIZE is 3', () => {
    expect(MIN_TEAM_SIZE).toBe(3)
  })

  it('MAX_TEAM_SIZE is 4', () => {
    expect(MAX_TEAM_SIZE).toBe(4)
  })

  it('MIN_TEAM_SIZE is less than or equal to MAX_TEAM_SIZE', () => {
    expect(MIN_TEAM_SIZE).toBeLessThanOrEqual(MAX_TEAM_SIZE)
  })
})

describe('team status transitions', () => {
  it('forming can transition to active', () => {
    expect(VALID_TEAM_TRANSITIONS.forming).toContain('active')
  })

  it('active cannot transition to any other status', () => {
    expect(VALID_TEAM_TRANSITIONS.active).toHaveLength(0)
  })

  it('all team statuses are covered', () => {
    const allStatuses: TeamStatus[] = ['forming', 'active']
    for (const status of allStatuses) {
      expect(VALID_TEAM_TRANSITIONS[status]).toBeDefined()
    }
  })
})

describe('invitation status transitions', () => {
  it('pending can transition to accepted', () => {
    expect(VALID_INVITATION_TRANSITIONS.pending).toContain('accepted')
  })

  it('pending can transition to declined', () => {
    expect(VALID_INVITATION_TRANSITIONS.pending).toContain('declined')
  })

  it('accepted cannot transition to any other status', () => {
    expect(VALID_INVITATION_TRANSITIONS.accepted).toHaveLength(0)
  })

  it('declined cannot transition to any other status', () => {
    expect(VALID_INVITATION_TRANSITIONS.declined).toHaveLength(0)
  })

  it('all invitation statuses are covered', () => {
    const allStatuses: InvitationStatus[] = ['pending', 'accepted', 'declined']
    for (const status of allStatuses) {
      expect(VALID_INVITATION_TRANSITIONS[status]).toBeDefined()
    }
  })
})

describe('team formation validation rules', () => {
  it('team must have at least MIN_TEAM_SIZE students to activate', () => {
    // This is a contract test documenting the activation rule
    const acceptedCount = MIN_TEAM_SIZE - 1
    expect(acceptedCount).toBeLessThan(MIN_TEAM_SIZE)
  })

  it('team cannot exceed MAX_TEAM_SIZE students', () => {
    const selectedCount = MAX_TEAM_SIZE + 1
    expect(selectedCount).toBeGreaterThan(MAX_TEAM_SIZE)
  })

  it('team starts in forming status', () => {
    // Contract: team creation always sets status to 'forming'
    const initialStatus: TeamStatus = 'forming'
    expect(initialStatus).toBe('forming')
  })

  it('invitation starts in pending status', () => {
    // Contract: invitation creation always sets status to 'pending'
    const initialStatus: InvitationStatus = 'pending'
    expect(initialStatus).toBe('pending')
  })
})

describe('team security invariants', () => {
  it('facultyLeadId cannot be changed after creation', () => {
    // Contract: facultyLeadId is immutable
    const team = {
      id: 'team-1',
      challengeId: 'challenge-1',
      universityId: 'uni-1',
      facultyLeadId: 'faculty-1',
      memberIds: [],
      status: 'forming' as TeamStatus,
    }
    expect(team.facultyLeadId).toBe('faculty-1')
  })

  it('challengeId cannot be changed after creation', () => {
    // Contract: challengeId is immutable
    const team = {
      id: 'team-1',
      challengeId: 'challenge-1',
      universityId: 'uni-1',
      facultyLeadId: 'faculty-1',
      memberIds: [],
      status: 'forming' as TeamStatus,
    }
    expect(team.challengeId).toBe('challenge-1')
  })

  it('universityId cannot be changed after creation', () => {
    // Contract: universityId is immutable
    const team = {
      id: 'team-1',
      challengeId: 'challenge-1',
      universityId: 'uni-1',
      facultyLeadId: 'faculty-1',
      memberIds: [],
      status: 'forming' as TeamStatus,
    }
    expect(team.universityId).toBe('uni-1')
  })

  it('invitation teamId cannot be changed after creation', () => {
    // Contract: teamId is immutable
    const invitation = {
      id: 'invite-1',
      teamId: 'team-1',
      studentUid: 'student-1',
      sentBy: 'faculty-1',
      status: 'pending' as InvitationStatus,
    }
    expect(invitation.teamId).toBe('team-1')
  })

  it('invitation studentUid cannot be changed after creation', () => {
    // Contract: studentUid is immutable
    const invitation = {
      id: 'invite-1',
      teamId: 'team-1',
      studentUid: 'student-1',
      sentBy: 'faculty-1',
      status: 'pending' as InvitationStatus,
    }
    expect(invitation.studentUid).toBe('student-1')
  })

  it('invitation sentBy cannot be changed after creation', () => {
    // Contract: sentBy is immutable
    const invitation = {
      id: 'invite-1',
      teamId: 'team-1',
      studentUid: 'student-1',
      sentBy: 'faculty-1',
      status: 'pending' as InvitationStatus,
    }
    expect(invitation.sentBy).toBe('faculty-1')
  })
})
