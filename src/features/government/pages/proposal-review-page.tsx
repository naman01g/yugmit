import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import { PageHeader } from '@/components/shell/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { LoadingState } from '@/components/feedback/loading-state'
import { ErrorState } from '@/components/feedback/error-state'
import {
  getProposalForGovernmentReview,
  submitGovernmentReview,
} from '@/features/proposals/services/proposal-service'
import { getUniversityName } from '@/lib/university-service'
import type { Proposal } from '@/types/proposal'
import type { Challenge } from '@/types/challenge'

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function GovernmentProposalReviewPage() {
  const { id } = useParams<{ id: string }>()
  const proposalId = id ?? ''
  const { userProfile } = useAuth()
  const navigate = useNavigate()

  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [universityName, setUniversityName] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!proposalId || !userProfile?.uid) return
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const result = await getProposalForGovernmentReview({
        proposalId,
        reviewerUid: userProfile.uid,
      })
      if (!result?.proposal) {
        setError('Proposal not found or not available for review.')
        return
      }
      setProposal(result.proposal)
      setChallenge(result.challenge ?? null)
      setComment(result.proposal.governmentComment ?? '')

      const uni = await getUniversityName(result.proposal.universityId)
      setUniversityName(uni)
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to load proposal.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [proposalId, userProfile?.uid])

  useEffect(() => {
    void load()
  }, [load])

  const handleSubmitReview = async () => {
    if (!proposalId || !userProfile?.uid) return
    setIsSubmitting(true)
    setError(null)

    try {
      await submitGovernmentReview({
        proposalId,
        reviewerUid: userProfile.uid,
        comment: comment.trim(),
      })
      setSuccessMessage('Review recorded. The proposal has moved to government review.')
      await load()
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to submit review.'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Proposal Review" />
        <LoadingState label="Loading proposal..." />
      </div>
    )
  }

  if (error && !proposal) {
    return (
      <div>
        <PageHeader title="Proposal Review" />
        <ErrorState message={error} onAction={load} />
      </div>
    )
  }

  if (!proposal) return null

  const canSubmitReview = proposal.status === 'submitted'

  return (
    <div>
      <PageHeader
        title={proposal.title}
        subtitle={challenge ? challenge.title : 'Solution proposal'}
        actions={
          <Button variant="outline" onClick={() => navigate('/government/proposals')}>
            Back to Proposals
          </Button>
        }
      />

      {successMessage && (
        <div className="mb-6 rounded-md border border-success/20 bg-success/10 p-4 text-sm text-success">
          {successMessage}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Challenge context */}
          {challenge && (
            <Card>
              <CardHeader>
                <CardTitle>Challenge Context</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">{challenge.title}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                  {challenge.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge variant="secondary">{challenge.domain}</Badge>
                  <Badge variant="secondary">{challenge.location.district}</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Team Proposal</CardTitle>
              <Badge variant="secondary" className="text-xs">Team Proposal</Badge>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Solution Description</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-foreground/80">
                    {proposal.solutionDescription}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Implementation Plan</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-foreground/80">
                    {proposal.implementationPlan}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Estimated Cost</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-foreground/80">
                    {proposal.estimatedCost}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Timeline</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-foreground/80">
                    {proposal.timeline}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Expected Impact</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-foreground/80">
                    {proposal.expectedImpact}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submission</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="mt-0.5">
                    <Badge variant={proposal.status === 'government_review' ? 'success' : 'default'}>
                      {proposal.status === 'government_review' ? 'Under Government Review' : 'Submitted'}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Submitted</dt>
                  <dd className="mt-0.5">
                    {proposal.submittedAt ? formatDate(proposal.submittedAt) : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">University</dt>
                  <dd className="mt-0.5">{universityName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Team</dt>
                  <dd className="mt-0.5 font-mono text-xs break-all">{proposal.teamId}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Government Review</CardTitle>
            </CardHeader>
            <CardContent>
              <Label className="text-sm font-medium">Review Comment</Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                placeholder="Record the government review of this proposal..."
                className="mt-1.5"
              />
              {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
              {canSubmitReview ? (
                <Button onClick={handleSubmitReview} disabled={isSubmitting} className="mt-3 w-full">
                  {isSubmitting ? 'Recording...' : 'Submit Review'}
                </Button>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Review already recorded.
                </p>
              )}
              <div className="mt-3 border-t border-border pt-3">
                <Link
                  to={`/government/challenges/${challenge?.id ?? proposal.challengeId}`}
                  className="text-sm underline underline-offset-4 text-primary"
                >
                  View Original Challenge
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
