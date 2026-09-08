import type { Persona } from '@/types'

export interface NavItem {
  id: string
  label: string
  href: string
  description: string
}

export interface PersonaNavConfig {
  persona: Persona
  label: string
  title: string
  homeHref: string
  items: NavItem[]
}

/**
 * Selects exactly one sidebar item: the longest route prefix wins.
 * This keeps parent detail routes active without also activating a more
 * specific sibling such as /citizen/challenges/new.
 */
export function activeNavItemId(
  config: PersonaNavConfig,
  pathname: string,
): string | null {
  const matches = config.items.filter(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  )
  matches.sort((a, b) => b.href.length - a.href.length)
  return matches[0]?.id ?? null
}

const citizenNav: PersonaNavConfig = {
  persona: 'citizen',
  label: 'Citizen',
  title: 'Citizen Portal',
  homeHref: '/citizen',
  items: [
    {
      id: 'citizen-overview',
      label: 'Overview',
      href: '/citizen',
      description: 'Your submitted challenges and their status',
    },
    {
      id: 'citizen-challenges',
      label: 'My Challenges',
      href: '/citizen/challenges',
      description: 'Challenges you have reported',
    },
    {
      id: 'citizen-new-challenge',
      label: 'Submit Challenge',
      href: '/citizen/challenges/new',
      description: 'Report a societal challenge',
    },
  ],
}

const governmentNav: PersonaNavConfig = {
  persona: 'government',
  label: 'Government',
  title: 'Government Console',
  homeHref: '/government',
  items: [
    {
      id: 'government-overview',
      label: 'Overview',
      href: '/government',
      description: 'Workflow at a glance',
    },
    {
      id: 'government-challenges',
      label: 'Challenge Review',
      href: '/government/challenges',
      description: 'Review incoming challenges',
    },
    {
      id: 'government-proposals',
      label: 'Solution Proposals',
      href: '/government/proposals',
      description: 'Review proposals submitted by teams',
    },
    {
      id: 'government-analytics',
      label: 'Analytics',
      href: '/government/analytics',
      description: 'Workflow visibility and statistics',
    },
    {
      id: 'government-university-accounts',
      label: 'University Accounts',
      href: '/government/university-accounts',
      description: 'Approve institutional administrator accounts',
    },
  ],
}

const universityNav: PersonaNavConfig = {
  persona: 'university',
  label: 'University',
  title: 'University Workspace',
  homeHref: '/university',
  items: [
    {
      id: 'university-overview',
      label: 'Overview',
      href: '/university',
      description: 'Your matching and engagement',
    },
    {
      id: 'university-challenges',
      label: 'Matched Challenges',
      href: '/university/challenges',
      description: 'Validated challenges routed to your institution',
    },
    {
      id: 'university-invitations',
      label: 'My Invitations',
      href: '/university/invitations',
      description: 'Team invitations sent to you',
    },
    {
      id: 'university-student-verification',
      label: 'Student Verification',
      href: '/university/student-verification',
      description: 'Verify pending students for your university',
    },
  ],
}

export const personaNavigation: Record<Persona, PersonaNavConfig> = {
  citizen: citizenNav,
  government: governmentNav,
  university: universityNav,
}
