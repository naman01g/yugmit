import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function LandingHero() {
  return (
    <section
      aria-label="YUGMIT introduction"
      className="border-b border-[var(--landing-line)] bg-[var(--landing-surface)]"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p
            className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--landing-amber)]"
            lang="hi"
          >
            सामाजिक चुनौतियों का सहयोगी मंच
          </p>

          <h1 className="mt-5 font-heading text-4xl font-semibold tracking-tight text-[var(--landing-ink)] sm:text-5xl md:text-6xl">
            YUGMIT
          </h1>

          <p
            className="mt-5 font-heading text-2xl font-medium leading-snug text-[var(--landing-ink)] sm:text-3xl"
            lang="hi"
          >
            समस्याओं से समाधान तक
          </p>
          <p className="mt-2 text-base font-medium text-[var(--landing-ink-soft)] sm:text-lg">
            From societal challenges to collaborative solutions
          </p>

          <div className="mx-auto mt-8 max-w-2xl space-y-3 text-sm leading-relaxed text-[var(--landing-muted)] sm:text-base">
            <p lang="hi">
              आपके आसपास की वास्तविक समस्याओं को पहचानें, साझा करें और सही
              संस्थानों तक पहुँचाएँ।
            </p>
            <p>
              YUGMIT connects citizens, government, universities, faculty and
              students to turn real societal challenges into structured
              solutions.
            </p>
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="w-full bg-[var(--landing-amber)] text-[var(--landing-cream)] hover:bg-[var(--landing-amber-soft)] sm:w-auto"
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
              className="w-full border-[var(--landing-line)] bg-[var(--landing-ivory)] text-[var(--landing-ink)] hover:bg-[var(--landing-surface)] sm:w-auto"
            >
              <Link to="/citizen/challenges">
                <span lang="hi" className="font-medium">
                  चुनौतियाँ देखें
                </span>
                <span aria-hidden="true" className="opacity-80">
                  |
                </span>
                <span>Explore Challenges</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}