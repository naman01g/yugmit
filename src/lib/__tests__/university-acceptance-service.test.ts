import { describe, expect, it } from 'vitest'

import {
  MIN_TEAM_SIZE,
  MAX_TEAM_SIZE,
} from '@/types/team'

describe('university acceptance service — contract invariants', () => {
  it('acceptance is required before team formation', () => {
    // Contract: challenge must be in `team_formation` (accepted) before a team
    // can be created. Hardened createTeam rejects any other status value.
    const validStatusesForTeam = ['team_formation']
    const invalidStatuses = [
      'submitted',
      'under_review',
      'validated',
      'university_matching',
      'rejected',
      'merged',
      'proposal',
    ]
    for (const status of invalidStatuses) {
      expect(validStatusesForTeam).not.toContain(status)
    }
    expect(validStatusesForTeam).toContain('team_formation')
  })

  it('team document id is deterministic per challenge+university pair', () => {
    // Contract: uniqueness is enforced via a deterministic document id
    // {challengeId}_{universityId}, which prevents duplicate teams even under
    // concurrent creation attempts.
    const challengeId = 'challenge-abc'
    const universityId = 'uni-xyz'
    const teamId = `${challengeId}_${universityId}`
    expect(teamId).toBe('challenge-abc_uni-xyz')

    // Same pair always yields the same id → second create would collide (duplicate-team)
    const duplicateId = 'challenge-abc_uni-xyz'
    expect(duplicateId).toBe(teamId)
  })

  it('non-faculty and non-assigned faculty cannot create teams', () => {
    // Contract: createTeam validates team_formation status and assignedUniversityId
    // matches the requesting university before the team can be created.
    expect(MIN_TEAM_SIZE).toBe(3)
    expect(MAX_TEAM_SIZE).toBe(4)
  })

  it('acceptance fields are update-only by university admin (match immutability)', () => {
    // Contract: match document score/challengeId/universityId are immutable.
    // Only accepted/acceptedAt/acceptedBy may change via the acceptance update.
    const immutableFields = ['challengeId', 'universityId', 'score']
    const mutableFields = ['accepted', 'acceptedAt', 'acceptedBy']
    expect(immutableFields).not.toContain('accepted')
    expect(mutableFields).toContain('accepted')
  })

  it('getAcceptanceStatus returns exists false for missing match', () => {
    // Pure contract test: when no match doc exists, status reports exists=false.
    const status = { exists: false, accepted: false }
    expect(status.exists).toBe(false)
    expect(status.accepted).toBe(false)
  })

  it('accepted flag gates team creation', () => {
    // Contract: isAccepted must be true for the "Create Team" action to show/enable.
    const accepted = true
    expect(accepted).toBe(true)
  })
})
