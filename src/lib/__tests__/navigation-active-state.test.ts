import { describe, expect, it } from 'vitest'

import { activeNavItemId, personaNavigation } from '@/config/navigation'

describe('citizen sidebar active state', () => {
  const config = personaNavigation.citizen

  it.each([
    ['/citizen', 'citizen-overview'],
    ['/citizen/challenges', 'citizen-challenges'],
    ['/citizen/challenges/new', 'citizen-new-challenge'],
    ['/citizen/challenges/challenge-123', 'citizen-challenges'],
  ])('selects exactly one item for %s', (pathname, expectedId) => {
    expect(activeNavItemId(config, pathname)).toBe(expectedId)
  })
})
