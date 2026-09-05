/**
 * Team Formation Firestore service — Module 07
 *
 * Provides CRUD for teams and team_invites collections.
 * Handles team creation, invitation management, and team activation.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'

import { db as firebaseDb, isFirebaseConfigured } from './firebase'
import type {
  Team,
  TeamStatus,
  TeamInvitation,
  InvitationStatus,
} from '@/types/team'
import { MIN_TEAM_SIZE, MAX_TEAM_SIZE } from '@/types/team'

export interface TeamServiceError {
  code: string
  message: string
}

function requireDb(): NonNullable<typeof firebaseDb> {
  if (!firebaseDb || !isFirebaseConfigured) {
    throw {
      code: 'firebase/not-configured',
      message: 'Firebase is not configured.',
    } satisfies TeamServiceError
  }
  return firebaseDb
}

// ---------------------------------------------------------------------------
// Team operations
// ---------------------------------------------------------------------------

/**
 * Creates a new team for a challenge at a university.
 * Validates: university acceptance, challenge eligibility, no duplicate team.
 * Uses deterministic document ID {challengeId}_{universityId} for uniqueness.
 * Returns the new team ID.
 */
export async function createTeam(params: {
  challengeId: string
  universityId: string
  facultyLeadId: string
}): Promise<string> {
  const db = requireDb()
  const { challengeId, universityId, facultyLeadId } = params

  // Verify challenge exists
  const challengeDoc = await getDoc(doc(db, 'challenges', challengeId))
  if (!challengeDoc.exists()) {
    throw {
      code: 'challenge-not-found',
      message: 'Challenge not found.',
    } satisfies TeamServiceError
  }

  const challengeData = challengeDoc.data()
  const challengeStatus = challengeData.status as string

  // Verify university acceptance — team_formation status means acceptance happened
  if (challengeStatus !== 'team_formation') {
    throw {
      code: 'university-not-accepted',
      message: 'University must accept the challenge before forming a team.',
    } satisfies TeamServiceError
  }

  // Verify challenge is assigned to this university
  if (challengeData.assignedUniversityId !== universityId) {
    throw {
      code: 'university-not-assigned',
      message: 'Challenge is not assigned to this university.',
    } satisfies TeamServiceError
  }

  // Check for existing team using deterministic ID
  const teamDocId = `${challengeId}_${universityId}`
  const existingTeamDoc = await getDoc(doc(db, 'teams', teamDocId))
  if (existingTeamDoc.exists()) {
    throw {
      code: 'duplicate-team',
      message: 'A team already exists for this challenge at this university.',
    } satisfies TeamServiceError
  }

  // Create team with deterministic document ID
  const now = serverTimestamp()
  const teamRef = doc(db, 'teams', teamDocId)
  await setDoc(teamRef, {
    challengeId,
    universityId,
    facultyLeadId,
    memberIds: [],
    status: 'forming' as TeamStatus,
    createdAt: now,
    updatedAt: now,
  })

  return teamDocId
}

/**
 * Gets a team by ID.
 * Returns null if not found.
 */
export async function getTeam(teamId: string): Promise<Team | null> {
  const db = requireDb()
  const snapshot = await getDoc(doc(db, 'teams', teamId))
  if (!snapshot.exists()) return null

  const data = snapshot.data()
  return {
    id: snapshot.id,
    challengeId: data.challengeId,
    universityId: data.universityId,
    facultyLeadId: data.facultyLeadId,
    memberIds: data.memberIds as string[],
    status: data.status as TeamStatus,
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toMillis()
      : typeof data.createdAt === 'number'
        ? data.createdAt
        : Date.now(),
    updatedAt: data.updatedAt instanceof Timestamp
      ? data.updatedAt.toMillis()
      : typeof data.updatedAt === 'number'
        ? data.updatedAt
        : Date.now(),
  }
}

/**
 * Gets team by challenge ID.
 * Returns null if no team exists for this challenge.
 */
