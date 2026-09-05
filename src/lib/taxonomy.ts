/**
 * Locked taxonomy from AI_ENGINE.md.
 *
 * Every value here is approved. Any domain, tag, urgency, or impactScale
 * outside these lists is invalid and must be rejected by the validator.
 * Do NOT invent new values.
 */

// ---------------------------------------------------------------------------
// Domains — exactly 10
// ---------------------------------------------------------------------------

export const ALLOWED_DOMAINS = [
  'Education',
  'Agriculture',
  'Healthcare',
  'Water Management',
  'Environment',
  'Energy',
  'Urban Development',
  'Accessibility',
  'Public Administration',
  'Rural Livelihoods',
] as const

export type Domain = (typeof ALLOWED_DOMAINS)[number]

// ---------------------------------------------------------------------------
// Tags per domain — approved vocabulary only
// ---------------------------------------------------------------------------

export const TAGS_BY_DOMAIN: Record<Domain, readonly string[]> = {
  Education: [
    'Digital Learning',
    'School Infrastructure',
    'Higher Education',
    'Vocational Training',
    'Student Support',
  ],
  Agriculture: [
    'Crop Management',
    'Irrigation',
    'Soil Health',
    'Agricultural Technology',
    'Farmer Support',
  ],
  Healthcare: [
    'Healthcare Access',
    'Public Health',
    'Telemedicine',
    'Health Infrastructure',
    'Medical Technology',
  ],
  'Water Management': [
    'Drinking Water',
    'Water Quality',
    'Water Supply',
    'Irrigation',
    'Water Conservation',
    'Groundwater',
  ],
  Environment: [
    'Waste Management',
    'Pollution',
    'Biodiversity',
    'Environmental Monitoring',
    'Climate Resilience',
  ],
  Energy: [
    'Renewable Energy',
    'Energy Access',
    'Energy Efficiency',
    'Rural Electrification',
  ],
  'Urban Development': [
    'Roads',
    'Drainage',
    'Sanitation',
    'Public Infrastructure',
    'Traffic & Mobility',
    'Smart Infrastructure',
  ],
  Accessibility: [
    'Disability Access',
    'Assistive Technology',
    'Accessible Infrastructure',
    'Inclusive Services',
  ],
  'Public Administration': [
    'Public Services',
    'Governance',
    'Citizen Services',
    'Administrative Efficiency',
    'Government Infrastructure',
  ],
  'Rural Livelihoods': [
    'Employment',
    'Skill Development',
    'Local Entrepreneurship',
    'Artisan Support',
    'Rural Enterprises',
  ],
}

/**
 * Union of all approved tags across every domain.
 */
export const ALL_APPROVED_TAGS: readonly string[] = Object.values(
  TAGS_BY_DOMAIN,
).flat()

// ---------------------------------------------------------------------------
// Urgency — 3 allowed values (NO "critical")
// ---------------------------------------------------------------------------

export const ALLOWED_URGENCY = ['low', 'medium', 'high'] as const

export type Urgency = (typeof ALLOWED_URGENCY)[number]

// ---------------------------------------------------------------------------
// Impact scale — 5 qualitative levels (NOT numeric population)
// ---------------------------------------------------------------------------

export const ALLOWED_IMPACT_SCALES = [
  'individual',
  'household',
  'neighborhood',
  'village_ward',
  'district',
] as const

export type ImpactScale = (typeof ALLOWED_IMPACT_SCALES)[number]

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

export function isDomain(value: unknown): value is Domain {
  return typeof value === 'string' && (ALLOWED_DOMAINS as readonly string[]).includes(value)
}

export function isTagForDomain(domain: Domain, tag: string): boolean {
  return (TAGS_BY_DOMAIN[domain] as readonly string[]).includes(tag)
}

export function isApprovedTag(tag: string): boolean {
  return (ALL_APPROVED_TAGS as readonly string[]).includes(tag)
}

export function isUrgency(value: unknown): value is Urgency {
  return typeof value === 'string' && (ALLOWED_URGENCY as readonly string[]).includes(value)
}

export function isImpactScale(value: unknown): value is ImpactScale {
  return typeof value === 'string' && (ALLOWED_IMPACT_SCALES as readonly string[]).includes(value)
}
