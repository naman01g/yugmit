import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import { PageHeader } from '@/components/shell/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingState } from '@/components/feedback/loading-state'
import { ErrorState } from '@/components/feedback/error-state'
import { EmptyState } from '@/components/feedback/empty-state'
import { getCitizenChallenges } from '@/lib/challenge-service'
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

export function CitizenChallengesPage() {
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userProfile) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await getCitizenChallenges(userProfile.uid)
      setChallenges(data)
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to load your challenges.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [userProfile])

  useEffect(() => {
    void load()
  }, [load])

  if (isLoading) {
    return (
      <div>
        <PageHeader title="My Challenges" subtitle="Challenges you have reported." />
        <LoadingState label="Loading your challenges..." />
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <PageHeader title="My Challenges" subtitle="Challenges you have reported." />
        <ErrorState message={error} onAction={load} />
      </div>
    )
  }

  if (challenges.length === 0) {
    return (
      <div>
        <PageHeader title="My Challenges" subtitle="Challenges you have reported." />
        <EmptyState
          title="No challenges yet"
          description="You have not submitted any challenges. Report a societal problem in your community to get started."
          actionLabel="Submit a Challenge"
          onAction={() => navigate('/citizen/challenges/new')}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="My Challenges"
        subtitle={`${challenges.length} challenge${challenges.length === 1 ? '' : 's'} submitted.`}
        actions={
          <Button onClick={() => navigate('/citizen/challenges/new')}>
            Submit New Challenge
          </Button>
        }
      />
      <div className="space-y-3">
        {challenges.map((c) => (
          <Card
            key={c.id}
            className="cursor-pointer transition-colors hover:bg-accent/50"
            onClick={() => navigate(`/citizen/challenges/${c.id}`)}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                navigate(`/citizen/challenges/${c.id}`)
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
                  {c.evidence.length > 0 && (
                    <>
                      <span aria-hidden="true">|</span>
                      <span>{c.evidence.length} photo{c.evidence.length > 1 ? 's' : ''}</span>
                    </>
                  )}
                </div>
              </div>
              <Badge variant={STATUS_TONE[c.status]} className="shrink-0">
                {STATUS_LABEL[c.status]}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