export async function getTeamByChallengeId(challengeId: string): Promise<Team | null> {
  const db = requireDb()
  const q = query(
    collection(db, 'teams'),
    where('challengeId', '==', challengeId),
  )
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null

  const teamDoc = snapshot.docs[0]
  if (!teamDoc) return null
  const data = teamDoc.data()
  return {
    id: teamDoc.id,
    challengeId: data.challengeId,
    universityId: data.universityId,
    facultyLeadId: data.facultyLeadId,
    memberIds: data.memberIds as string[],
    status: data.status as TeamStatus,
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toMillis()
      : typeof data.createdAt === 'number'
        ? data.createdAt
        : Date.now(),
    updatedAt: data.updatedAt instanceof Timestamp
      ? data.updatedAt.toMillis()
      : typeof data.updatedAt === 'number'
        ? data.updatedAt
        : Date.now(),
  }
}

/**
 * Gets all teams for a university.
 */
export async function getUniversityTeams(universityId: string): Promise<Team[]> {
  const db = requireDb()
  const q = query(
    collection(db, 'teams'),
    where('universityId', '==', universityId),
    orderBy('createdAt', 'desc'),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      challengeId: data.challengeId,
      universityId: data.universityId,
      facultyLeadId: data.facultyLeadId,
      memberIds: data.memberIds as string[],
      status: data.status as TeamStatus,
      createdAt: data.createdAt instanceof Timestamp
        ? data.createdAt.toMillis()
        : typeof data.createdAt === 'number'
          ? data.createdAt
          : Date.now(),
      updatedAt: data.updatedAt instanceof Timestamp
        ? data.updatedAt.toMillis()
        : typeof data.updatedAt === 'number'
          ? data.updatedAt
          : Date.now(),
    }
  })
}

/**
 * Gets teams where a faculty member is the lead.
 */
export async function getFacultyTeams(facultyId: string): Promise<Team[]> {
  const db = requireDb()
  const q = query(
    collection(db, 'teams'),
    where('facultyLeadId', '==', facultyId),
    orderBy('createdAt', 'desc'),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      challengeId: data.challengeId,
      universityId: data.universityId,
      facultyLeadId: data.facultyLeadId,
      memberIds: data.memberIds as string[],
      status: data.status as TeamStatus,
      createdAt: data.createdAt instanceof Timestamp
        ? data.createdAt.toMillis()
        : typeof data.createdAt === 'number'
          ? data.createdAt
          : Date.now(),
      updatedAt: data.updatedAt instanceof Timestamp
        ? data.updatedAt.toMillis()
        : typeof data.updatedAt === 'number'
          ? data.updatedAt
          : Date.now(),
    }
  })
}

// ---------------------------------------------------------------------------
// Invitation operations
// ---------------------------------------------------------------------------

/**
 * Creates invitations for selected students.
 * Validates: team exists, faculty is authorized, students are valid, no duplicates.
 * Returns list of created invitation IDs.
 */
export async function createInvitations(params: {
  teamId: string
  facultyId: string
  studentUids: string[]
}): Promise<string[]> {
  const db = requireDb()
  const { teamId, facultyId, studentUids } = params

  // Validate team exists and faculty is authorized
  const teamDoc = await getDoc(doc(db, 'teams', teamId))
  if (!teamDoc.exists()) {
    throw {
      code: 'team-not-found',
      message: 'Team not found.',
    } satisfies TeamServiceError
  }

  const teamData = teamDoc.data()
  if (teamData.facultyLeadId !== facultyId) {
    throw {
      code: 'unauthorized',
      message: 'You are not authorized to manage this team.',
    } satisfies TeamServiceError
  }

  if (teamData.status !== 'forming') {
    throw {
      code: 'team-not-forming',
      message: 'Team is not in forming state.',
    } satisfies TeamServiceError
  }

  // Validate student count
  if (studentUids.length < MIN_TEAM_SIZE || studentUids.length > MAX_TEAM_SIZE) {
    throw {
      code: 'invalid-team-size',
      message: `Team must have ${MIN_TEAM_SIZE}-${MAX_TEAM_SIZE} students.`,
    } satisfies TeamServiceError
  }

  // Check for duplicates in selection
  const uniqueStudents = new Set(studentUids)
  if (uniqueStudents.size !== studentUids.length) {
    throw {
      code: 'duplicate-student',
      message: 'Duplicate students in selection.',
    } satisfies TeamServiceError
  }

  // Check for existing invitations
  const existingInvitesQuery = query(
    collection(db, 'team_invites'),
    where('teamId', '==', teamId),
  )
  const existingInvitesSnapshot = await getDocs(existingInvitesQuery)
  const existingStudentUids = new Set(
    existingInvitesSnapshot.docs.map((d) => d.data().studentUid as string)
  )

  // Filter out students who already have invitations
  const newStudents = studentUids.filter((uid) => !existingStudentUids.has(uid))
  if (newStudents.length === 0) {
    throw {
      code: 'all-already-invited',
      message: 'All selected students already have invitations.',
    } satisfies TeamServiceError
  }

  // Create invitations
  const now = serverTimestamp()
  const inviteIds: string[] = []

  for (const studentUid of newStudents) {
    const inviteRef = await addDoc(collection(db, 'team_invites'), {
      teamId,
      studentUid,
      sentBy: facultyId,
      status: 'pending' as InvitationStatus,
      createdAt: now,
    })
    inviteIds.push(inviteRef.id)
  }

  return inviteIds
}

