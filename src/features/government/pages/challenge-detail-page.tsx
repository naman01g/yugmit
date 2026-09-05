import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/shell/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { LoadingState } from '@/components/feedback/loading-state'
import { ErrorState } from '@/components/feedback/error-state'
import {
  getChallengeForReview,
  startReview,
  validateChallenge,
  rejectChallenge,
  returnForCorrection,
  mergeChallenge,
  linkRelatedChallenge,
  getReviewHistory,
} from '@/lib/government-review-service'
import {
  runUniversityMatching,
  type MatchingRunResult,
} from '@/lib/university-matching-service'
import { getChallengeMatches } from '@/lib/university-acceptance-service'
import { getUniversityName } from '@/lib/university-service'
import {
  LIFECYCLE_STEPS,
  type Challenge,
  type ChallengeStatus,
} from '@/types/challenge'

const STATUS_TONE: Record<ChallengeStatus, 'default' | 'success' | 'warning' | 'destructive' | 'muted'> = {
  submitted: 'default',
  under_review: 'warning',
  validated: 'success',
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
  const isTerminal = currentStatus === 'rejected' || currentStatus === 'merged'

  return (
    <nav aria-label="Challenge lifecycle" className="space-y-0">
      {LIFECYCLE_STEPS.map((step, idx) => {
        const isCompleted = !isTerminal && idx < currentIdx
        const isCurrent = step.status === currentStatus
        const isFuture = !isTerminal && idx > currentIdx

        return (
          <div key={step.status} className="flex items-start gap-3" aria-current={isCurrent ? 'step' : undefined}>
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
                  <svg viewBox="0 0 16 16" fill="none" className="size-3.5" aria-hidden="true">
                    <path d="M3 8.5l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              {idx < LIFECYCLE_STEPS.length - 1 && (
                <div className={`w-0.5 ${isCompleted ? 'bg-success' : 'bg-border'}`} style={{ minHeight: '1.5rem' }} />
              )}
            </div>
            <div className="pb-4 pt-0.5">
              <span className={`text-sm font-medium ${isCurrent ? 'text-foreground' : isFuture ? 'text-muted-foreground' : 'text-foreground/70'}`}>
                {step.label}
              </span>
              {isCurrent && <Badge variant={STATUS_TONE[currentStatus]} className="ml-2 align-middle">Current</Badge>}
              {isFuture && <span className="ml-2 text-xs text-muted-foreground">Pending</span>}
              {isCompleted && <span className="ml-2 text-xs text-success">Completed</span>}
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
            <span className={`text-sm font-medium ${currentStatus === 'rejected' ? 'text-destructive' : 'text-muted-foreground'}`}>
              {currentStatus === 'rejected' ? 'Rejected' : 'Merged'}
            </span>
            <Badge variant={STATUS_TONE[currentStatus]} className="ml-2 align-middle">Final</Badge>
          </div>
        </div>
      )}
    </nav>
  )
}

