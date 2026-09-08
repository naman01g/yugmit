import { describe, expect, it } from 'vitest'
import serviceSource from '../university-acceptance-service.ts?raw'
import routeSource from '@/components/auth/protected-route.tsx?raw'
import rulesSource from '../../../firestore.rules?raw'

describe('university assigned-challenge authorization integration', () => {
  it('queries challenges by the authoritative assigned university id', () => {
    expect(serviceSource).toContain("where('assignedUniversityId', '==', universityId)")
    expect(serviceSource).not.toContain("collection(db, 'challenge_matches'), where('universityId', '==', universityId)")
  })

  it('reads only deterministic own-university match documents', () => {
    expect(serviceSource).toContain('`${challengeId}_${universityId}`')
    expect(serviceSource).toContain('data.universityId !== universityId')
  })

  it('blocks pending institutional profiles before operational queries', () => {
    expect(routeSource).toContain("userProfile.accountStatus !== 'approved'")
    expect(routeSource).toContain('Your university account is awaiting institutional verification.')
  })

  it('keeps university role, id, and account status immutable to self-writes', () => {
    expect(rulesSource).toContain(".hasOnly(['name', 'email', 'phone', 'updatedAt'])")
    expect(rulesSource).toContain("data.accountStatus == 'approved'")
    expect(rulesSource).toContain('resource.data.universityId == ownUniversityId()')
  })
})
