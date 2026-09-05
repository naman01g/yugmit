/**
 * Loads the team + challenge context needed by the proposal UI.
 * Module 08 — small read helper, no write gates here (those live in the
 * proposal service and Firestore rules).
 */

import { doc, getDoc } from 'firebase/firestore'

import { db as firebaseDb, isFirebaseConfigured } from '@/lib/firebase'

export interface ProposalTeamContext {
  team: {
    id: string
    status: string
    facultyLeadId: string
    memberIds: string[]
    challengeId: string
    universityId: string
  } | null
  challenge: {
    id: string
    title: string
    description: string
    domain: string
    status: string
  } | null
}

export async function getProposalTeamContext(
  teamId: string,
): Promise<ProposalTeamContext> {
  if (!firebaseDb || !isFirebaseConfigured) {
    return { team: null, challenge: null }
  }

  const teamSnap = await getDoc(doc(firebaseDb, 'teams', teamId))
  if (!teamSnap.exists()) {
    return { team: null, challenge: null }
  }

  const teamData = teamSnap.data()
  const team = {
    id: teamSnap.id,
    status: teamData.status as string,
    facultyLeadId: teamData.facultyLeadId as string,
    memberIds: (teamData.memberIds as string[]) ?? [],
    challengeId: teamData.challengeId as string,
    universityId: teamData.universityId as string,
  }

  const challengeSnap = await getDoc(doc(firebaseDb, 'challenges', team.challengeId))
  if (!challengeSnap.exists()) {
    return { team, challenge: null }
  }

  const challengeData = challengeSnap.data()
  const challenge = {
    id: challengeSnap.id,
    title: challengeData.title as string,
    description: challengeData.description as string,
    domain: challengeData.domain as string,
    status: challengeData.status as string,
  }

  return { team, challenge }
}
