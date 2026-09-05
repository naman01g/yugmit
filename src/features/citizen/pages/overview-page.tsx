import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import { PageHeader } from '@/components/shell/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingState } from '@/components/feedback/loading-state'
import { EmptyState } from '@/components/feedback/empty-state'
import { getCitizenChallenges } from '@/lib/challenge-service'
import type { Challenge, ChallengeStatus } from '@/types/challenge'

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const STATUS_LABEL: Record<ChallengeStatus, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  validated: 'Validated',
  university_matching: 'University Matching',
  team_formation: 'Team Formation',
  proposal: 'Proposal',
  rejected: 'Rejected',
  merged: 'Merged',
}

export function CitizenOverviewPage() {
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userProfile) return
    try {
      const data = await getCitizenChallenges(userProfile.uid)
      setChallenges(data)
    } catch {
      // Non-critical: overview degrades gracefully
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
        <PageHeader title="Citizen Overview" subtitle="Your activity at a glance." />
        <LoadingState label="Loading overview..." />
      </div>
    )
  }

  if (challenges.length === 0) {
    return (
      <div>
        <PageHeader title="Citizen Overview" subtitle="Your activity at a glance." />
        <EmptyState
          title="Welcome to YUGMIT"
          description="You have not submitted any challenges yet. Report a societal problem in your community to get started."
          actionLabel="Submit Your First Challenge"
          onAction={() => navigate('/citizen/challenges/new')}
        />
      </div>
    )
  }

  const activeCount = challenges.filter(
    (c) =>
      c.status !== 'rejected' &&
      c.status !== 'merged',
  ).length
  const recentChallenges = challenges.slice(0, 3)

  return (
    <div>
      <PageHeader
        title="Citizen Overview"
        subtitle="Your activity at a glance."
        actions={
          <Button onClick={() => navigate('/citizen/challenges/new')}>
            Submit New Challenge
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col items-center gap-1 py-5">
            <span className="text-3xl font-semibold">{challenges.length}</span>
            <span className="text-sm text-muted-foreground">
              Total Challenges
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 py-5">
            <span className="text-3xl font-semibold">{activeCount}</span>
            <span className="text-sm text-muted-foreground">Active</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 py-5">
            <span className="text-3xl font-semibold">
              {challenges.filter((c) => c.evidence.length > 0).length}
            </span>
            <span className="text-sm text-muted-foreground">
              With Evidence
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          Recent Challenges
        </h2>
        <div className="space-y-2">
          {recentChallenges.map((c) => (
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
              <CardContent className="flex items-center justify-between py-3">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-medium">
                    {c.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {c.domain} &middot; {c.location.district} &middot;{' '}
                    {formatDate(c.createdAt)}
                  </p>
                </div>
                <span className="ml-3 shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {STATUS_LABEL[c.status]}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
        {challenges.length > 3 && (
          <div className="mt-3 text-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/citizen/challenges')}
            >
              View All Challenges
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
