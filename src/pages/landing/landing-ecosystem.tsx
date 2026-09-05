interface Participant {
  hindi: string
  english: string
  note: string
}

const participants: Participant[] = [
  {
    hindi: 'नागरिक',
    english: 'Citizens',
    note: 'अपने क्षेत्र की समस्या पहचानते और साझा करते हैं',
  },
  {
    hindi: 'सरकार',
    english: 'Government',
    note: 'चुनौतियों की पुष्टि और जवाबदेह निर्णय लेती है',
  },
  {
    hindi: 'विश्वविद्यालय',
    english: 'Universities',
    note: 'सही विशेषज्ञता और संसाधन लाते हैं',
  },
  {
    hindi: 'फैकल्टी',
    english: 'Faculty',
    note: 'टीमों का मार्गदर्शन और समाधान का क्रियान्वयन',
  },
  {
    hindi: 'छात्र',
    english: 'Students',
    note: 'वास्तविक समाधान बनाने में योगदान देते हैं',
  },
]

export function LandingEcosystem() {
  return (
    <section
      aria-label="YUGMIT value proposition"
      className="border-b border-[var(--landing-line)] bg-[var(--landing-ivory)]"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--landing-amber)]"
              lang="hi"
            >
              मूल विचार
            </p>
            <h2
              className="mt-4 font-heading text-3xl font-semibold tracking-tight text-[var(--landing-ink)] sm:text-4xl"
              lang="hi"
            >
              हर समस्या, सही सहयोग तक।
            </h2>
            <p className="mt-2 font-heading text-lg font-medium text-[var(--landing-ink-soft)]">
              Every challenge deserves the right expertise.
            </p>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-[var(--landing-muted)] sm:text-base">
              हमारा मानना है कि समाज की हर बड़ी समस्या के पीछे एक ऐसी संस्था है
              जो उसका समाधान कर सकती है। कभी सरकार, तो कभी विश्वविद्यालय, फैकल्टी
              और छात्रों की एक टीम। YUGMIT इन सभी को एक साझा कार्यप्रवाह में
              जोड़ता है।
            </p>
          </div>

          <div
            aria-label="YUGMIT ecosystem"
            className="overflow-hidden rounded-lg border border-[var(--landing-line)] bg-[var(--landing-surface)]"
          >
            <ol className="divide-y divide-[var(--landing-line)]">
              {participants.map((participant, index) => (
                <li key={participant.english} className="flex gap-4 p-5">
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--landing-amber)] font-heading text-sm font-semibold text-[var(--landing-cream)]"
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-heading text-lg font-semibold text-[var(--landing-ink)]">
                      <span lang="hi">{participant.hindi}</span>
                      <span className="ml-2 text-sm font-medium text-[var(--landing-ink-soft)]">
                        {participant.english}
                      </span>
                    </p>
                    <p
                      className="mt-0.5 text-sm text-[var(--landing-muted)]"
                      lang="hi"
                    >
                      {participant.note}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="border-t border-[var(--landing-line)] bg-[var(--landing-ivory)] px-5 py-4">
              <p className="text-sm font-medium text-[var(--landing-green)]">
                <span lang="hi">समाधान तक</span>
                <span className="ml-2 text-[var(--landing-ink-soft)]">
                  towards a collaborative solution
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}