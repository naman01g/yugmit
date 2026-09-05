/**
 * Foundational shared types defined by the project documentation.
 *
 * Deliberately limited: the full Firestore data model, AI types, and matching types
 * live in their respective modules. Only types that the application shell and persona
 * navigation require are defined here.
 */

/**
 * Locked role set from ARCHITECTURE.md (`users/{uid}.role`).
 * Role is immutable after account creation.
 */
export type Role =
  | 'citizen'
  | 'government'
  | 'university_admin'
  | 'faculty'
  | 'student'
  | 'super_admin'

/**
 * High-level access persona used by the application shell navigation.
 * Maps a set of roles to its primary workspace for shell/demo purposes.
 */
export type Persona = 'citizen' | 'government' | 'university'
