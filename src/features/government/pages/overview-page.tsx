import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/shell/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingState } from '@/components/feedback/loading-state'
import { getReviewStats } from '@/lib/government-review-service'

export function GovernmentOverviewPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<{
    submitted: number
    underReview: number
    validated: number
    rejected: number
    total: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await getReviewStats()
      setStats(data)
    } catch {
      // Non-critical: overview degrades gracefully
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Government Overview" subtitle="Review queue status and metrics." />
        <LoadingState label="Loading overview..." />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Government Overview"
        subtitle="Review queue status and metrics."
        actions={
          <Button onClick={() => navigate('/government/challenges')}>
            Go to Review Queue
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col items-center gap-1 py-5">
            <span className="text-3xl font-semibold">{stats?.submitted ?? 0}</span>
            <span className="text-sm text-muted-foreground">Pending Review</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 py-5">
            <span className="text-3xl font-semibold">{stats?.underReview ?? 0}</span>
            <span className="text-sm text-muted-foreground">Under Review</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 py-5">
            <span className="text-3xl font-semibold">{stats?.validated ?? 0}</span>
            <span className="text-sm text-muted-foreground">Validated</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 py-5">
            <span className="text-3xl font-semibold">{stats?.total ?? 0}</span>
            <span className="text-sm text-muted-foreground">Total Challenges</span>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Review challenges submitted by citizens. Each challenge is analyzed by AI before human validation.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate('/government/challenges')}
            >
              Open Review Queue
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
