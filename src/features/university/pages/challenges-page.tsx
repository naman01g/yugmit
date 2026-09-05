import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import { PageHeader } from '@/components/shell/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { LoadingState } from '@/components/feedback/loading-state'
import { getChallenge } from '@/lib/challenge-service'
import { acceptMatch, getUniversityMatches, type UniversityMatch } from '@/lib/university-acceptance-service'
import type { Challenge } from '@/types/challenge'

type Row = { match: UniversityMatch; challenge: Challenge | null }

export function UniversityChallengesPage() {
  const { userProfile } = useAuth(); const navigate = useNavigate()
  const [rows, setRows] = useState<Row[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); const [accepting, setAccepting] = useState<string | null>(null)
  const load = useCallback(async () => { if (!userProfile?.universityId) return; setLoading(true); setError(null); try { const matches = await getUniversityMatches(userProfile.universityId); setRows(await Promise.all(matches.map(async (match) => ({ match, challenge: await getChallenge(match.challengeId) })))); } catch (e) { setError(e && typeof e === 'object' && 'message' in e ? String(e.message) : 'Failed to load matched challenges.') } finally { setLoading(false) } }, [userProfile?.universityId])
  useEffect(() => { void load() }, [load])
  async function accept(row: Row) { if (!userProfile?.universityId || !userProfile.uid) return; setAccepting(row.match.challengeId); try { await acceptMatch({ challengeId: row.match.challengeId, universityId: userProfile.universityId, universityAdminUid: userProfile.uid }); await load() } catch (e) { setError(e && typeof e === 'object' && 'message' in e ? String(e.message) : 'Unable to accept match.') } finally { setAccepting(null) } }
  if (loading) return <><PageHeader title="Matched Challenges" subtitle="Challenges routed to your institution" /><LoadingState label="Loading matches..." /></>
  if (error) return <><PageHeader title="Matched Challenges" subtitle="Challenges routed to your institution" /><ErrorState message={error} onAction={load} /></>
  return <div><PageHeader title="Matched Challenges" subtitle="Only matches for your university are shown." />{rows.length === 0 ? <EmptyState title="No matched challenges" description="There are no challenge matches for your university yet." /> : <div className="space-y-3">{rows.map((row) => <Card key={row.match.challengeId}><CardContent className="flex items-center justify-between gap-4 py-4"><button className="min-w-0 text-left" onClick={() => navigate(`/university/challenges/${row.match.challengeId}`)}><p className="font-medium">{row.challenge?.title ?? 'Challenge'}</p><p className="text-sm text-muted-foreground">{row.challenge?.domain ?? 'Details available to authorized members'}</p></button><div className="flex items-center gap-3">{row.match.accepted ? <Badge variant="success">Accepted</Badge> : <Badge>Pending</Badge>}{userProfile?.role === 'university_admin' && !row.match.accepted && <Button size="sm" disabled={accepting === row.match.challengeId} onClick={() => void accept(row)}>{accepting === row.match.challengeId ? 'Accepting...' : 'Accept match'}</Button>}</div></CardContent></Card>)}</div>}</div>
}
