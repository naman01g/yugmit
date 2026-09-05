const matchFactors = [
  {
    hindi: 'विशेषज्ञता',
    english: 'Expertise',
    note: 'शिक्षकों और विभागों की क्षेत्रीय विशेषज्ञता',
  },
  {
    hindi: 'संसाधन',
    english: 'Facilities',
    note: 'प्रयोगशालाएँ और उपलब्ध अवसंरचना (सत्यापित)',
  },
  {
    hindi: 'पिछली परियोजनाएँ',
    english: 'Previous projects',
    note: 'ऐसे ही समाधानों पर किया गया पिछला कार्य',
  },
  {
    hindi: 'छात्र क्षमता',
    english: 'Student capability',
    note: 'समस्या पर काम करने वाले छात्रों का कौशल',
  },
  {
    hindi: 'स्थान',
    english: 'Location',
    note: 'चुनौती और संस्थान की भौगोलिक निकटता',
  },
]

export function LandingMatching() {
  return (
    <section
      aria-label="University collaboration and matching"
      className="border-b border-[var(--landing-line)] bg-[var(--landing-surface)]"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--landing-amber)]">
              YUGMIT
            </p>
            <h2
              className="mt-4 font-heading text-3xl font-semibold tracking-tight text-[var(--landing-ink)] sm:text-4xl"
              lang="hi"
            >
              सही समस्या, सही विशेषज्ञता तक।
            </h2>
            <p className="mt-2 font-heading text-lg font-medium text-[var(--landing-ink-soft)]">
              The right problem, the right expertise.
            </p>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-[var(--landing-muted)] sm:text-base">
              <span lang="hi">
                मिलान केवल श्रेणी मिलान नहीं है, यह कई पहलुओं पर आधारित एक
                समझौता है जिसका हर कारण स्पष्ट और समझाने योग्य होता है। सत्यापित
                डेटा के बिना कोई क्षमता दर्ज नहीं की जाती।
              </span>
            </p>
          </div>

          <ul className="divide-y divide-[var(--landing-line)] overflow-hidden rounded-lg border border-[var(--landing-line)] bg-[var(--landing-ivory)]">
            {matchFactors.map((factor) => (
              <li key={factor.english} className="flex items-center justify-between gap-4 p-5">
                <p className="min-w-0 font-heading text-lg font-semibold text-[var(--landing-ink)]">
                  <span lang="hi">{factor.hindi}</span>
                  <span className="ml-2 text-sm font-medium text-[var(--landing-ink-soft)]">
                    {factor.english}
                  </span>
                </p>
                <p className="hidden max-w-[16rem] shrink-0 text-sm text-[var(--landing-muted)] sm:block" lang="hi">
                  {factor.note}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}