import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function LandingFinalCta() {
  return (
    <section
      aria-label="Get started"
      className="border-b border-[var(--landing-line)] bg-[var(--landing-coal)] text-[var(--landing-on-coal)]"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl"
            lang="hi"
          >
            आपके क्षेत्र की समस्या, किसी की अगली परियोजना बन सकती है।
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed opacity-80">
            A problem in your community could become someone's next solution
            project.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="w-full bg-[var(--landing-amber)] text-[var(--landing-cream)] hover:bg-[var(--landing-amber-soft)] active:bg-[var(--landing-amber-soft)] sm:w-auto"
            >
              <Link to="/citizen/challenges/new">
                <span lang="hi" className="font-medium">
                  समस्या साझा करें
                </span>
                <span aria-hidden="true" className="opacity-80">
                  |
                </span>
                <span>Submit a Challenge</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="w-full border-[var(--landing-line)]/60 bg-transparent text-[var(--landing-on-coal)] hover:bg-[var(--landing-coal-soft)] hover:text-[var(--landing-on-coal)] sm:w-auto"
            >
              <Link to="/login">
                <span lang="hi" className="font-medium">
                  YUGMIT में प्रवेश करें
                </span>
                <span className="hidden sm:inline" aria-hidden="true">
                  &nbsp;|&nbsp;
                </span>
                <span className="hidden sm:inline">Sign in</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}