import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import { PageHeader } from '@/components/shell/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingState } from '@/components/feedback/loading-state'
import { ErrorState } from '@/components/feedback/error-state'
import { getChallenge } from '@/lib/challenge-service'
import { getChallengeAiAnalysis } from '@/features/ai/services/challenge-ai-integration'
import type { ChallengeAiAnalysis } from '@/types/ai'
import {
  LIFECYCLE_STEPS,
  type Challenge,
  type ChallengeStatus,
} from '@/types/challenge'

const STATUS_TONE: Record<
  ChallengeStatus,
  'default' | 'success' | 'warning' | 'destructive' | 'muted'
> = {
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

function getStepIndex(status: ChallengeStatus): number {
  return LIFECYCLE_STEPS.findIndex((s) => s.status === status)
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function LifecycleTimeline({ currentStatus }: { currentStatus: ChallengeStatus }) {
  const currentIdx = getStepIndex(currentStatus)
  const isTerminal =
    currentStatus === 'rejected' || currentStatus === 'merged'

  return (
    <nav aria-label="Challenge lifecycle" className="space-y-0">
      {LIFECYCLE_STEPS.map((step, idx) => {
        const isCompleted = !isTerminal && idx < currentIdx
        const isCurrent = step.status === currentStatus
        const isFuture = !isTerminal && idx > currentIdx

        return (
          <div
            key={step.status}
            className="flex items-start gap-3"
            aria-current={isCurrent ? 'step' : undefined}
          >
            <div className="flex flex-col items-center">
              <div
                className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium ${
                  isCompleted
                    ? 'border-success bg-success text-success-foreground'
                    : isCurrent
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    className="size-3.5"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 8.5l3.5 3.5L13 4.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              {idx < LIFECYCLE_STEPS.length - 1 && (
                <div
                  className={`w-0.5 ${isCompleted ? 'bg-success' : 'bg-border'}`}
                  style={{ minHeight: '1.5rem' }}
                />
              )}
            </div>
            <div className="pb-4 pt-0.5">
              <span
                className={`text-sm font-medium ${
                  isCurrent
                    ? 'text-foreground'
                    : isFuture
                      ? 'text-muted-foreground'
                      : 'text-foreground/70'
                }`}
              >
                {step.label}
              </span>
              {isCurrent && (
                <Badge
                  variant={STATUS_TONE[currentStatus]}
                  className="ml-2 align-middle"
                >
                  Current
                </Badge>
              )}
              {isFuture && (
                <span className="ml-2 text-xs text-muted-foreground">
                  Pending
                </span>
              )}
              {isCompleted && (
                <span className="ml-2 text-xs text-success">Completed</span>
              )}
            </div>
          </div>
        )
      })}

      {isTerminal && (
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div
              className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium ${
                currentStatus === 'rejected'
                  ? 'border-destructive bg-destructive text-destructive-foreground'
                  : 'border-border bg-muted text-muted-foreground'
              }`}
            >
              X
            </div>
          </div>
          <div className="pt-0.5">
            <span
              className={`text-sm font-medium ${
                currentStatus === 'rejected'
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              }`}
            >
              {currentStatus === 'rejected' ? 'Rejected' : 'Merged'}
            </span>
            <Badge
              variant={STATUS_TONE[currentStatus]}
              className="ml-2 align-middle"
            >
              Final
            </Badge>
          </div>
        </div>
      )}
    </nav>
  )
}

export function CitizenChallengeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<ChallengeAiAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await getChallenge(id)
      if (!data) {
        setError('Challenge not found.')
        return
      }
      if (userProfile && data.citizenId !== userProfile.uid) {
        setError('You do not have permission to view this challenge.')
        return
      }
      setChallenge(data)

      // AI analysis is best-effort and never blocks the challenge view.
      try {
        const analysis = await getChallengeAiAnalysis(id)
        setAiAnalysis(analysis as ChallengeAiAnalysis | null)
      } catch {
        setAiAnalysis(null)
      }
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to load challenge.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [id, userProfile])

  useEffect(() => {
    void load()
  }, [load])

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Challenge Details" />
        <LoadingState label="Loading challenge..." />
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Challenge Details" />
        <ErrorState message={error} onAction={load} />
      </div>
    )
  }

  if (!challenge) return null

  return (
    <div>
      <PageHeader
        title={challenge.title}
        subtitle={`Submitted on ${formatDate(challenge.createdAt)}`}
        actions={
          <Button
            variant="outline"
            onClick={() => navigate('/citizen/challenges')}
          >
            Back to My Challenges
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                {challenge.description}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Challenge Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Domain</dt>
                  <dd className="mt-0.5 font-medium">{challenge.domain}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">District</dt>
                  <dd className="mt-0.5 font-medium">
                    {challenge.location.district}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Tags</dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {challenge.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {aiAnalysis ? (
                <>
                  <div className="mb-3">
                    {aiAnalysis.confidence < 0.7 ? (
                      <Badge variant="warning">
                        Low Confidence: Flagged for Reviewer Attention
                      </Badge>
                    ) : (
                      <Badge variant="success">Analysis Complete</Badge>
                    )}
                  </div>
                  <dl className="grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-muted-foreground">Primary Domain</dt>
                      <dd className="mt-0.5 font-medium">
                        {aiAnalysis.primaryDomain}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Confidence</dt>
                      <dd className="mt-0.5 font-medium">
                        {(aiAnalysis.confidence * 100).toFixed(1)}%
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Urgency</dt>
                      <dd className="mt-0.5 font-medium">{aiAnalysis.urgency}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Impact Scale</dt>
                      <dd className="mt-0.5 font-medium">
                        {aiAnalysis.impactScale}
                      </dd>
                    </div>
                    {aiAnalysis.secondaryDomain && (
                      <div>
                        <dt className="text-muted-foreground">Secondary Domain</dt>
                        <dd className="mt-0.5 font-medium">
                          {aiAnalysis.secondaryDomain}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-muted-foreground">Required Expertise</dt>
                      <dd className="mt-1 flex flex-wrap gap-1.5">
                        {aiAnalysis.requiredExpertise.map((exp, i) => (
                          <Badge key={i} variant="secondary">
                            {exp}
                          </Badge>
                        ))}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-muted-foreground">Problem Summary</dt>
                      <dd className="mt-0.5 text-foreground/80">
                        {aiAnalysis.problemSummary}
                      </dd>
                    </div>
                  </dl>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  AI analysis runs automatically after a challenge is submitted.
                  It may not be available yet, or the analysis could not be
                  completed.
                </p>
              )}
            </CardContent>
          </Card>

          {challenge.evidence.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Evidence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {challenge.evidence.map((url, i) => (
                    <div
                      key={i}
                      className="overflow-hidden rounded-md border border-border"
                    >
                      <img
                        src={url}
                        alt={`Evidence photo ${i + 1} for ${challenge.title}`}
                        className="aspect-video w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar — lifecycle */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Badge variant={STATUS_TONE[challenge.status]} className="text-sm">
                  {STATUS_LABEL[challenge.status]}
                </Badge>
              </div>
              <LifecycleTimeline currentStatus={challenge.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Challenge Info</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Challenge ID</dt>
                  <dd className="mt-0.5 font-mono text-xs break-all">
                    {challenge.id}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Submitted</dt>
                  <dd className="mt-0.5">{formatDate(challenge.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Last Updated</dt>
                  <dd className="mt-0.5">{formatDate(challenge.updatedAt)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
