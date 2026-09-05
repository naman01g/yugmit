const responsibilities = [
  { hindi: 'AI सहायता करता है', english: 'AI assists' },
  { hindi: 'सरकार सत्यापित करती है', english: 'Government validates' },
  { hindi: 'विश्वविद्यालय सहयोग करते हैं', english: 'Universities collaborate' },
  { hindi: 'फैकल्टी मार्गदर्शन करती है', english: 'Faculty guides' },
  { hindi: 'छात्र समाधान बनाते हैं', english: 'Students build' },
]

export function LandingGovernance() {
  return (
    <section
      id="about"
      aria-label="Responsible workflow and governance"
      className="scroll-mt-20 border-b border-[var(--landing-line)] bg-[var(--landing-ivory)]"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            className="font-heading text-3xl font-semibold tracking-tight text-[var(--landing-ink)] sm:text-4xl"
            lang="hi"
          >
            तकनीक के साथ जवाबदेही।
          </h2>
          <p className="mt-2 font-heading text-lg font-medium text-[var(--landing-ink-soft)]">
            Technology with accountability.
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-[var(--landing-muted)] sm:text-base">
            <span lang="hi">
              हर भूमिका स्पष्ट है। कौन सहायता करता है, कौन निर्णय लेता है, और
              कौन समाधान बनाता है। यही पारदर्शिता युगमिट के हर कार्यप्रवाह का
              आधार है।
            </span>
          </p>
        </div>

        <ol className="mx-auto mt-12 grid max-w-4xl gap-3 sm:grid-cols-2">
          {responsibilities.map((item) => (
            <li
              key={item.english}
              className="flex items-center gap-3 rounded-lg border border-[var(--landing-line)] bg-[var(--landing-surface)] px-5 py-4"
            >
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-full bg-[var(--landing-green)]"
              />
              <p className="font-heading text-base font-semibold text-[var(--landing-ink)]">
                <span lang="hi">{item.hindi}</span>
                <span className="ml-2 text-sm font-medium text-[var(--landing-ink-soft)]">
                  {item.english}
                </span>
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}