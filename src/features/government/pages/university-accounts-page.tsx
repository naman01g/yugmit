import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { LoadingState } from '@/components/feedback/loading-state'
import { PageHeader } from '@/components/shell/page-header'
import { getPendingUniversityAdmins, setUniversityAdminStatus } from '@/lib/account-approval-service'
import { getUniversityName } from '@/lib/university-service'
import type { UserProfile } from '@/types/user'

export function UniversityAccountsPage() {
  const [accounts, setAccounts] = useState<UserProfile[]>([]); const [names, setNames] = useState<Record<string, string>>({}); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); const [working, setWorking] = useState<string | null>(null)
  const load = useCallback(async () => { setLoading(true); setError(null); try { const pending = await getPendingUniversityAdmins(); setAccounts(pending); const pairs = await Promise.all(pending.map(async a => [a.universityId ?? '', await getUniversityName(a.universityId ?? '')] as const)); setNames(Object.fromEntries(pairs)) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load university account requests.') } finally { setLoading(false) } }, [])
  useEffect(() => { void load() }, [load])
  async function decide(account: UserProfile, status: 'approved' | 'rejected') { setWorking(account.uid); try { await setUniversityAdminStatus(account.uid, status); await load() } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update account.') } finally { setWorking(null) } }
  if (loading) return <LoadingState label="Loading university accounts…" />
  if (error) return <ErrorState message={error} onAction={load} />
  return <div><PageHeader title="University Account Verification" subtitle="Approve institution-linked administrator accounts." />{accounts.length === 0 ? <EmptyState title="No pending university accounts" description="New institutional requests will appear here." /> : <div className="space-y-3">{accounts.map(account => <Card key={account.uid}><CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{names[account.universityId ?? ''] ?? account.universityId}</p><p className="text-sm text-muted-foreground">{account.universityId} · {account.email}</p></div><div className="flex gap-2"><Button variant="outline" disabled={working === account.uid} onClick={() => void decide(account, 'rejected')}>Reject</Button><Button disabled={working === account.uid} onClick={() => void decide(account, 'approved')}>Approve</Button></div></CardContent></Card>)}</div>}</div>
}