export function GovernmentChallengeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, unknown> | null>(null)
  const [reviewHistory, setReviewHistory] = useState<{ action: string; content: string; createdAt: number }[]>([])
  const [matches, setMatches] = useState<Awaited<ReturnType<typeof getChallengeMatches>>>([])
  const [universityNames, setUniversityNames] = useState<Record<string, string>>({})
  const [matchingResult, setMatchingResult] = useState<MatchingRunResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Decision form state
  const [selectedAction, setSelectedAction] = useState<string>('')
  const [comment, setComment] = useState('')
  const [mergeTargetId, setMergeTargetId] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const { challenge: data, aiAnalysis: analysisData } = await getChallengeForReview(id)
      if (!data) {
        setError('Challenge not found.')
        return
      }
      setChallenge(data)
      setAiAnalysis(analysisData)

      const history = await getReviewHistory(id)
      setReviewHistory(history)

      if (data.status === 'validated' || data.status === 'university_matching') {
        const matchList = await getChallengeMatches(id)
        setMatches(matchList)
        const nameMap: Record<string, string> = {}
        await Promise.all(
          matchList.map(async (m) => {
            nameMap[m.universityId] = await getUniversityName(m.universityId)
          }),
        )
        setUniversityNames(nameMap)
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
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const handleDecision = async () => {
    if (!id || !selectedAction) return

    setActionLoading(true)
    setActionError(null)

    try {
      switch (selectedAction) {
        case 'under_review':
          await startReview(id, comment || undefined)
          break
        case 'validate':
          await validateChallenge(id, comment || undefined)
          break
        case 'reject':
          if (!comment.trim()) {
            setActionError('Rejection reason is required.')
            setActionLoading(false)
            return
          }
          await rejectChallenge(id, comment)
          break
        case 'return':
          if (!comment.trim()) {
            setActionError('Feedback is required for correction.')
            setActionLoading(false)
            return
          }
          await returnForCorrection(id, comment)
          break
        case 'merge':
          if (!mergeTargetId.trim()) {
            setActionError('Target challenge ID is required for merge.')
            setActionLoading(false)
            return
          }
          if (!comment.trim()) {
            setActionError('Merge reason is required.')
            setActionLoading(false)
            return
          }
          await mergeChallenge(id, mergeTargetId.trim(), comment)
          break
        case 'link':
          if (!mergeTargetId.trim()) {
            setActionError('Related challenge ID is required.')
            setActionLoading(false)
            return
          }
          if (!comment.trim()) {
            setActionError('Note is required for linking.')
            setActionLoading(false)
            return
          }
          await linkRelatedChallenge(id, mergeTargetId.trim(), comment)
          break
      }

      // Reload to reflect changes
      await load()
      setSelectedAction('')
      setComment('')
      setMergeTargetId('')
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Action failed.'
      setActionError(msg)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRunMatching = async () => {
    if (!id) return

    setActionLoading(true)
    setActionError(null)
    setMatchingResult(null)

    try {
      const result = await runUniversityMatching(id)
      setMatchingResult(result)
      await load()
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Matching failed.'
      setActionError(msg)
    } finally {
      setActionLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Review Challenge" />
        <LoadingState label="Loading challenge details..." />
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Review Challenge" />
        <ErrorState message={error} onAction={load} />
      </div>
    )
  }

  if (!challenge) return null

  const canReview = challenge.status === 'submitted' || challenge.status === 'under_review'

  return (
    <div>
      <PageHeader
        title={challenge.title}
        subtitle={`Submitted on ${formatDate(challenge.createdAt)}`}
        actions={
          <Button variant="outline" onClick={() => navigate('/government/challenges')}>
            Back to Queue
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
                  <dd className="mt-0.5 font-medium">{challenge.location.district}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Tags</dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {challenge.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </dd>
                </div>
              </dl>
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
                    <div key={i} className="overflow-hidden rounded-md border border-border">
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

          {/* AI Analysis */}
          {aiAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle>AI Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">Primary Domain</dt>
                    <dd className="mt-0.5 font-medium">{String(aiAnalysis.primaryDomain)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Confidence</dt>
                    <dd className="mt-0.5 font-medium">
                      {typeof aiAnalysis.confidence === 'number' 
                        ? `${(aiAnalysis.confidence * 100).toFixed(1)}%`
                        : String(aiAnalysis.confidence)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Urgency</dt>
                    <dd className="mt-0.5 font-medium">{String(aiAnalysis.urgency)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Impact Scale</dt>
                    <dd className="mt-0.5 font-medium">{String(aiAnalysis.impactScale)}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground">Required Expertise</dt>
                    <dd className="mt-1 flex flex-wrap gap-1.5">
                      {Array.isArray(aiAnalysis.requiredExpertise) && 
                        aiAnalysis.requiredExpertise.map((exp: string, i: number) => (
                          <Badge key={i} variant="secondary">{exp}</Badge>
                        ))}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Review History */}
          {reviewHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Review History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reviewHistory.map((item, i) => (
                    <div key={i} className="border-l-2 border-border pl-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {item.action}
                        </Badge>
                        <time className="text-xs text-muted-foreground">
                          {formatDate(item.createdAt)}
                        </time>
                      </div>
                      <p className="mt-1 text-sm text-foreground/80">{item.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar — status & decision */}
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
                  <dd className="mt-0.5 font-mono text-xs break-all">{challenge.id}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Citizen ID</dt>
                  <dd className="mt-0.5 font-mono text-xs break-all">{challenge.citizenId}</dd>
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

          {/* Decision Panel */}
          {canReview && (
            <Card>
              <CardHeader>
                <CardTitle>Review Decision</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Action</Label>
                  <select
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                  >
                    <option value="">Select action...</option>
                    {challenge.status === 'submitted' && (
                      <>
                        <option value="under_review">Move to Under Review</option>
                        <option value="reject">Reject Challenge</option>
                      </>
                    )}
                    {challenge.status === 'under_review' && (
                      <>
                        <option value="validate">Validate Challenge</option>
                        <option value="return">Return for Correction</option>
                        <option value="reject">Reject Challenge</option>
                        <option value="merge">Mark as Duplicate</option>
                        <option value="link">Link Related</option>
                      </>
                    )}
                  </select>
                </div>

                {(selectedAction === 'merge' || selectedAction === 'link') && (
                  <div>
                    <Label className="text-sm font-medium">
                      {selectedAction === 'merge' ? 'Target Challenge ID' : 'Related Challenge ID'}
                    </Label>
                    <input
                      type="text"
                      value={mergeTargetId}
                      onChange={(e) => setMergeTargetId(e.target.value)}
                      placeholder="Enter challenge ID..."
                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                    />
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium">
                    {selectedAction === 'validate' || selectedAction === 'under_review'
                      ? 'Comment (optional)'
                      : 'Comment (required)'}
                  </Label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={
                      selectedAction === 'validate'
                        ? 'Add optional validation notes...'
                        : selectedAction === 'under_review'
                          ? 'Add optional review notes...'
                          : selectedAction === 'reject'
                            ? 'Provide reason for rejection...'
                            : selectedAction === 'return'
                              ? 'Describe what needs correction...'
                              : selectedAction === 'merge'
                                ? 'Explain why this is a duplicate...'
                                : 'Describe the relationship...'
                    }
                    className="mt-1"
                    rows={3}
                  />
                </div>

                {actionError && (
                  <p className="text-sm text-destructive">{actionError}</p>
                )}

                <Button
                  onClick={handleDecision}
                  disabled={!selectedAction || actionLoading}
                  className="w-full"
                  variant={selectedAction === 'reject' ? 'destructive' : 'default'}
                >
                  {actionLoading ? 'Processing...' : 'Submit Decision'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* University Matching (validated / university_matching) */}
          {(challenge.status === 'validated' || challenge.status === 'university_matching') && (
            <Card>
              <CardHeader>
                <CardTitle>University Matching</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {challenge.status === 'validated' && matches.length === 0 && (
                  <div>
                    <p className="mb-3 text-sm text-muted-foreground">
                      Run the matching engine against the verified university
                      dataset to find qualifying universities.
                    </p>
                    <Button
                      onClick={handleRunMatching}
                      disabled={actionLoading}
                      className="w-full"
                    >
                      {actionLoading ? 'Matching...' : 'Run University Matching'}
                    </Button>
                  </div>
                )}

                {matchingResult?.status === 'no-match' && (
                  <div>
                    <Badge variant="warning">No Qualifying University</Badge>
                    <p className="mt-2 text-sm text-muted-foreground">
                      No university reached the minimum meaningful match threshold (40/100).
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground/80">
                      {matchingResult.reasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-muted-foreground">
                      The challenge remains validated. The university dataset or
                      challenge routing can be reviewed.
                    </p>
                  </div>
                )}

                {matches.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium">
                      Qualifying Universities ({matches.length})
                    </p>
                    <ul className="space-y-2">
                      {[...matches]
                        .sort((a, b) => a.rank - b.rank)
                        .map((m) => (
                          <li
                            key={m.universityId}
                            className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                          >
                            <span className="font-medium">
                              {universityNames[m.universityId] ?? m.universityId}
                            </span>
                            <span className="text-muted-foreground">
                              Score {m.score} (Rank {m.rank})
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                {actionError && (
                  <p className="text-sm text-destructive">{actionError}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
