/**
 * Jharkhand districts — controlled list for challenge location selection.
 *
 * These are the established districts of Jharkhand state.
 * No district may be invented or omitted from this controlled list.
 * The citizen selects from this list; the selection drives university matching.
 */

export const JHARKHAND_DISTRICTS = [
  'Bokaro',
  'Chatra',
  'Deoghar',
  'Dhanbad',
  'Dumka',
  'East Singhbhum',
  'Giridih',
  'Godda',
  'Gumla',
  'Hazaribagh',
  'Jamtara',
  'Khunti',
  'Koderma',
  'Latehar',
  'Lohardaga',
  'Pakur',
  'Palamu',
  'Ramgarh',
  'Ranchi',
  'Sahebganj',
  'Seraikela Kharsawan',
  'Simdega',
  'West Singhbhum',
] as const

export type JharkhandDistrict = (typeof JHARKHAND_DISTRICTS)[number]

/**
 * Sorted deduplicated list for UI dropdowns.
 */
export const SORTED_DISTRICTS: readonly string[] = [...JHARKHAND_DISTRICTS].sort()

export function isJharkhandDistrict(value: string): value is JharkhandDistrict {
  return (JHARKHAND_DISTRICTS as readonly string[]).includes(value)
}
