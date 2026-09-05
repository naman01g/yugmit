/**
 * Deterministic normalization shared by all factor comparisons.
 *
 * Purpose: prevent meaningless formatting differences (case, surrounding
 * whitespace, internal whitespace) from failing a legitimate match.
 *
 * Deliberately simple and predictable:
 * - no fuzzy matching
 * - no ML / embedding similarity
 * - no hidden external calls
 * - identical normalized output for identical semantic string input
 */

/**
 * Normalizes a single string for comparison.
 * - trims surrounding whitespace
 * - lowercases
 * - collapses runs of internal whitespace to a single space
 */
export function normalizeString(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Normalized form for set membership tests.
 */
const normalizedCache = new Map<string, string>()

export function normalized(value: string): string {
  const cached = normalizedCache.get(value)
  if (cached !== undefined) {
    return cached
  }
  const result = normalizeString(value)
  normalizedCache.set(value, result)
  return result
}

/**
 * Normalizes an array of strings (e.g. tags, facilities, skills).
 * Maintains order, drops empty entries. Deterministic.
 */
export function normalizeList(values: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    const key = normalized(value)
    if (key.length === 0 || seen.has(key)) {
      continue
    }
    seen.add(key)
    out.push(key)
  }
  return out
}

/**
 * Builds a normalized set for O(1) membership checks.
 * Returns a Set of normalized strings (lowercased, trimmed, whitespace-squashed).
 */
export function normalizedSet(values: string[]): Set<string> {
  return new Set(normalizeList(values))
}

/**
 * Whether a candidate value (case/whitespace-insensitive) is present in a
 * normalized set.
 */
export function containsNormalized(set: Set<string>, candidate: string): boolean {
  return set.has(normalizeString(candidate))
}

/**
 * Counts how many of `candidates` are present (case/whitespace-insensitive)
 * in `pool`.
 */
export function countMatches(pool: string[], candidates: string[]): number {
  if (candidates.length === 0) {
    return 0
  }
  const set = normalizedSet(pool)
  let count = 0
  for (const candidate of candidates) {
    if (containsNormalized(set, candidate)) {
      count += 1
    }
  }
  return count
}
