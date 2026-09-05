import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import { PageHeader } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingState } from '@/components/feedback/loading-state'
import { ErrorState } from '@/components/feedback/error-state'
import { getProposalsForReview } from '@/features/proposals/services/proposal-service'
import { getUniversityName } from '@/lib/university-service'
import type { Proposal } from '@/types/proposal'

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function GovernmentProposalsPage() {
  const { userProfile } = useAuth()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [universities, setUniversities] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userProfile?.uid) return
    setIsLoading(true)
    setError(null)

    try {
      const list = await getProposalsForReview(userProfile.uid)
      setProposals(list)

      const nameMap: Record<string, string> = {}
      const uniIds = new Set(list.map((p) => p.universityId))
      for (const uniId of uniIds) {
        try {
          nameMap[uniId] = await getUniversityName(uniId)
        } catch {
          nameMap[uniId] = uniId
        }
      }
      setUniversities(nameMap)
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to load proposals.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [userProfile?.uid])

  useEffect(() => {
    void load()
  }, [load])

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Solution Proposals" />
        <LoadingState label="Loading proposals for review..." />
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Solution Proposals" />
        <ErrorState message={error} onAction={load} />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Solution Proposals"
        subtitle="Proposals submitted by university teams for government review"
      />

      {proposals.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No proposals are awaiting government review yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {proposals.map((proposal) => (
            <Link
              key={proposal.id}
              to={`/government/proposals/${proposal.id}`}
              className="block"
            >
              <Card className="transition-colors hover:border-primary/40">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">{proposal.title}</CardTitle>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {universities[proposal.universityId] || proposal.universityId}
                    </p>
                  </div>
                  <Badge variant={proposal.status === 'government_review' ? 'success' : 'default'}>
                    {proposal.status === 'government_review' ? 'Under Review' : 'Submitted'}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {proposal.submittedAt ? `Submitted ${formatDate(proposal.submittedAt)}` : ''}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
