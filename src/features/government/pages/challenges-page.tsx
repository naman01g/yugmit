import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/shell/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingState } from '@/components/feedback/loading-state'
import { ErrorState } from '@/components/feedback/error-state'
import { EmptyState } from '@/components/feedback/empty-state'
import { getReviewChallenges } from '@/lib/government-review-service'
import { ALLOWED_DOMAINS, type Domain } from '@/lib/taxonomy'
import { SORTED_DISTRICTS } from '@/lib/districts'
import type { Challenge, ChallengeStatus } from '@/types/challenge'

const STATUS_TONE: Record<ChallengeStatus, 'default' | 'success' | 'warning' | 'destructive' | 'muted'> = {
  submitted: 'default',
  under_review: 'warning',
  validated: 'success',
  university_assigned: 'default',
  university_matching: 'default',
  team_formation: 'default',
  proposal: 'default',
  rejected: 'destructive',
  merged: 'muted',
}

const STATUS_LABEL: Record<ChallengeStatus, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  validated: 'Validated',
  university_assigned: 'University Assigned',
  university_matching: 'University Matching',
  team_formation: 'Team Formation',
  proposal: 'Proposal',
  rejected: 'Rejected',
  merged: 'Merged',
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function GovernmentChallengesPage() {
  const navigate = useNavigate()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState<ChallengeStatus | ''>('')
  const [domainFilter, setDomainFilter] = useState<Domain | ''>('')
  const [districtFilter, setDistrictFilter] = useState('')

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const filters = {
        status: statusFilter || undefined,
        domain: domainFilter || undefined,
        district: districtFilter || undefined,
      }
      const data = await getReviewChallenges(filters)
      setChallenges(data)
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to load challenges.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, domainFilter, districtFilter])

  useEffect(() => {
    void load()
  }, [load])

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Challenge Review" subtitle="Review and validate citizen-submitted challenges." />
        <LoadingState label="Loading review queue..." />
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Challenge Review" subtitle="Review and validate citizen-submitted challenges." />
        <ErrorState message={error} onAction={load} />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Challenge Review"
        subtitle={`${challenges.length} challenge${challenges.length === 1 ? '' : 's'} in queue.`}
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[150px]">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ChallengeStatus | '')}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="validated">Validated</option>
                <option value="rejected">Rejected</option>
                <option value="merged">Merged</option>
              </select>
            </div>

            <div className="min-w-[150px]">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Domain
              </label>
              <select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value as Domain | '')}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
              >
                <option value="">All Domains</option>
                {ALLOWED_DOMAINS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[150px]">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                District
              </label>
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
              >
                <option value="">All Districts</option>
                {SORTED_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={() => {
                setStatusFilter('')
                setDomainFilter('')
                setDistrictFilter('')
              }}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {challenges.length === 0 ? (
        <EmptyState
          title="No challenges found"
          description="No challenges match your current filters. Try adjusting your filter criteria."
          actionLabel="Clear Filters"
          onAction={() => {
            setStatusFilter('')
            setDomainFilter('')
            setDistrictFilter('')
          }}
        />
      ) : (
        <div className="space-y-3">
          {challenges.map((c) => (
            <Card
              key={c.id}
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => navigate(`/government/challenges/${c.id}`)}
              role="link"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigate(`/government/challenges/${c.id}`)
                }
              }}
            >
              <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold">{c.title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{c.domain}</span>
                    <span aria-hidden="true">|</span>
                    <span>{c.location.district}</span>
                    <span aria-hidden="true">|</span>
                    <time dateTime={new Date(c.createdAt).toISOString()}>
                      {formatDate(c.createdAt)}
                    </time>
                  </div>
                </div>
                <Badge variant={STATUS_TONE[c.status]} className="shrink-0">
                  {STATUS_LABEL[c.status]}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
