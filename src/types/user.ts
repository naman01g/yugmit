import type { Role } from '@/types'

/**
 * Firestore user document schema (ARCHITECTURE.md `users/{uid}`).
 *
 * `uid` and `role` are immutable after creation.
 * Only the user can read their own document.
 * A user may not modify their own role, uid, or escalate privileges.
 */
export interface UserProfile {
  uid: string
  role: Role
  name: string
  email: string
  phone?: string
  universityId?: string
  createdAt: number
  updatedAt: number
}

/**
 * Writable fields a user may self-edit on their own document.
 * Role, uid, createdAt, and universityId are excluded.
 */
export type UserProfileEditable = Pick<UserProfile, 'name' | 'email' | 'phone'>
