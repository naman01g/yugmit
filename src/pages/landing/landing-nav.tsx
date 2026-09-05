import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--landing-line)] bg-[var(--landing-ivory)]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-baseline gap-2 font-heading text-lg font-semibold tracking-tight text-[var(--landing-ink)]"
        >
          YUGMIT
        </Link>

        <nav aria-label="Section navigation" className="hidden md:block">
          <ul className="flex items-center gap-7">
            <li>
              <a
                href="#how-it-works"
                className="text-sm font-medium text-[var(--landing-ink-soft)] underline-offset-4 hover:text-[var(--landing-ink)] hover:underline"
              >
                <span lang="hi">कैसे काम करता है</span>
                <span className="ml-1.5 text-xs text-[var(--landing-muted)]">
                  How it works
                </span>
              </a>
            </li>
            <li>
              <a
                href="#challenges"
                className="text-sm font-medium text-[var(--landing-ink-soft)] underline-offset-4 hover:text-[var(--landing-ink)] hover:underline"
              >
                <span lang="hi">चुनौतियाँ</span>
                <span className="ml-1.5 text-xs text-[var(--landing-muted)]">
                  Challenges
                </span>
              </a>
            </li>
            <li>
              <a
                href="#about"
                className="text-sm font-medium text-[var(--landing-ink-soft)] underline-offset-4 hover:text-[var(--landing-ink)] hover:underline"
              >
                <span lang="hi">हमारे बारे में</span>
                <span className="ml-1.5 text-xs text-[var(--landing-muted)]">
                  About
                </span>
              </a>
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">
              <span lang="hi">साइन इन करें</span>
              <span className="hidden text-xs text-[var(--landing-muted)] sm:inline">
                Sign in
              </span>
            </Link>
          </Button>
          <Button size="sm" asChild className="bg-[var(--landing-amber)] text-[var(--landing-cream)] hover:bg-[var(--landing-amber-soft)]">
            <Link to="/citizen/challenges/new">
              <span lang="hi">समस्या साझा करें</span>
              <span className="hidden text-xs opacity-80 sm:inline">
                Submit
              </span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}