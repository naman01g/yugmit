import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '@/context/auth-context'
import { getPersonaForRole } from '@/lib/roles'
import type { Persona } from '@/types'
import { LoadingState } from '@/components/feedback/loading-state'
import { ErrorState } from '@/components/feedback/error-state'
import { PageContainer } from '@/components/shell/page-container'

interface ProtectedRouteProps {
  persona: Persona
}

/**
 * Route guard for persona-protected routes.
 *
 * - Shows loading state while auth is resolving.
 * - Redirects unauthenticated users to /login.
 * - Shows an error if the user profile is missing or has no persona.
 * - Redirects users whose role does not match the required persona to /login.
 *
 * Frontend route protection is UX only.
 * Firestore Security Rules are the actual security boundary.
 */
export function ProtectedRoute({ persona }: ProtectedRouteProps) {
  const { isLoading, firebaseUser, userProfile, profileError, logout } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <PageContainer className="flex items-center justify-center py-24">
        <LoadingState label="Loading account" />
      </PageContainer>
    )
  }

  if (!firebaseUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (profileError) {
    return (
      <PageContainer className="py-12">
        <ErrorState
          title="Profile unavailable"
          message={profileError}
          actionLabel="Sign out"
          onAction={() => void logout()}
        />
      </PageContainer>
    )
  }

  if (!userProfile) {
    return (
      <PageContainer className="py-12">
        <ErrorState
          title="No user profile"
          message="Your account exists but no profile was found. Contact an administrator."
        />
      </PageContainer>
    )
  }

  if (
    persona === 'university' &&
    (userProfile.accountStatus !== 'approved' || !userProfile.universityId)
  ) {
    return (
      <PageContainer className="py-12">
        <ErrorState
          title="Account approval required"
          message={userProfile.accountStatus === 'rejected'
            ? 'This institutional account was not approved.'
            : 'Your university account is awaiting institutional verification.'}
          actionLabel="Sign out"
          onAction={() => void logout()}
        />
      </PageContainer>
    )
  }

  const userPersona = getPersonaForRole(userProfile.role)
  if (!userPersona || userPersona !== persona) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
