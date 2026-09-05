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
  ],
}

export const personaNavigation: Record<Persona, PersonaNavConfig> = {
  citizen: citizenNav,
  government: governmentNav,
  university: universityNav,
}
