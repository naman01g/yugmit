import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import { PageHeader } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingState } from '@/components/feedback/loading-state'
import { ErrorState } from '@/components/feedback/error-state'
import { getTeam, getTeamInvitations } from '@/lib/team-service'
import { getChallenge } from '@/lib/challenge-service'
import type { Team, TeamInvitation } from '@/types/team'
import type { Challenge } from '@/types/challenge'

const STATUS_TONE: Record<string, 'default' | 'success' | 'warning' | 'muted'> = {
  forming: 'warning',
  active: 'success',
  pending: 'default',
  accepted: 'success',
  declined: 'muted',
}

const STATUS_LABEL: Record<string, string> = {
  forming: 'Forming',
  active: 'Active',
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
}

export function UniversityTeamPage() {
  const { id: teamId } = useParams<{ id: string }>()
  const { userProfile } = useAuth()
  const [team, setTeam] = useState<Team | null>(null)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [invitations, setInvitations] = useState<TeamInvitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isFaculty = userProfile?.role === 'faculty'

  const load = useCallback(async () => {
    if (!teamId) return
    setIsLoading(true)
    setError(null)
    try {
      const teamData = await getTeam(teamId)
      if (!teamData) {
        setError('Team not found.')
        return
      }
      setTeam(teamData)

      const challengeData = await getChallenge(teamData.challengeId)
      setChallenge(challengeData)

      if (isFaculty) {
        const teamInvites = await getTeamInvitations(teamId)
        setInvitations(teamInvites)
      }
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to load team.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [teamId, isFaculty])

  useEffect(() => {
    void load()
  }, [load])

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Team" />
        <LoadingState label="Loading team details..." />
      </div>
    )
  }

  if (error || !team) {
    return (
      <div>
        <PageHeader title="Team" />
        <ErrorState message={error ?? 'Team not found.'} onAction={load} />
      </div>
    )
  }

  const accepted = invitations.filter((i) => i.status === 'accepted').length
  const pending = invitations.filter((i) => i.status === 'pending').length

  return (
    <div>
      <PageHeader
        title={challenge?.title ?? 'Team'}
        subtitle={`${team.universityId} · ${STATUS_LABEL[team.status]}`}
        actions={
          challenge && userProfile?.role === 'faculty' ? (
            <Link
              className="text-sm text-primary hover:underline"
              to={`/university/challenges/${challenge.id}/team`}
            >
              Open team formation
            </Link>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Challenge</CardTitle>
            </CardHeader>
            <CardContent>
              {challenge ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{challenge.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {challenge.domain} · {challenge.location.district}
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                    {challenge.description}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Challenge details are only shown to authorized members.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{isFaculty ? 'Invitations' : 'Team members'}</CardTitle>
            </CardHeader>
            <CardContent>
              {isFaculty ? (
                invitations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No invitations sent yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {invitations.map((invite) => (
                      <li key={invite.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                        <span className="font-mono text-xs break-all">{invite.studentUid}</span>
                        <Badge variant={STATUS_TONE[invite.status] as 'default' | 'success' | 'warning' | 'muted'}>
                          {STATUS_LABEL[invite.status]}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )
              ) : (
                <ul className="space-y-2">
                  {team.memberIds.map((uid) => (
                    <li key={uid} className="rounded-md border border-border p-3 font-mono text-xs break-all">
                      {uid}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <Badge variant={STATUS_TONE[team.status] as 'default' | 'success' | 'warning'}>
                  {STATUS_LABEL[team.status]}
                </Badge>
              </div>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Faculty lead</dt>
                  <dd className="mt-0.5 font-mono text-xs break-all">{team.facultyLeadId}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Members</dt>
                  <dd className="mt-0.5">{team.memberIds.length}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {isFaculty && team.status === 'forming' && (
            <Card>
              <CardHeader>
                <CardTitle>Invitation summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Accepted</span>
                  <span className="font-medium text-success">{accepted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-medium">{pending}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}