/**
 * Gets an invitation by ID.
 */
export async function getInvitation(inviteId: string): Promise<TeamInvitation | null> {
  const db = requireDb()
  const snapshot = await getDoc(doc(db, 'team_invites', inviteId))
  if (!snapshot.exists()) return null

  const data = snapshot.data()
  return {
    id: snapshot.id,
    teamId: data.teamId,
    studentUid: data.studentUid,
    sentBy: data.sentBy,
    status: data.status as InvitationStatus,
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toMillis()
      : typeof data.createdAt === 'number'
        ? data.createdAt
        : Date.now(),
    respondedAt: data.respondedAt instanceof Timestamp
      ? data.respondedAt.toMillis()
      : typeof data.respondedAt === 'number'
        ? data.respondedAt
        : undefined,
  }
}

/**
 * Gets all invitations for a student.
 */
export async function getStudentInvitations(studentUid: string): Promise<TeamInvitation[]> {
  const db = requireDb()
  const q = query(
    collection(db, 'team_invites'),
    where('studentUid', '==', studentUid),
    orderBy('createdAt', 'desc'),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      teamId: data.teamId,
      studentUid: data.studentUid,
      sentBy: data.sentBy,
      status: data.status as InvitationStatus,
      createdAt: data.createdAt instanceof Timestamp
        ? data.createdAt.toMillis()
        : typeof data.createdAt === 'number'
          ? data.createdAt
          : Date.now(),
      respondedAt: data.respondedAt instanceof Timestamp
        ? data.respondedAt.toMillis()
        : typeof data.respondedAt === 'number'
          ? data.respondedAt
          : undefined,
    }
  })
}

/**
 * Gets all invitations for a team.
 */
export async function getTeamInvitations(teamId: string): Promise<TeamInvitation[]> {
  const db = requireDb()
  const q = query(
    collection(db, 'team_invites'),
    where('teamId', '==', teamId),
    orderBy('createdAt', 'desc'),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      teamId: data.teamId,
      studentUid: data.studentUid,
      sentBy: data.sentBy,
      status: data.status as InvitationStatus,
      createdAt: data.createdAt instanceof Timestamp
        ? data.createdAt.toMillis()
        : typeof data.createdAt === 'number'
          ? data.createdAt
          : Date.now(),
      respondedAt: data.respondedAt instanceof Timestamp
        ? data.respondedAt.toMillis()
        : typeof data.respondedAt === 'number'
          ? data.respondedAt
          : undefined,
    }
  })
}

/**
 * Student accepts or declines an invitation.
 * Validates: invitation exists, student owns it, status is pending.
 *
 * Only the student's own invitation is updated (status + respondedAt).
 * Team activation is a faculty action via `activateTeam` — the Firestore
 * rules deliberately reserve team document writes to the faculty lead, so a
 * student response can never mutate memberIds or bypass acceptance counting.
 */
