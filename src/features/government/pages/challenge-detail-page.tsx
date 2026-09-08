import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/shell/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  keepChallengesSeparate,
  setSpamStatus,
  getReviewHistory,
} from '@/lib/government-review-service'
import {
  runUniversityMatching,
  getUniversityCompatibility,
  assignUniversity,
  type UniversityCompatibility,
} from '@/lib/university-matching-service'
import {
  compatibilityLabel,
  compatibilityState,
  prepareCompatibilityView,
} from '../compatibility-presentation'
import {
  LIFECYCLE_STEPS,
  type Challenge,
  type ChallengeStatus,
} from '@/types/challenge'
import { useAuth } from '@/context/auth-context'

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

function reviewActionLabel(action: string): string {
  return ({ under_review: 'Started Review', validated: 'Marked as Validated', rejected: 'Rejected', returned: 'Returned for Correction', merged: 'Merged as Duplicate', linked: 'Linked Related', kept_separate: 'Kept Separate', marked_spam: 'Marked as Spam', spam_restored: 'Restored from Spam', university_assigned: 'Assigned University' } as Record<string, string>)[action] ?? action.replaceAll('_', ' ')
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
  const { userProfile } = useAuth()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, unknown> | null>(null)
  const [reviewHistory, setReviewHistory] = useState<{ action: string; content: string; createdAt: number }[]>([])
  const [compatibilities, setCompatibilities] = useState<UniversityCompatibility[]>([])
  const [assignmentCandidate, setAssignmentCandidate] = useState<UniversityCompatibility | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Decision form state
  const [selectedAction, setSelectedAction] = useState<string>('')
  const [comment, setComment] = useState('')
  const [mergeTargetId, setMergeTargetId] = useState('')
  const [duplicateCandidate, setDuplicateCandidate] = useState<Challenge | null>(null)
  const [compareOpen, setCompareOpen] = useState(false)

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
      const candidates = Array.isArray(analysisData?.duplicate_candidates) ? analysisData.duplicate_candidates : []
      const firstCandidate = candidates.find((candidate): candidate is { challengeId: string; similarity: number } =>
        Boolean(candidate) && typeof candidate === 'object' && typeof (candidate as { challengeId?: unknown }).challengeId === 'string' && typeof (candidate as { similarity?: unknown }).similarity === 'number')
      if (firstCandidate && firstCandidate.challengeId !== id) {
        const candidateResult = await getChallengeForReview(firstCandidate.challengeId)
        setDuplicateCandidate(candidateResult.challenge)
      } else {
        setDuplicateCandidate(null)
      }

      const history = await getReviewHistory(id)
      setReviewHistory(history)

      // Matching results are intentionally not loaded as a side effect. The
      // Government reviewer explicitly starts each comparison run.
      setCompatibilities([])
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
        case 'keep_separate':
          if (!mergeTargetId.trim() || !comment.trim()) {
            setActionError('Candidate challenge and decision reason are required.')
            setActionLoading(false)
            return
          }
          await keepChallengesSeparate(id, mergeTargetId.trim(), comment)
          break
        case 'spam':
          if (!comment.trim()) {
            setActionError('A reason is required to mark a challenge as spam.')
            setActionLoading(false)
            return
          }
          await setSpamStatus(id, 'confirmed', comment)
          break
        case 'restore_spam':
          if (!comment.trim()) {
            setActionError('A restoration reason is required.')
            setActionLoading(false)
            return
          }
          await setSpamStatus(id, 'none', comment)
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

    try {
      await runUniversityMatching(id)
      await load()
      setCompatibilities(await getUniversityCompatibility(id))
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

  const handleConfirmAssignment = async () => {
    if (!id || !assignmentCandidate || !userProfile?.uid) return
    setActionLoading(true)
    setActionError(null)
    try {
      await assignUniversity({
        challengeId: id,
        compatibility: assignmentCandidate,
        assignedBy: userProfile.uid,
      })
      setAssignmentCandidate(null)
      setCompatibilities([])
      await load()
    } catch (err) {
      setActionError(err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'Assignment failed.')
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
  const compatibilityView = prepareCompatibilityView(compatibilities)
  const confidence = typeof aiAnalysis?.confidence === 'number' ? aiAnalysis.confidence : null
  const urgency = typeof aiAnalysis?.urgency === 'string' ? aiAnalysis.urgency : null
  const duplicateCandidates = Array.isArray(aiAnalysis?.duplicate_candidates)
    ? aiAnalysis.duplicate_candidates.filter((candidate): candidate is { challengeId: string; similarity: number } => Boolean(candidate) && typeof candidate === 'object' && typeof (candidate as { challengeId?: unknown }).challengeId === 'string' && typeof (candidate as { similarity?: unknown }).similarity === 'number')
    : []
  const topDuplicate = duplicateCandidates[0]
  const actionNeedsComment = ['spam', 'return', 'reject', 'merge', 'link', 'keep_separate'].includes(selectedAction)

  return (
    <div>
      <PageHeader
        title={challenge.title}
        subtitle={`${challenge.location.district} · ${challenge.domain} · Submitted ${formatDate(challenge.createdAt)}`}
        actions={
          <Button variant="outline" onClick={() => navigate('/government/challenges')}>
            Back to Queue
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2" aria-label="Challenge review status">
        <Badge variant={STATUS_TONE[challenge.status]}>{STATUS_LABEL[challenge.status]}</Badge>
        {confidence !== null && <span className="text-sm text-muted-foreground">AI confidence {(confidence * 100).toFixed(1)}%</span>}
        {challenge.spamStatus === 'confirmed' && <Badge variant="destructive">Government decision: Marked as spam</Badge>}
      </div>

      <Card className="mb-6 border-primary/30" aria-labelledby="ai-review-signals-heading">
        <CardHeader><CardTitle id="ai-review-signals-heading">AI Review Signals</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">AI flags and explains. Government decides.</p>
          <div className="flex flex-wrap gap-2">
            {urgency === 'high' && <Badge variant="destructive">AI signal: High urgency</Badge>}
            {confidence !== null && confidence < 0.7 && <Badge variant="warning">AI signal: Low confidence</Badge>}
            {topDuplicate && <Badge variant="warning">Possible duplicate · {(topDuplicate.similarity * 100).toFixed(0)}% similarity</Badge>}
            {!topDuplicate && Array.isArray(aiAnalysis?.duplicate_candidates) && <Badge variant="success">No duplicate candidate detected</Badge>}
          </div>
          {!aiAnalysis && <p className="text-sm text-muted-foreground">AI review signals are not available for this challenge.</p>}
          {aiAnalysis && !topDuplicate && !Array.isArray(aiAnalysis.duplicate_candidates) && <p className="text-sm text-muted-foreground">Duplicate analysis not available.</p>}
          {topDuplicate && (
            <div className="rounded-md border border-warning/40 bg-warning/5 p-3">
              <p className="font-medium">Similar challenge detected</p>
              <p className="mt-1 text-sm text-muted-foreground">This is a similarity signal, not a merge decision.</p>
              <Button className="mt-3" size="sm" variant="outline" onClick={() => setCompareOpen(true)} disabled={!duplicateCandidate}>Compare Challenges</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader><CardTitle>Recommended Government Attention</CardTitle></CardHeader>
        <CardContent className="text-sm text-foreground/80">
          {confidence !== null && confidence < 0.7
            ? 'Low AI confidence — human review recommended. Government action remains available.'
            : topDuplicate
              ? 'Review the candidate comparison before deciding whether to merge, link, or keep the challenges separate.'
              : 'Review the evidence and AI problem analysis before making a lifecycle decision.'}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* AI Analysis */}
          {aiAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle>AI Problem Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                  {typeof aiAnalysis.problemSummary === 'string' && (
                    <div className="sm:col-span-2 rounded-md border border-border bg-muted/20 p-3">
                      <dt className="text-muted-foreground">Problem Summary</dt>
                      <dd className="mt-1 font-medium">{aiAnalysis.problemSummary}</dd>
                    </div>
                  )}
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
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground">Required Facilities</dt>
                    <dd className="mt-1 flex flex-wrap gap-1.5">
                      {Array.isArray(aiAnalysis.requiredFacilities) && aiAnalysis.requiredFacilities.map((facility: string, i: number) => (
                        <Badge key={i} variant="secondary">{facility}</Badge>
                      ))}
                    </dd>
                  </div>
                  {typeof aiAnalysis.duplicateSearchText === 'string' && (
                    <div className="sm:col-span-2">
                      <dt className="text-muted-foreground">Duplicate Analysis</dt>
                      <dd className="mt-0.5 text-foreground/80">{aiAnalysis.duplicateSearchText}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Government-only deterministic comparison; routing remains a human decision. */}
          {(challenge.status === 'validated' || challenge.status === 'university_assigned') && (
            <Card>
              <CardHeader>
                <CardTitle>University Compatibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Compare how well each verified university fits the challenge requirements.
                  Government makes the final routing decision.
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span><span className="mr-1 text-success">●</span>Strong compatibility 80–100</span>
                  <span><span className="mr-1 text-warning">●</span>Moderate compatibility 40–79.9</span>
                  <span><span className="mr-1 text-destructive">●</span>Low compatibility 0–39.9</span>
                </div>
                {challenge.status === 'validated' && compatibilities.length === 0 && (
                  <div>
                    <p className="mb-1 text-sm font-medium">University Matching Not Run</p>
                    <p className="mb-3 text-sm text-muted-foreground">Run the matching engine to compare this challenge against verified university capabilities.</p>
                    {challenge.matchingStatus === 'completed' && <p className="mb-3 text-xs text-muted-foreground">A prior matching run persisted qualifying routing matches. Start a new comparison to view the full evaluated list.</p>}
                    <Button
                      onClick={handleRunMatching}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Matching...' : 'Run University Matching'}
                    </Button>
                  </div>
                )}

                {challenge.status === 'university_assigned' ? (
                  <div className="rounded-md border border-success/40 bg-success/5 p-3 text-sm">
                    <p className="font-medium">Assigned to {challenge.assignedUniversityName ?? challenge.assignedUniversityId}</p>
                    <p className="mt-1 text-muted-foreground">Awaiting university acceptance.</p>
                  </div>
                ) : compatibilityView.universities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">University Matching Not Run</p>
                ) : (
                  <div>
                    <p className="mb-2 text-sm font-medium">{compatibilityView.universities.length} universities evaluated</p>
                    <p className="mb-3 text-sm text-muted-foreground">
                      {compatibilityView.counts.strong} Strong compatibility · {compatibilityView.counts.moderate} Moderate compatibility · {compatibilityView.counts.low} Low compatibility
                    </p>
                    {compatibilityView.counts.strong + compatibilityView.counts.moderate === 0 && (
                      <p className="mb-3 text-sm text-muted-foreground">All universities were evaluated. None reached the meaningful compatibility threshold of 40/100.</p>
                    )}
                    <ul className="space-y-2">
                      {compatibilityView.universities.map((item) => {
                        const state = compatibilityState(item.score)
                        const tone = state === 'strong' ? 'border-success/40 bg-success/5' : state === 'moderate' ? 'border-warning/40 bg-warning/5' : 'border-destructive/30 bg-destructive/5'
                        return (
                          <li key={item.university.id} className={`rounded-md border px-3 py-3 text-sm ${tone}`}>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="font-medium">#{item.rank} {item.university.name}</p>
                                <p className="text-muted-foreground">{item.university.district}</p>
                              </div>
                              <div className="text-left sm:text-right">
                                <p className="font-medium">{item.score.toFixed(1)} / 100</p>
                                <p className="text-muted-foreground">{compatibilityLabel(state)}</p>
                              </div>
                            </div>
                            <details className="mt-3 border-t border-border/70 pt-2">
                              <summary className="cursor-pointer font-medium">Why this score?</summary>
                              <dl className="mt-2 grid gap-1 text-muted-foreground sm:grid-cols-2">
                                <div>Expertise <span className="float-right text-foreground">{item.factors.expertise}</span></div>
                                <div>Facilities <span className="float-right text-foreground">{item.factors.facilities}</span></div>
                                <div>Previous Projects <span className="float-right text-foreground">{item.factors.previousProjects}</span></div>
                                <div>Student Capability <span className="float-right text-foreground">{item.factors.studentCapability}</span></div>
                                <div>Location <span className="float-right text-foreground">{item.factors.location}</span></div>
                                <div className="font-medium text-foreground">Final compatibility <span className="float-right">{item.score.toFixed(1)} / 100</span></div>
                              </dl>
                            </details>
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                              {state === 'low' && <p className="text-xs text-muted-foreground">Low compatibility — review factors before assigning.</p>}
                              <Button size="sm" className="ml-auto" onClick={() => setAssignmentCandidate(item)}>Assign to University</Button>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}

                {actionError && (
                  <p className="text-sm text-destructive">{actionError}</p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Description</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{challenge.description}</p></CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Challenge Details</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Domain</dt><dd className="mt-0.5 font-medium">{challenge.domain}</dd></div>
                <div><dt className="text-muted-foreground">District</dt><dd className="mt-0.5 font-medium">{challenge.location.district}</dd></div>
                <div className="sm:col-span-2"><dt className="text-muted-foreground">Tags</dt><dd className="mt-1 flex flex-wrap gap-1.5">{challenge.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}</dd></div>
              </dl>
            </CardContent>
          </Card>

          {Array.isArray(challenge.evidence) && challenge.evidence.length > 0 && (
            <Card><CardHeader><CardTitle>Evidence</CardTitle></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2">{challenge.evidence.map((url, i) => <div key={i} className="overflow-hidden rounded-md border border-border"><img src={url} alt={`Evidence photo ${i + 1} for ${challenge.title}`} className="aspect-video w-full object-cover" loading="lazy" /></div>)}</div></CardContent></Card>
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
                        <time className="text-xs text-muted-foreground">
                          {formatDate(item.createdAt)}
                        </time>
                      </div>
                      <p className="mt-1 text-sm font-medium">Government · {reviewActionLabel(item.action)}</p>
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
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Government decision</p>
                <div>
                  <Label htmlFor="government-decision">Select action</Label>
                  <select id="government-decision" value={selectedAction} onChange={(event) => {
                    const action = event.target.value
                    setSelectedAction(action)
                    if (topDuplicate && ['merge', 'link', 'keep_separate'].includes(action)) setMergeTargetId(topDuplicate.challengeId)
                  }} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">Select action...</option>
                    {challenge.status === 'submitted' && <>
                      <option value="under_review">Start Review</option>
                      <option value="spam">Mark as Spam</option>
                    </>}
                    {challenge.status === 'under_review' && <>
                      <option value="validate">Validate</option>
                      <option value="return">Return</option>
                      <option value="reject">Reject</option>
                      {topDuplicate && <>
                        <option value="merge">Merge</option>
                        <option value="link">Link Related</option>
                        <option value="keep_separate">Keep Separate</option>
                      </>}
                    </>}
                  </select>
                </div>
                {selectedAction && <p className="text-sm font-medium">Selected: {({ under_review: 'Under Review', spam: 'Mark as Spam', validate: 'Validate', return: 'Return', reject: 'Reject', merge: 'Merge', link: 'Link Related', keep_separate: 'Keep Separate' } as Record<string, string>)[selectedAction]}</p>}

                {(selectedAction === 'merge' || selectedAction === 'link' || selectedAction === 'keep_separate') && (
                  <div>
                    <Label className="text-sm font-medium">
                      {selectedAction === 'merge' ? 'Merge into challenge' : 'Related challenge'}
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
                                : selectedAction === 'spam'
                                  ? 'Provide the Government reason for marking this challenge as spam...'
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
                  disabled={!selectedAction || actionLoading || (actionNeedsComment && !comment.trim())}
                  className="w-full"
                  variant={selectedAction === 'reject' ? 'destructive' : 'default'}
                >
                  {actionLoading ? 'Processing...' : 'Confirm Government Decision'}
                </Button>

              </CardContent>
            </Card>
          )}

        </div>
      </div>
      <Dialog open={assignmentCandidate !== null} onOpenChange={(open) => !open && setAssignmentCandidate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign to University</DialogTitle>
            <DialogDescription>
              Assign challenge to {assignmentCandidate?.university.name}?
            </DialogDescription>
          </DialogHeader>
          {assignmentCandidate && <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
            <p>Compatibility: <span className="font-medium">{assignmentCandidate.score.toFixed(1)} / 100</span></p>
            <p className="text-muted-foreground">{compatibilityLabel(compatibilityState(assignmentCandidate.score))}</p>
          </div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignmentCandidate(null)} disabled={actionLoading}>Cancel</Button>
            <Button onClick={() => void handleConfirmAssignment()} disabled={actionLoading}>{actionLoading ? 'Assigning...' : 'Assign to University'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compare Challenges</DialogTitle>
            <DialogDescription>Similarity is decision support. Government decides whether to merge, link, or keep these records separate.</DialogDescription>
          </DialogHeader>
          {duplicateCandidate && topDuplicate ? <>
            <p className="text-sm font-medium">Recorded similarity: {(topDuplicate.similarity * 100).toFixed(0)}%</p>
            <div className="grid gap-4 md:grid-cols-2">
              {[{ label: 'Current challenge', item: challenge }, { label: 'Possible duplicate', item: duplicateCandidate }].map(({ label, item }) => <section key={label} className="min-w-0 rounded-md border border-border p-4">
                <h3 className="font-serif text-lg font-semibold">{label}</h3>
                <dl className="mt-3 space-y-3 text-sm">
                  <div><dt className="text-muted-foreground">Title</dt><dd className="font-medium">{item.title}</dd></div>
                  <div><dt className="text-muted-foreground">Description</dt><dd className="whitespace-pre-wrap">{item.description}</dd></div>
                  <div><dt className="text-muted-foreground">Domain</dt><dd>{item.domain}</dd></div>
                  <div><dt className="text-muted-foreground">Tags</dt><dd>{item.tags.join(', ') || 'None'}</dd></div>
                  <div><dt className="text-muted-foreground">District</dt><dd>{item.location.district}</dd></div>
                  <div><dt className="text-muted-foreground">Submitted</dt><dd>{formatDate(item.createdAt)}</dd></div>
                  <div><dt className="text-muted-foreground">Evidence</dt><dd>{item.evidence.length} item{item.evidence.length === 1 ? '' : 's'}</dd></div>
                </dl>
              </section>)}
            </div>
            <p className="text-sm text-muted-foreground">Phrase-level overlap is not shown because the current similarity data does not expose reliable overlapping phrases.</p>
          </> : <p className="text-sm text-muted-foreground">The candidate record is not available for comparison.</p>}
          <DialogFooter><Button variant="outline" onClick={() => setCompareOpen(false)}>Close comparison</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
