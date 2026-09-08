import { RouterProvider, createBrowserRouter } from 'react-router-dom'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { PersonaShell } from '@/components/shell/persona-shell'
import { PublicShell } from '@/components/shell/public-shell'
import { LandingPage } from '@/pages/landing/landing-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { LoginPage } from '@/features/auth/pages/login-page'
import { RegisterPage } from '@/features/auth/pages/register-page'
import { CitizenOverviewPage } from '@/features/citizen/pages/overview-page'
import { CitizenChallengesPage } from '@/features/citizen/pages/challenges-page'
import { CitizenChallengeDetailPage } from '@/features/citizen/pages/challenge-detail-page'
import { NewChallengePage } from '@/features/citizen/pages/new-challenge-page'
import { GovernmentOverviewPage } from '@/features/government/pages/overview-page'
import { GovernmentChallengesPage } from '@/features/government/pages/challenges-page'
import { GovernmentChallengeDetailPage } from '@/features/government/pages/challenge-detail-page'
import { GovernmentAnalyticsPage } from '@/features/government/pages/analytics-page'
import { GovernmentProposalsPage } from '@/features/government/pages/proposals-page'
import { GovernmentProposalReviewPage } from '@/features/government/pages/proposal-review-page'
import { UniversityOverviewPage } from '@/features/university/pages/overview-page'
import { UniversityChallengesPage } from '@/features/university/pages/challenges-page'
import { UniversityChallengeDetailPage } from '@/features/university/pages/challenge-detail-page'
import { UniversityTeamPage } from '@/features/university/pages/team-page'
import { UniversityProposalPage } from '@/features/university/pages/proposal-page'
import { TeamFormationPage } from '@/features/university/pages/team-formation-page'
import { InvitationsPage } from '@/features/university/pages/invitations-page'
import { UniversityAccountsPage } from '@/features/government/pages/university-accounts-page'
import { StudentVerificationPage } from '@/features/university/pages/student-verification-page'

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  {
    element: <PublicShell />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute persona="citizen" />,
    children: [
      {
        element: <PersonaShell persona="citizen" />,
        children: [
          { path: '/citizen', element: <CitizenOverviewPage /> },
          { path: '/citizen/challenges', element: <CitizenChallengesPage /> },
          { path: '/citizen/challenges/new', element: <NewChallengePage /> },
          { path: '/citizen/challenges/:id', element: <CitizenChallengeDetailPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute persona="government" />,
    children: [
      {
        element: <PersonaShell persona="government" />,
        children: [
          { path: '/government', element: <GovernmentOverviewPage /> },
          {
            path: '/government/challenges',
            element: <GovernmentChallengesPage />,
          },
          {
            path: '/government/challenges/:id',
            element: <GovernmentChallengeDetailPage />,
          },
          {
            path: '/government/proposals',
            element: <GovernmentProposalsPage />,
          },
          {
            path: '/government/proposals/:id',
            element: <GovernmentProposalReviewPage />,
          },
          {
            path: '/government/analytics',
            element: <GovernmentAnalyticsPage />,
          },
          { path: '/government/university-accounts', element: <UniversityAccountsPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute persona="university" />,
    children: [
      {
        element: <PersonaShell persona="university" />,
        children: [
          { path: '/university', element: <UniversityOverviewPage /> },
          {
            path: '/university/challenges',
            element: <UniversityChallengesPage />,
          },
          {
            path: '/university/challenges/:id',
            element: <UniversityChallengeDetailPage />,
          },
          {
            path: '/university/challenges/:id/team',
            element: <TeamFormationPage />,
          },
          { path: '/university/team/:id', element: <UniversityTeamPage /> },
          {
            path: '/university/invitations',
            element: <InvitationsPage />,
          },
          { path: '/university/student-verification', element: <StudentVerificationPage /> },
          {
            path: '/university/proposals/:id',
            element: <UniversityProposalPage />,
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])

export function App() {
  return <RouterProvider router={router} />
}
