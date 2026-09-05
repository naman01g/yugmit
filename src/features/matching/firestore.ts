/**
 * Firestore persistence for challenge_matches.
 *
 * Writes one immutable document per (challenge, university) pair under
 * `challenge_matches/{challengeId}_{universityId}`.
 *
 * Security: only the government client runs the matching engine after
 * validating a challenge, and the Firestore rules layer (Module 02/security)
 * governs read/write authorization. This module performs no rule rewrites and
 * does not attempt to bypass the security model.
 *
 * Firestore is optional — the engine itself is pure and testable without it.
 */
import {
  collection,
  doc,
  setDoc,
} from 'firebase/firestore'

import { db } from '@/lib/firebase'
import type { ChallengeMatch } from './types'

/**
 * Returns the document id for a (challenge, university) pair.
 * Deterministic and collision-safe within a challenge.
 */
export function matchDocumentId(
  challengeId: string,
  universityId: string,
): string {
  return `${challengeId}_${universityId}`
}

/**
 * Writes a single immutable match document to Firestore.
 * `createdAt` is stamped by the client (a number) so the stored document is
 * deterministic and matches the engine output; Firestore's server timestamp is
 * NOT used for the immutability-critical createdAt field.
 *
 * Returns the document id that was written, or null when Firestore is not
 * configured.
 */
export async function writeMatchDocument(
  match: ChallengeMatch,
): Promise<string | null> {
  if (!db) {
    return null
  }
  const docId = matchDocumentId(match.challengeId, match.universityId)
  const ref = doc(collection(db, 'challenge_matches'), docId)
  await setDoc(ref, match)
  return docId
}

/**
 * Writes multiple match documents (one per pair) and returns the list of
 * document ids that were written. If Firestore is not configured, returns an
 * empty array (the caller can still work with in-memory results).
 */
export async function persistMatches(
  matches: ChallengeMatch[],
): Promise<string[]> {
  if (!db) {
    return []
  }
  const written: string[] = []
  for (const match of matches) {
    const id = await writeMatchDocument(match)
    if (id) {
      written.push(id)
    }
  }
  return written
}
