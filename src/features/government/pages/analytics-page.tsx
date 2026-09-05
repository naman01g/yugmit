import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { PageHeader } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingState } from '@/components/feedback/loading-state'
import { ErrorState } from '@/components/feedback/error-state'
import { getAnalytics } from '@/features/analytics/service'
import {
  PIPELINE_LABELS,
  statusLabel,
  type AnalyticsData,
} from '@/features/analytics'
import type { ChallengeStatus } from '@/types/challenge'

function formatHours(hours: number | null): string | null {
  if (hours === null) return null
  if (hours < 24) return `${hours} hrs`
  const days = Math.round((hours / 24) * 10) / 10
  return `${days} days`
}

export function GovernmentAnalyticsPage() {
  const { userProfile } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const load = useCallback(async () => {
    if (!userProfile?.uid) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await getAnalytics(userProfile.uid)
      setAnalytics(data)
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to load analytics.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [userProfile?.uid])

  useEffect(() => {
    void load()
  }, [load])

  const status = useMemo(() => {
    if (!analytics) return []
    return analytics.byStatus
      .filter((s) => s.status !== 'rejected' && s.status !== 'merged')
      .sort((a, b) => orderOf(a.status) - orderOf(b.status))
  }, [analytics])

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Analytics" />
        <LoadingState label="Compiling workflow analytics..." />
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Analytics" />
        <ErrorState message={error} onAction={load} />
      </div>
    )
  }

  if (!analytics) return null

  const total = analytics.totalChallenges
  const overview = [
    { label: 'Total Challenges', value: total },
    { label: 'Under Review', value: analytics.byStatus.find((s) => s.status === 'under_review')?.count ?? 0 },
    { label: 'Validated', value: analytics.byStatus.find((s) => s.status === 'validated')?.count ?? 0 },
    { label: 'Rejected', value: analytics.byStatus.find((s) => s.status === 'rejected')?.count ?? 0 },
  ]
  const matching = overview.concat([
    { label: 'In University Matching', value: analytics.byStatus.find((s) => s.status === 'university_matching')?.count ?? 0 },
    { label: 'In Team Formation', value: analytics.byStatus.find((s) => s.status === 'team_formation')?.count ?? 0 },
  ])

  return (
    <div>
      <PageHeader
        title="Government Analytics"
        subtitle="Real workflow visibility across the challenge lifecycle"
      />

      {/* Overview metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {overview.map((item) => (
          <Card key={item.label}>
            <CardContent>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {matching.slice(4).map((item) => (
          <Card key={item.label}>
            <CardContent>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle>Challenge Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {analytics.pipeline.map((stage) => {
                const label = PIPELINE_LABELS[stage.stage] ?? stage.stage
                const isFinal = stage.stage === 'proposal'
                return (
                  <div key={stage.stage} className="flex items-center gap-3">
                    <div className="flex w-8 shrink-0 justify-center">
                      {isFinal ? (
                        <span className="flex size-6 items-center justify-center rounded-full border border-border bg-muted text-xs font-medium text-muted-foreground">
                          ✓
                        </span>
                      ) : (
                        <span className="h-5 w-0.5 bg-border" />
                      )}
                    </div>
                    <div className="flex-1 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{label}</span>
                        <span className="text-sm tabular-nums">{stage.count}</span>
                      </div>
                      {stage.count > 0 && (
                        <div className="mt-1 h-1.5 rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${total > 0 ? (stage.count / total) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Proposals */}
        <Card>
          <CardHeader>
            <CardTitle>Proposals</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Total Proposals</dt>
                <dd className="font-medium tabular-nums">{analytics.totalProposals}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Submitted</dt>
                <dd className="font-medium tabular-nums">{analytics.submittedProposals}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Under Government Review</dt>
                <dd className="font-medium tabular-nums">{analytics.proposalsUnderReview}</dd>
              </div>
            </dl>
            <div className="mt-4 border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">Review Time</p>
              <p className="mt-1 text-sm">
                {analytics.avgReviewHours !== null
                  ? `Avg ${formatHours(analytics.avgReviewHours)} across ${analytics.reviewedCount} validated`
                  : 'No validated review data available yet'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Status distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {status.map((s) => (
                <div key={s.status} className="flex items-center justify-between text-sm">
                  <span>{statusLabel(s.status)}</span>
                  <span className="tabular-nums">{s.count}</span>
                </div>
              ))}
              {status.length === 0 && (
                <p className="text-sm text-muted-foreground">No challenges yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* By domain */}
        <Card>
          <CardHeader>
            <CardTitle>Challenges by Domain</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.byDomain.length === 0 ? (
              <p className="text-sm text-muted-foreground">No challenges yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-1.5 pr-2 font-medium">Domain</th>
                    <th className="py-1.5 pl-2 text-right font-medium">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.byDomain.map((row) => (
                    <tr key={row.key} className="border-b border-border/60 last:border-0">
                      <td className="py-1.5 pr-2">{row.key}</td>
                      <td className="py-1.5 pl-2 text-right tabular-nums">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* By district */}
        <Card>
          <CardHeader>
            <CardTitle>Challenges by District</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.byDistrict.length === 0 ? (
              <p className="text-sm text-muted-foreground">No challenges yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-1.5 pr-2 font-medium">District</th>
                    <th className="py-1.5 pl-2 text-right font-medium">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.byDistrict.map((row) => (
                    <tr key={row.key} className="border-b border-border/60 last:border-0">
                      <td className="py-1.5 pr-2">{row.key}</td>
                      <td className="py-1.5 pl-2 text-right tabular-nums">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* University engagement */}
      <div className="mt-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>University Engagement</CardTitle>
            {analytics.universities.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {analytics.universities.filter((u) => u.assignedChallenges > 0 || u.activeTeams > 0 || u.proposals > 0 || u.acceptedChallenges > 0).length} engaged
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {analytics.universities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No university engagement data yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="py-1.5 pr-2 font-medium">University</th>
                      <th className="py-1.5 px-2 text-right font-medium">Assigned</th>
                      <th className="py-1.5 px-2 text-right font-medium">Accepted</th>
                      <th className="py-1.5 px-2 text-right font-medium">Active Teams</th>
                      <th className="py-1.5 pl-2 text-right font-medium">Proposals</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.universities.map((u) => (
                      <tr key={u.universityId} className="border-b border-border/60 last:border-0">
                        <td className="py-1.5 pr-2">{u.name}</td>
                        <td className="py-1.5 px-2 text-right tabular-nums">{u.assignedChallenges}</td>
                        <td className="py-1.5 px-2 text-right tabular-nums">{u.acceptedChallenges}</td>
                        <td className="py-1.5 px-2 text-right tabular-nums">{u.activeTeams}</td>
                        <td className="py-1.5 pl-2 text-right tabular-nums">{u.proposals}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status filter */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>By Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`rounded-md border px-3 py-1 text-sm ${
                  statusFilter === 'all' ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                }`}
              >
                All
              </button>
              {analytics.byStatus.map((s) => (
                <button
                  key={s.status}
                  type="button"
                  onClick={() => setStatusFilter(s.status)}
                  className={`rounded-md border px-3 py-1 text-sm ${
                    statusFilter === s.status ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                  }`}
                >
                  {statusLabel(s.status)} ({s.count})
                </button>
              ))}
            </div>
            <StatusList data={analytics} filter={statusFilter} />
          </CardContent>
        </Card>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        All figures are derived in real time from the platform's authoritative records.
      </p>
    </div>
  )
}

function orderOf(status: ChallengeStatus): number {
  const order = ['submitted', 'under_review', 'validated', 'university_matching', 'team_formation', 'proposal']
  const idx = order.indexOf(status)
  return idx === -1 ? 99 : idx
}

function StatusList({ data, filter }: { data: AnalyticsData; filter: string }) {
  const rows = data.byStatus.filter((s) => filter === 'all' || s.status === filter)
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-muted-foreground">
          <th className="py-1.5 pr-2 font-medium">Status</th>
          <th className="py-1.5 pl-2 text-right font-medium">Count</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.status} className="border-b border-border/60 last:border-0">
            <td className="py-1.5 pr-2">{statusLabel(row.status)}</td>
            <td className="py-1.5 pl-2 text-right tabular-nums">{row.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
