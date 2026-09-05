import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import { PageHeader } from '@/components/shell/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingState } from '@/components/feedback/loading-state'
import { ErrorState } from '@/components/feedback/error-state'
import { getUniversityMatches, type UniversityMatch } from '@/lib/university-acceptance-service'
import { getFacultyTeams } from '@/lib/team-service'
import { getStudentInvitations } from '@/lib/team-service'

export function UniversityOverviewPage() {
  const { userProfile } = useAuth(); const [matches, setMatches] = useState<UniversityMatch[]>([]); const [state, setState] = useState(''); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null)
  const load = useCallback(async () => { if (!userProfile) return; setLoading(true); setError(null); try { if (userProfile.role === 'student') { const invitations = await getStudentInvitations(userProfile.uid); setState(`${invitations.filter((i) => i.status === 'pending').length} pending invitation${invitations.filter((i) => i.status === 'pending').length === 1 ? '' : 's'}`) } else if (userProfile.role === 'faculty') { const teams = await getFacultyTeams(userProfile.uid); setState(`${teams.length} team${teams.length === 1 ? '' : 's'} you lead`) } else if (userProfile.role === 'university_admin' && userProfile.universityId) { const result = await getUniversityMatches(userProfile.universityId); setMatches(result); setState(`${result.filter((m) => !m.accepted).length} match${result.filter((m) => !m.accepted).length === 1 ? '' : 'es'} awaiting acceptance`) } } catch (e) { setError(e && typeof e === 'object' && 'message' in e ? String(e.message) : 'Failed to load university workspace.') } finally { setLoading(false) } }, [userProfile])
  useEffect(() => { void load() }, [load])
  if (loading) return <><PageHeader title="University Overview" /><LoadingState label="Loading current workspace state..." /></>
  if (error) return <><PageHeader title="University Overview" /><ErrorState message={error} onAction={load} /></>
  return <div><PageHeader title="University Overview" subtitle="Current state from your authorized university workflow." /><div className="grid gap-4 sm:grid-cols-2"><Card><CardHeader><CardTitle>Current state</CardTitle></CardHeader><CardContent><p className="text-sm">{state || 'No current workflow state.'}</p></CardContent></Card>{userProfile?.role === 'university_admin' && <Card><CardHeader><CardTitle>Matched challenges</CardTitle></CardHeader><CardContent><p className="text-sm">{matches.length} match{matches.length === 1 ? '' : 'es'} available.</p><Link className="mt-3 inline-block text-sm text-primary hover:underline" to="/university/challenges">Review matches</Link></CardContent></Card>}{userProfile?.role === 'student' && <Card><CardHeader><CardTitle>Invitations</CardTitle></CardHeader><CardContent><Link className="text-sm text-primary hover:underline" to="/university/invitations">View my invitations</Link></CardContent></Card>}</div></div>
}
