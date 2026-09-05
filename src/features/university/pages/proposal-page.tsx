import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import { PageHeader } from '@/components/shell/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { LoadingState } from '@/components/feedback/loading-state'
import { ErrorState } from '@/components/feedback/error-state'
import {
  getProposalByTeam,
  createDraft,
  updateDraft,
  submitProposal,
} from '@/features/proposals/services/proposal-service'
import { getProposalTeamContext } from '@/features/proposals/services/proposal-team-context'
import { getUniversityName } from '@/lib/university-service'
import type { Proposal, ProposalContent, ProposalStatus } from '@/types/proposal'
import { PROPOSAL_STATUS_LABEL, isProposalEditable } from '@/types/proposal'
import { fieldLimit } from '@/lib/proposal-validator'

const STATUS_TONE: Record<ProposalStatus, 'default' | 'success' | 'warning' | 'destructive' | 'muted'> = {
  draft: 'warning',
  submitted: 'default',
  government_review: 'success',
}

export interface ProposalTeamContext {
  team: {
    id: string
    status: string
    facultyLeadId: string
    memberIds: string[]
    challengeId: string
    universityId: string
  } | null
  challenge: {
    id: string
    title: string
    description: string
    domain: string
    status: string
  } | null
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

const EMPTY_CONTENT: ProposalContent = {
  title: '',
  solutionDescription: '',
  implementationPlan: '',
  estimatedCost: '',
  timeline: '',
  expectedImpact: '',
}

export function UniversityProposalPage() {
  const { id } = useParams<{ id: string }>()
  const teamId = id ?? ''
  const { userProfile } = useAuth()
  const navigate = useNavigate()

  const [context, setContext] = useState<ProposalTeamContext | null>(null)
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [universityName, setUniversityName] = useState<string>('')
  const [content, setContent] = useState<ProposalContent>(EMPTY_CONTENT)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    if (!teamId || !userProfile?.uid || !userProfile?.universityId) return
    setIsLoading(true)
    setError(null)
    setSaveMessage(null)

    try {
      const ctx = await getProposalTeamContext(teamId)
      setContext(ctx)

      if (ctx?.challenge?.id && userProfile.universityId) {
        const uni = await getUniversityName(userProfile.universityId)
        setUniversityName(uni)
      }

      if (ctx?.team) {
        if (ctx.team.status !== 'active') {
          setProposal(null)
        } else {
          const existing = await getProposalByTeam({
            teamId,
            challengeId: ctx.team.challengeId,
            universityId: ctx.team.universityId,
            uid: userProfile.uid,
          })
          setProposal(existing)
          if (existing) {
            setContent({
              title: existing.title,
              solutionDescription: existing.solutionDescription,
              implementationPlan: existing.implementationPlan,
              estimatedCost: existing.estimatedCost,
              timeline: existing.timeline,
              expectedImpact: existing.expectedImpact,
            })
          }
        }
      }
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to load proposal.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [teamId, userProfile?.uid, userProfile?.universityId])

  useEffect(() => {
    void load()
  }, [load])

  const updateField = (field: keyof ProposalContent, value: string) => {
    setContent((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleSaveDraft = async () => {
    if (!userProfile?.uid || !userProfile?.universityId) return
    const ctx = context
    if (!ctx?.team || !ctx.challenge) return

    setIsSaving(true)
    setError(null)
    setSaveMessage(null)

    try {
      if (proposal) {
        await updateDraft({
          proposalId: proposal.id,
          teamId: ctx.team.id,
          challengeId: ctx.team.challengeId,
          universityId: ctx.team.universityId,
          uid: userProfile.uid,
          content,
        })
      } else {
        await createDraft({
          teamId: ctx.team.id,
          challengeId: ctx.team.challengeId,
          universityId: ctx.team.universityId,
          uid: userProfile.uid,
          content,
        })
      }
      setSaveMessage('Draft saved. You can continue editing or submit when ready.')
      await load()
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to save draft.'
      setError(msg)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!userProfile?.uid || !userProfile?.universityId) return
    const ctx = context
    if (!ctx?.team || !ctx.challenge || !proposal) return

    const didConfirm = window.confirm(
      'Submit this proposal for government review? After submission the proposal will be locked and can no longer be edited by the team.',
    )
    if (!didConfirm) return

    setIsSubmitting(true)
    setError(null)

    try {
      await submitProposal({
        proposalId: proposal.id,
        teamId: ctx.team.id,
        challengeId: ctx.team.challengeId,
        universityId: ctx.team.universityId,
        uid: userProfile.uid,
      })
      setSaveMessage('Proposal submitted for government review.')
      await load()
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to submit proposal.'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Solution Proposal" />
        <LoadingState label="Loading proposal details..." />
      </div>
    )
  }

  if (error && !context) {
    return (
      <div>
        <PageHeader title="Solution Proposal" />
        <ErrorState message={error} onAction={load} />
      </div>
    )
  }

  if (!context?.team || !context?.challenge) {
    return (
      <div>
        <PageHeader title="Solution Proposal" />
        <ErrorState message="Team or challenge not found." onAction={load} />
      </div>
    )
  }

  const { team, challenge } = context
  const teamActive = team.status === 'active'
  const canEdit = teamActive && proposal !== null && isProposalEditable(proposal.status)

  return (
    <div>
      <PageHeader
        title="Solution Proposal"
        subtitle={challenge.title}
        actions={
          <Button variant="outline" onClick={() => navigate('/university/challenges')}>
            Back to Challenges
          </Button>
        }
      />

      {saveMessage && (
        <div className="mb-6 rounded-md border border-success/20 bg-success/10 p-4 text-sm text-success">
          {saveMessage}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Challenge context */}
          <Card>
            <CardHeader>
              <CardTitle>Challenge Context</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{challenge.title}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                {challenge.description}
              </p>
            </CardContent>
          </Card>

          {/* Team not active */}
          {!teamActive && (
            <Card>
              <CardHeader>
                <CardTitle>Proposal Not Yet Available</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  A solution proposal can be created once the team becomes active.
                  The team is currently {team.status === 'forming' ? 'forming' : 'inactive'}.
                </p>
              </CardContent>
            </Card>
          )}

          {/* No proposal yet */}
          {teamActive && !proposal && (
            <Card>
              <CardHeader>
                <CardTitle>Create Solution Proposal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  No proposal exists for this team yet. Create a draft to begin.
                  Saving creates a draft; submit it once complete.
                </p>
                {renderForm()}
              </CardContent>
            </Card>
          )}

          {/* Existing proposal */}
          {proposal && (
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>{proposal ? 'Proposal' : ''}</CardTitle>
                <Badge variant={STATUS_TONE[proposal.status]}>{PROPOSAL_STATUS_LABEL[proposal.status]}</Badge>
              </CardHeader>
              <CardContent>
                {canEdit ? (
                  renderForm()
                ) : (
                  renderReadOnly()
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Team Status</dt>
                  <dd className="mt-0.5">
                    <Badge variant={team.status === 'active' ? 'success' : 'warning'} className="text-xs">
                      {team.status}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Faculty Lead</dt>
                  <dd className="mt-0.5 font-mono text-xs break-all">{team.facultyLeadId}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Members</dt>
                  <dd className="mt-0.5">
                    {team.memberIds.length} member{team.memberIds.length !== 1 ? 's' : ''}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">University</dt>
                  <dd className="mt-0.5">{universityName || team.universityId}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {proposal?.status === 'submitted' && (
            <Card>
              <CardHeader>
                <CardTitle>Submission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This proposal has been submitted and is awaiting government review.
                </p>
                {proposal.submittedAt && (
                  <p className="mt-2 text-sm">
                    <span className="text-muted-foreground">Submitted: </span>
                    {formatDate(proposal.submittedAt)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {proposal?.status === 'government_review' && (
            <Card>
              <CardHeader>
                <CardTitle>Government Review</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-3">
                  <Badge variant="success">Under Government Review</Badge>
                </div>
                {proposal.governmentComment ? (
                  <div className="border-l-2 border-border pl-3">
                    <p className="text-xs text-muted-foreground">Government Review</p>
                    <p className="mt-1 text-sm text-foreground/80">{proposal.governmentComment}</p>
                    {proposal.reviewedAt && (
                      <time className="mt-1 block text-xs text-muted-foreground">
                        {formatDate(proposal.reviewedAt)}
                      </time>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No review comment yet.</p>
                )}
              </CardContent>
            </Card>
          )}

          {proposal && canEdit && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={handleSaveDraft} disabled={isSaving} className="w-full">
                  {isSaving ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  variant="default"
                  className="w-full"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit for Review'}
                </Button>
              </CardContent>
            </Card>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  )

  function renderForm() {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="proposal-title" className="text-sm font-medium">Proposal Title</Label>
          <Input
            id="proposal-title"
            value={content.title}
            onChange={(e) => updateField('title', e.target.value)}
            maxLength={fieldLimit('title')}
            placeholder="A clear, concise title for your proposed solution"
            className="mt-1.5"
          />
          <FieldHint field="title" value={content.title} error={fieldErrors.title} />
        </div>

        <div>
          <Label htmlFor="solution-description" className="text-sm font-medium">Solution Description</Label>
          <Textarea
            id="solution-description"
            value={content.solutionDescription}
            onChange={(e) => updateField('solutionDescription', e.target.value)}
            maxLength={fieldLimit('solutionDescription')}
            rows={5}
            placeholder="Describe the proposed solution, how it addresses the challenge, and the approach your team will take."
            className="mt-1.5"
          />
          <FieldHint field="solutionDescription" value={content.solutionDescription} error={fieldErrors.solutionDescription} />
        </div>

        <div>
          <Label htmlFor="implementation-plan" className="text-sm font-medium">Implementation Plan</Label>
          <Textarea
            id="implementation-plan"
            value={content.implementationPlan}
            onChange={(e) => updateField('implementationPlan', e.target.value)}
            maxLength={fieldLimit('implementationPlan')}
            rows={5}
            placeholder="Outline the steps, phases, technologies, and resources required to implement the solution."
            className="mt-1.5"
          />
          <FieldHint field="implementationPlan" value={content.implementationPlan} error={fieldErrors.implementationPlan} />
        </div>

        <div>
          <Label htmlFor="estimated-cost" className="text-sm font-medium">Estimated Cost</Label>
          <Textarea
            id="estimated-cost"
            value={content.estimatedCost}
            onChange={(e) => updateField('estimatedCost', e.target.value)}
            maxLength={fieldLimit('estimatedCost')}
            rows={3}
            placeholder="Provide an estimate of the budget required, including any major cost components."
            className="mt-1.5"
          />
          <FieldHint field="estimatedCost" value={content.estimatedCost} error={fieldErrors.estimatedCost} />
        </div>

        <div>
          <Label htmlFor="timeline" className="text-sm font-medium">Timeline</Label>
          <Textarea
            id="timeline"
            value={content.timeline}
            onChange={(e) => updateField('timeline', e.target.value)}
            maxLength={fieldLimit('timeline')}
            rows={3}
            placeholder="Describe the expected duration and any key milestones for delivery."
            className="mt-1.5"
          />
          <FieldHint field="timeline" value={content.timeline} error={fieldErrors.timeline} />
        </div>

        <div>
          <Label htmlFor="expected-impact" className="text-sm font-medium">Expected Impact</Label>
          <Textarea
            id="expected-impact"
            value={content.expectedImpact}
            onChange={(e) => updateField('expectedImpact', e.target.value)}
            maxLength={fieldLimit('expectedImpact')}
            rows={4}
            placeholder="Describe the impact the solution is expected to achieve. This is an expectation, not a measured outcome."
            className="mt-1.5"
          />
          <FieldHint field="expectedImpact" value={content.expectedImpact} error={fieldErrors.expectedImpact} />
        </div>
      </div>
    )
  }

  function renderReadOnly() {
    if (!proposal) return null
    return (
      <dl className="space-y-4 text-sm">
        <Field title="Solution Description" value={proposal.solutionDescription} />
        <Field title="Implementation Plan" value={proposal.implementationPlan} />
        <Field title="Estimated Cost" value={proposal.estimatedCost} />
        <Field title="Timeline" value={proposal.timeline} />
        <Field title="Expected Impact" value={proposal.expectedImpact} />
      </dl>
    )
  }
}

function FieldHint({ field, value, error }: { field: keyof ProposalContent; value: string; error?: string }) {
  const max = fieldLimit(field)
  if (error) {
    return <p className="mt-1 text-xs text-destructive">{error}</p>
  }
  return (
    <p className="mt-1 text-xs text-muted-foreground">
      {value.length}/{max}
    </p>
  )
}

function Field({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{title}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-foreground/80">{value}</dd>
    </div>
  )
}
