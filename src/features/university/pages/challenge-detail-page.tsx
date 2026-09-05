import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import { PageHeader } from '@/components/shell/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingState } from '@/components/feedback/loading-state'
import { ErrorState } from '@/components/feedback/error-state'
import { getChallenge } from '@/lib/challenge-service'
import { getMatch } from '@/lib/university-acceptance-service'
import type { Challenge } from '@/types/challenge'

export function UniversityChallengeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { userProfile } = useAuth(); const [challenge, setChallenge] = useState<Challenge | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null)
  const load = useCallback(async () => { if (!id || !userProfile?.universityId) return; setLoading(true); try { const match = await getMatch(id, userProfile.universityId); if (!match) throw new Error('This challenge is not matched to your university.'); setChallenge(await getChallenge(id)); } catch (e) { setError(e && typeof e === 'object' && 'message' in e ? String(e.message) : 'Unable to load challenge.') } finally { setLoading(false) } }, [id, userProfile?.universityId])
  useEffect(() => { void load() }, [load])
  if (loading) return <><PageHeader title="Challenge detail" /><LoadingState label="Loading challenge..." /></>
  if (error || !challenge) return <><PageHeader title="Challenge detail" /><ErrorState message={error ?? 'Challenge not found.'} onAction={load} /></>
  return <div><PageHeader title={challenge.title} subtitle={`${challenge.domain} · ${challenge.location.district}`} /><Card><CardContent className="space-y-4 py-5"><p className="whitespace-pre-wrap text-sm">{challenge.description}</p>{userProfile?.role === 'faculty' && <Link className="text-sm text-primary hover:underline" to={`/university/challenges/${challenge.id}/team`}>Open team formation</Link>}</CardContent></Card></div>
}
