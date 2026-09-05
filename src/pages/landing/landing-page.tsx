import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/context/auth-context'
import { getRoleHomePath } from '@/lib/roles'
import { Spinner } from '@/components/feedback/loading-state'
import { PageContainer } from '@/components/shell/page-container'

import { LandingNav } from './landing-nav'
import { LandingHero } from './landing-hero'
import { LandingEcosystem } from './landing-ecosystem'
import { LandingJourney } from './landing-journey'
import { LandingChallenges } from './landing-challenges'
import { LandingAiBoundary } from './landing-ai-boundary'
import { LandingMatching } from './landing-matching'
import { LandingGovernance } from './landing-governance'
import { LandingFinalCta } from './landing-final-cta'
import { LandingFooter } from './landing-footer'

export function LandingPage() {
  const { firebaseUser, userProfile, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && firebaseUser && userProfile) {
      navigate(getRoleHomePath(userProfile.role), { replace: true })
    }
  }, [isLoading, firebaseUser, userProfile, navigate])

  if (isLoading) {
    return (
      <div className="landing flex min-h-screen items-center justify-center bg-[var(--landing-ivory)]">
        <PageContainer className="flex items-center justify-center py-24">
          <Spinner className="text-[var(--landing-amber)]" />
        </PageContainer>
      </div>
    )
  }

  if (firebaseUser && userProfile) {
    return null
  }

  return (
    <div className="landing min-h-screen bg-[var(--landing-ivory)] font-sans text-[var(--landing-ink)] antialiased">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-[var(--landing-amber)] focus:px-4 focus:py-2 focus:text-[var(--landing-cream)]"
      >
        Skip to content
      </a>
      <LandingNav />
      <main id="main-content">
        <LandingHero />
        <LandingEcosystem />
        <LandingJourney />
        <LandingChallenges />
        <LandingAiBoundary />
        <LandingMatching />
        <LandingGovernance />
        <LandingFinalCta />
      </main>
      <LandingFooter />
    </div>
  )
}