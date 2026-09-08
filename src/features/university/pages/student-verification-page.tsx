import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { LoadingState } from '@/components/feedback/loading-state'
import { PageHeader } from '@/components/shell/page-header'
import { getPendingStudents, setStudentStatus } from '@/lib/account-approval-service'
import type { UserProfile } from '@/types/user'

export function StudentVerificationPage() {
  const { userProfile } = useAuth(); const [students, setStudents] = useState<UserProfile[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); const [working, setWorking] = useState<string | null>(null)
  const universityId = userProfile?.universityId
  const load = useCallback(async () => { if (!universityId) return; setLoading(true); setError(null); try { setStudents(await getPendingStudents(universityId)) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load student verification requests.') } finally { setLoading(false) } }, [universityId])
  useEffect(() => { void load() }, [load])
  async function decide(student: UserProfile, status: 'approved' | 'rejected') { setWorking(student.uid); try { await setStudentStatus(student.uid, status); await load() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update student verification.') } finally { setWorking(null) } }
  if (userProfile?.role !== 'university_admin') return <ErrorState title="University administrator access required" message="Only an approved university administrator can verify students." />
  if (loading) return <LoadingState label="Loading student verification requests…" />
  if (error) return <ErrorState message={error} onAction={load} />
  return <div><PageHeader title="Student Verification" subtitle="Approve pending students for your canonical university only." />{students.length === 0 ? <EmptyState title="No pending students" description="Student verification requests for your university will appear here." /> : <div className="space-y-3">{students.map(student => <Card key={student.uid}><CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{student.name}</p><p className="text-sm text-muted-foreground">{student.email} · Pending verification</p></div><div className="flex gap-2"><Button variant="outline" disabled={working === student.uid} onClick={() => void decide(student, 'rejected')}>Reject</Button><Button disabled={working === student.uid} onClick={() => void decide(student, 'approved')}>Approve</Button></div></CardContent></Card>)}</div>}</div>
}
