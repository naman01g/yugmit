import type { UniversityCompatibility } from '@/lib/university-matching-service'

export type CompatibilityState = 'strong' | 'moderate' | 'low'

export function compatibilityState(score: number): CompatibilityState {
  if (score >= 80) return 'strong'
  if (score >= 40) return 'moderate'
  return 'low'
}

export function compatibilityLabel(state: CompatibilityState): string {
  return {
    strong: 'Strong compatibility',
    moderate: 'Moderate compatibility',
    low: 'Low compatibility',
  }[state]
}

export function prepareCompatibilityView(items: UniversityCompatibility[]) {
  const universities = [...items].sort((a, b) => b.score - a.score || a.university.id.localeCompare(b.university.id))
  const counts = { strong: 0, moderate: 0, low: 0 }
  for (const item of universities) counts[compatibilityState(item.score)]++
  return { universities, counts }
}
