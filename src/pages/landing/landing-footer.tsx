import { Link } from 'react-router-dom'

export function LandingFooter() {
  return (
    <footer className="bg-[var(--landing-coal)] text-[var(--landing-on-coal)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
        <div className="max-w-sm">
          <p className="font-heading text-lg font-semibold">YUGMIT</p>
          <p className="mt-2 text-sm leading-relaxed opacity-70">
            <span lang="hi">
              नागरिक, सरकार और विश्वविद्यालयों को जोड़ने वाला एक सहयोगी मंच। वास्तविक सामाजिक समस्याओं से संरचित समाधानों तक।
            </span>
          </p>
        </div>

        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-10 gap-y-3 sm:grid-cols-4 lg:grid-cols-2 lg:gap-x-14">
            <li>
              <Link
                to="/citizen/challenges/new"
                className="text-sm opacity-80 underline-offset-4 hover:opacity-100 hover:underline"
              >
                <span lang="hi">समस्या साझा करें</span>
              </Link>
            </li>
            <li>
              <Link
                to="/citizen/challenges"
                className="text-sm opacity-80 underline-offset-4 hover:opacity-100 hover:underline"
              >
                <span lang="hi">चुनौतियाँ देखें</span>
              </Link>
            </li>
            <li>
              <Link
                to="/login"
                className="text-sm opacity-80 underline-offset-4 hover:opacity-100 hover:underline"
              >
                <span lang="hi">साइन इन</span>
              </Link>
            </li>
            <li>
              <Link
                to="/register"
                className="text-sm opacity-80 underline-offset-4 hover:opacity-100 hover:underline"
              >
                <span lang="hi">नया खाता</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-[var(--landing-line)]/30">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-5 text-xs opacity-60 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            <span lang="hi">सामाजिक चुनौतियों से समाधान तक</span>
            <span aria-hidden="true"> · </span>
            <span>From challenges to solutions</span>
          </p>
          <p>SIH26043 · YUGMIT · Public demonstration environment</p>
        </div>
      </div>
    </footer>
  )
}