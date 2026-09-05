import type { Role, Persona } from '@/types'

/**
 * Maps a user's Role to the top-level Persona route area.
 *
 * All three university roles share the `/university/*` workspace.
 * Role-specific filtering within that workspace is implemented in later modules.
 */
const ROLE_TO_PERSONA: Record<Role, Persona | null> = {
  citizen: 'citizen',
  government: 'government',
  university_admin: 'university',
  faculty: 'university',
  student: 'university',
  super_admin: null,
}

/**
 * Returns the Persona route area for a given Role, or null if the role
 * has no direct UI workspace (e.g. super_admin, seed/config only).
 */
export function getPersonaForRole(role: Role): Persona | null {
  return ROLE_TO_PERSONA[role] ?? null
}

/**
 * Returns the home path for a given Persona.
 */
export function getPersonaHomePath(persona: Persona): string {
  switch (persona) {
    case 'citizen':
      return '/citizen'
    case 'government':
      return '/government'
    case 'university':
      return '/university'
  }
}

/**
 * Returns the home path for a given Role.
 */
export function getRoleHomePath(role: Role): string {
  const persona = getPersonaForRole(role)
  return persona ? getPersonaHomePath(persona) : '/login'
}

/**
 * Tests whether a given role is allowed to access a given persona area.
 */
export function canAccessPersona(role: Role, persona: Persona): boolean {
  return getPersonaForRole(role) === persona
}
