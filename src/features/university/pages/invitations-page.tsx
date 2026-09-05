import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { PageHeader } from '@/components/shell/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingState } from '@/components/feedback/loading-state'
import { ErrorState } from '@/components/feedback/error-state'
import { EmptyState } from '@/components/feedback/empty-state'
import {
  getStudentInvitations,
  respondToInvitation,
  getTeam,
} from '@/lib/team-service'
import { getChallenge } from '@/lib/challenge-service'
import type { TeamInvitation } from '@/types/team'
import type { Challenge } from '@/types/challenge'
import type { Team } from '@/types/team'

const STATUS_TONE: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'muted'> = {
  pending: 'default',
  accepted: 'success',
  declined: 'destructive',
}

const STATUS_LABEL: Record<string, string> = {
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

export function InvitationsPage() {
  const { userProfile } = useAuth()
  const isStudent = userProfile?.role === 'student'

  const [invitations, setInvitations] = useState<TeamInvitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [respondingTo, setRespondingTo] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userProfile?.uid || !isStudent) { setInvitations([]); setIsLoading(false); return }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getStudentInvitations(userProfile.uid)
      setInvitations(data)
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to load invitations.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [userProfile, isStudent])

  useEffect(() => {
    void load()
  }, [load])

  if (!isStudent) return <div><PageHeader title="My Invitations" subtitle="Student invitations are shown only to the invited student." /><EmptyState title="No student invitations" description="Faculty manage teams from accepted challenges; university administrators review matches." /></div>

  const handleRespond = async (invitationId: string, response: 'accepted' | 'declined') => {
    if (!userProfile?.uid) return

    setRespondingTo(invitationId)
    setError(null)

    try {
      await respondToInvitation({
        invitationId,
        studentUid: userProfile.uid,
        response,
      })

      // Reload to get updated status
      await load()
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to respond to invitation.'
      setError(msg)
    } finally {
      setRespondingTo(null)
    }
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader title="My Invitations" subtitle="Team invitations sent to you." />
        <LoadingState label="Loading invitations..." />
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <PageHeader title="My Invitations" subtitle="Team invitations sent to you." />
        <ErrorState message={error} onAction={load} />
      </div>
    )
  }

  if (invitations.length === 0) {
    return (
      <div>
        <PageHeader title="My Invitations" subtitle="Team invitations sent to you." />
        <EmptyState
          title="No invitations yet"
          description="You have not received any team invitations. Faculty members will invite you to join teams working on validated challenges."
        />
      </div>
    )
  }

  const pendingInvitations = invitations.filter((i) => i.status === 'pending')
  const respondedInvitations = invitations.filter((i) => i.status !== 'pending')

  return (
    <div>
      <PageHeader
        title="My Invitations"
        subtitle={`${invitations.length} invitation${invitations.length === 1 ? '' : 's'} total.`}
      />

      {error && (
        <div className="mb-6 rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Pending invitations */}
      {pendingInvitations.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">Pending Invitations</h2>
          <div className="space-y-4">
            {pendingInvitations.map((invitation) => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                isResponding={respondingTo === invitation.id}
                onAccept={() => handleRespond(invitation.id, 'accepted')}
                onDecline={() => handleRespond(invitation.id, 'declined')}
              />
            ))}
          </div>
        </div>
      )}

      {/* Responded invitations */}
      {respondedInvitations.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Past Invitations</h2>
          <div className="space-y-4">
            {respondedInvitations.map((invitation) => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                isResponding={respondingTo === invitation.id}
                onAccept={() => handleRespond(invitation.id, 'accepted')}
                onDecline={() => handleRespond(invitation.id, 'declined')}
                readOnly
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function InvitationCard({
  invitation,
  isResponding,
  onAccept,
  onDecline,
  readOnly = false,
}: {
  invitation: TeamInvitation
  isResponding: boolean
  onAccept: () => void
  onDecline: () => void
  readOnly?: boolean
}) {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(true)

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const teamData = await getTeam(invitation.teamId)
        setTeam(teamData)

        if (teamData) {
          const challengeData = await getChallenge(teamData.challengeId)
          setChallenge(challengeData)
        }
      } catch {
        // Non-critical: details may fail to load
      } finally {
        setIsLoadingDetails(false)
      }
    }

    void loadDetails()
  }, [invitation.teamId])

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={STATUS_TONE[invitation.status]}>
                {STATUS_LABEL[invitation.status]}
              </Badge>
              {invitation.status === 'pending' && (
                <span className="text-xs text-muted-foreground">
                  Sent {formatDate(invitation.createdAt)}
                </span>
              )}
              {invitation.respondedAt && (
                <span className="text-xs text-muted-foreground">
                  Responded {formatDate(invitation.respondedAt)}
                </span>
              )}
            </div>

            {isLoadingDetails ? (
              <p className="text-sm text-muted-foreground">Loading details...</p>
            ) : (
              <div className="space-y-2">
                {challenge && (
                  <div>
                    <h3 className="font-medium text-sm">{challenge.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      Domain: {challenge.domain}
                    </p>
                  </div>
                )}
                {team && (
                  <div className="text-xs text-muted-foreground">
                    <p>Faculty Lead: {team.facultyLeadId.slice(0, 12)}...</p>
                    <p>Team Status: {team.status}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {!readOnly && invitation.status === 'pending' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={onAccept}
                disabled={isResponding}
              >
                {isResponding ? 'Processing...' : 'Accept'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onDecline}
                disabled={isResponding}
              >
                Decline
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