export async function respondToInvitation(params: {
  invitationId: string
  studentUid: string
  response: 'accepted' | 'declined'
}): Promise<void> {
  const db = requireDb()
  const { invitationId, studentUid, response } = params

  const inviteRef = doc(db, 'team_invites', invitationId)
  const inviteDoc = await getDoc(inviteRef)

  if (!inviteDoc.exists()) {
    throw {
      code: 'invitation-not-found',
      message: 'Invitation not found.',
    } satisfies TeamServiceError
  }

  const inviteData = inviteDoc.data()

  // Verify student owns this invitation
  if (inviteData.studentUid !== studentUid) {
    throw {
      code: 'unauthorized',
      message: 'You can only respond to your own invitations.',
    } satisfies TeamServiceError
  }

  // Verify invitation is pending
  if (inviteData.status !== 'pending') {
    throw {
      code: 'invitation-already-responded',
      message: 'Invitation has already been responded to.',
    } satisfies TeamServiceError
  }

  await updateDoc(inviteRef, {
    status: response,
    respondedAt: serverTimestamp(),
  })
}

/**
 * Faculty lead activates a forming team once MIN_TEAM_SIZE–MAX_TEAM_SIZE
 * students have accepted their invitations.
 *
 * Validates:
 * - Team exists, is in forming state, and the caller is its faculty lead.
 * - The accepted-invitation count is within the allowed team size.
 *
 * memberIds are derived ONLY from the team's accepted invitations — the
 * faculty client may not pass an arbitrary member list. This matches the
 * Firestore rules, which reserve team writes for the faculty lead.
 */
export async function activateTeam(params: {
  teamId: string
  facultyLeadId: string
}): Promise<void> {
  const db = requireDb()
  const { teamId, facultyLeadId } = params

  const teamDoc = await getDoc(doc(db, 'teams', teamId))
  if (!teamDoc.exists()) {
    throw {
      code: 'team-not-found',
      message: 'Team not found.',
    } satisfies TeamServiceError
  }

  const teamData = teamDoc.data()
  if (teamData.facultyLeadId !== facultyLeadId) {
    throw {
      code: 'unauthorized',
      message: 'Only the faculty lead can activate this team.',
    } satisfies TeamServiceError
  }

  if (teamData.status !== 'forming') {
    throw {
      code: 'team-not-forming',
      message: 'Only a forming team can be activated.',
    } satisfies TeamServiceError
  }

  // Faculty may read all invitations for their team (rules permit this);
  // derive members strictly from accepted invitations.
  const invitations = await getTeamInvitations(teamId)
  const memberIds = invitations
    .filter((i) => i.status === 'accepted')
    .map((i) => i.studentUid)

  if (memberIds.length < MIN_TEAM_SIZE || memberIds.length > MAX_TEAM_SIZE) {
    throw {
      code: 'invalid-team-size',
      message: `Team must have ${MIN_TEAM_SIZE}-${MAX_TEAM_SIZE} student acceptances before it can be activated.`,
    } satisfies TeamServiceError
  }

  await updateDoc(doc(db, 'teams', teamId), {
    status: 'active' as TeamStatus,
    memberIds: [...new Set(memberIds)],
    updatedAt: serverTimestamp(),
  })
}

/**
 * Gets team with all related data (challenge, invitations, members).
 */
export async function getTeamDetails(teamId: string): Promise<{
  team: Team | null
  challenge: { id: string; title: string; domain: string; description: string } | null
  invitations: TeamInvitation[]
}> {
  const db = requireDb()

  const team = await getTeam(teamId)
  if (!team) {
    return { team: null, challenge: null, invitations: [] }
  }

  // Get challenge details
  let challenge = null
  const challengeDoc = await getDoc(doc(db, 'challenges', team.challengeId))
  if (challengeDoc.exists()) {
    const data = challengeDoc.data()
    challenge = {
      id: challengeDoc.id,
      title: data.title as string,
      domain: data.domain as string,
      description: data.description as string,
    }
  }

  // Get invitations
  const invitations = await getTeamInvitations(teamId)

  return { team, challenge, invitations }
}
