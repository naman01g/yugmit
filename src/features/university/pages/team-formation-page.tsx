import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import { PageHeader } from '@/components/shell/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { LoadingState } from '@/components/feedback/loading-state'
import { ErrorState } from '@/components/feedback/error-state'
import { getTeamByChallengeId, createTeam, createInvitations, getTeamInvitations, activateTeam } from '@/lib/team-service'
import { getChallenge } from '@/lib/challenge-service'
import { getUniversityStudents } from '@/lib/university-service'
import { isMatchAccepted } from '@/lib/university-acceptance-service'
import type { Team, TeamInvitation } from '@/types/team'
import type { Challenge } from '@/types/challenge'
import type { UserProfile } from '@/types/user'
import { MIN_TEAM_SIZE, MAX_TEAM_SIZE } from '@/types/team'

const STATUS_TONE: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'muted'> = {
  forming: 'warning',
  active: 'success',
  pending: 'default',
  accepted: 'success',
  declined: 'destructive',
}

const STATUS_LABEL: Record<string, string> = {
  forming: 'Forming',
  active: 'Active',
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
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

export function TeamFormationPage() {
  const { id: challengeId } = useParams<{ id: string }>()
  const { userProfile } = useAuth()
  const navigate = useNavigate()

  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [students, setStudents] = useState<UserProfile[]>([])
  const [invitations, setInvitations] = useState<TeamInvitation[]>([])
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isActivating, setIsActivating] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isAccepted, setIsAccepted] = useState(false)

  const load = useCallback(async () => {
    if (!challengeId || !userProfile) return

    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // Load challenge
      const challengeData = await getChallenge(challengeId)
      if (!challengeData) {
        setError('Challenge not found.')
        return
      }
      setChallenge(challengeData)

      // Load existing team
      const existingTeam = await getTeamByChallengeId(challengeId)
      setTeam(existingTeam)

      // Load accepted status
      if (userProfile.universityId) {
        const accepted = await isMatchAccepted(challengeId, userProfile.universityId)
        setIsAccepted(accepted)
      }

      // Load students for this university
      if (userProfile.universityId) {
        const universityStudents = await getUniversityStudents(userProfile.universityId)
        setStudents(universityStudents)
      }

      // Load invitations if team exists
      if (existingTeam) {
        const teamInvites = await getTeamInvitations(existingTeam.id)
        setInvitations(teamInvites)
      }
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to load team formation data.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [challengeId, userProfile])

  useEffect(() => {
    void load()
  }, [load])

  const handleCreateTeam = async () => {
    if (!challengeId || !userProfile?.universityId || !userProfile?.uid) return

    setIsCreating(true)
    setError(null)

    try {
      await createTeam({
        challengeId,
        universityId: userProfile.universityId,
        facultyLeadId: userProfile.uid,
      })

      setSuccessMessage('Team created successfully. Now select students to invite.')

      // Reload to get the new team
      await load()
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to create team.'
      setError(msg)
    } finally {
      setIsCreating(false)
    }
  }

  const handleSendInvitations = async () => {
    if (!team || !userProfile?.uid) return

    const selectedArray = Array.from(selectedStudents)
    if (selectedArray.length < MIN_TEAM_SIZE || selectedArray.length > MAX_TEAM_SIZE) {
      setError(`Please select ${MIN_TEAM_SIZE}-${MAX_TEAM_SIZE} students.`)
      return
    }

    setIsSending(true)
    setError(null)

    try {
      await createInvitations({
        teamId: team.id,
        facultyId: userProfile.uid,
        studentUids: selectedArray,
      })

      setSuccessMessage('Invitations sent successfully.')
      setSelectedStudents(new Set())

      // Reload to get updated invitations
      await load()
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to send invitations.'
      setError(msg)
    } finally {
      setIsSending(false)
    }
  }

  const handleActivateTeam = async () => {
    if (!team || !userProfile?.uid) return

    setIsActivating(true)
    setError(null)

    try {
      await activateTeam({
        teamId: team.id,
        facultyLeadId: userProfile.uid,
      })
      setSuccessMessage('Team activated. Members can now create the solution proposal.')
      await load()
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to activate team.'
      setError(msg)
    } finally {
      setIsActivating(false)
    }
  }

  const toggleStudent = (uid: string) => {
    setSelectedStudents((prev) => {
      const next = new Set(prev)
      if (next.has(uid)) {
        next.delete(uid)
      } else {
        if (next.size < MAX_TEAM_SIZE) {
          next.add(uid)
        }
      }
      return next
    })
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Team Formation" />
        <LoadingState label="Loading team formation data..." />
      </div>
    )
  }

  if (error && !challenge) {
    return (
      <div>
        <PageHeader title="Team Formation" />
        <ErrorState message={error} onAction={load} />
      </div>
    )
  }

  if (!challenge) return null

  const isFaculty = userProfile?.role === 'faculty'
  const isTeamForming = team?.status === 'forming'
  const acceptedCount = invitations.filter((i) => i.status === 'accepted').length
  const pendingCount = invitations.filter((i) => i.status === 'pending').length

  return (
    <div>
      <PageHeader
        title={`Team Formation: ${challenge.title}`}
        subtitle={`Challenge Domain: ${challenge.domain}`}
        actions={
          <Button variant="outline" onClick={() => navigate('/university/challenges')}>
            Back to Challenges
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
          {/* Challenge Info */}
          <Card>
            <CardHeader>
              <CardTitle>Challenge Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                {challenge.description}
              </p>
              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Domain</dt>
                  <dd className="mt-0.5 font-medium">{challenge.domain}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">District</dt>
                  <dd className="mt-0.5 font-medium">{challenge.location.district}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* No team yet - create team */}
          {!team && !isAccepted && (
            <Card>
              <CardHeader>
                <CardTitle>Awaiting University Acceptance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This challenge must be accepted by your university before a team can be
                  formed. The university administrator can accept the match from the
                  matched challenges view.
                </p>
              </CardContent>
            </Card>
          )}

          {/* No team yet - create team */}
          {!team && isAccepted && isFaculty && (
            <Card>
              <CardHeader>
                <CardTitle>Create Team</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  No team exists for this challenge yet. Create a team to start inviting students.
                </p>
                <Button onClick={handleCreateTeam} disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Team'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Student selection */}
          {team && isTeamForming && isFaculty && (
            <Card>
              <CardHeader>
                <CardTitle>Select Students to Invite</CardTitle>
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No students found for your university. Students must be registered in the system.
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      Select {MIN_TEAM_SIZE}-{MAX_TEAM_SIZE} students to form a team. Currently selected: {selectedStudents.size}
                    </p>
                    <div className="space-y-2">
                      {students.map((student) => {
                        const isInvited = invitations.some((i) => i.studentUid === student.uid)
                        const isSelected = selectedStudents.has(student.uid)

                        return (
                          <div
                            key={student.uid}
                            className={`flex items-center justify-between rounded-md border p-3 ${
                              isInvited
                                ? 'border-success/20 bg-success/5'
                                : isSelected
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {!isInvited && (
                                <button
                                  type="button"
                                  onClick={() => toggleStudent(student.uid)}
                                  className={`flex size-5 shrink-0 items-center justify-center rounded border ${
                                    isSelected
                                      ? 'border-primary bg-primary text-primary-foreground'
                                      : 'border-border bg-background'
                                  }`}
                                  aria-label={`Select ${student.name}`}
                                >
                                  {isSelected && (
                                    <svg viewBox="0 0 16 16" fill="none" className="size-3">
                                      <path d="M3 8.5l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                </button>
                              )}
                              <div>
                                <Label className="font-medium cursor-pointer">
                                  {student.name}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  {student.email}
                                </p>
                              </div>
                            </div>
                            {isInvited && (
                              <Badge variant="success" className="text-xs">
                                Invited
                              </Badge>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button
                        onClick={handleSendInvitations}
                        disabled={isSending || selectedStudents.size < MIN_TEAM_SIZE}
                      >
                        {isSending ? 'Sending...' : `Send Invitations (${selectedStudents.size})`}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedStudents(new Set())}
                      >
                        Clear Selection
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Invitations list */}
          {team && invitations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Invitations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invitations.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between rounded-md border border-border p-3"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          Student {invite.studentUid.slice(0, 8)}...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Sent {formatDate(invite.createdAt)}
                          {invite.respondedAt && ` · Responded ${formatDate(invite.respondedAt)}`}
                        </p>
                      </div>
                      <Badge variant={STATUS_TONE[invite.status]}>
                        {STATUS_LABEL[invite.status]}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team Status */}
          <Card>
            <CardHeader>
              <CardTitle>Team Status</CardTitle>
            </CardHeader>
            <CardContent>
              {team ? (
                <div className="space-y-4">
                  <div>
                    <dt className="text-xs text-muted-foreground">Status</dt>
                    <dd className="mt-1">
                      <Badge variant={STATUS_TONE[team.status]} className="text-sm">
                        {STATUS_LABEL[team.status]}
                      </Badge>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Faculty Lead</dt>
                    <dd className="mt-1 font-mono text-xs break-all">
                      {team.facultyLeadId}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Members</dt>
                    <dd className="mt-1 text-sm">
                      {team.memberIds.length} student{team.memberIds.length !== 1 ? 's' : ''}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Created</dt>
                    <dd className="mt-1 text-sm">{formatDate(team.createdAt)}</dd>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No team created yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Invitation Summary */}
          {team && (
            <Card>
              <CardHeader>
                <CardTitle>Invitation Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="font-medium">{pendingCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Accepted</span>
                    <span className="font-medium text-success">{acceptedCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Declined</span>
                    <span className="font-medium text-destructive">
                      {invitations.filter((i) => i.status === 'declined').length}
                    </span>
                  </div>
                  <div className="border-t border-border pt-2 mt-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Team Size Goal</span>
                      <span>{MIN_TEAM_SIZE}-{MAX_TEAM_SIZE}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Team Activation Info */}
          {team && isTeamForming && (
            <Card>
              <CardHeader>
                <CardTitle>Team Activation</CardTitle>
              </CardHeader>
              <CardContent>
                {isFaculty ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      The team is ready to activate once {MIN_TEAM_SIZE}-{MAX_TEAM_SIZE}
                      students have accepted their invitations.
                    </p>
                    <div className="mt-3">
                      <div className="text-sm font-medium">
                        {acceptedCount} of {MIN_TEAM_SIZE} required acceptances
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-success transition-all"
                          style={{ width: `${Math.min(100, (acceptedCount / MIN_TEAM_SIZE) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <Button
                      className="mt-4 w-full"
                      size="sm"
                      disabled={isActivating || acceptedCount < MIN_TEAM_SIZE}
                      onClick={() => void handleActivateTeam()}
                    >
                      {isActivating
                        ? 'Activating...'
                        : acceptedCount >= MIN_TEAM_SIZE
                          ? `Activate Team (${acceptedCount} accepted)`
                          : 'Waiting for acceptances'}
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    The faculty lead will activate the team once enough students
                    have accepted their invitations.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Solution Proposal entry */}
          {team && team.status === 'active' && (
            <Card>
              <CardHeader>
                <CardTitle>Solution Proposal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  The team is active. Create or review the solution proposal for this challenge.
                </p>
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => navigate(`/university/proposals/${team.id}`)}
                >
                  Open Solution Proposal
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
