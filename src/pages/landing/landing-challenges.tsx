interface SampleChallenge {
  hindi: string
  english: string
  categoryHindi: string
  categoryEnglish: string
  sampleTitle: string
}

/**
 * Illustrative examples only. These are NOT real submitted challenges and are
 * never presented as live data. They reuse approved taxonomy vocabulary to show
 * the kinds of societal problems YUGMIT would carry.
 */
const sampleChallenges: SampleChallenge[] = [
  {
    hindi: 'पेयजल',
    english: 'Drinking Water',
    categoryHindi: 'जल प्रबंधन',
    categoryEnglish: 'Water Management',
    sampleTitle: 'गाँव के हैंडपंप में पेयजल की गुणवत्ता',
  },
  {
    hindi: 'कृषि',
    english: 'Agriculture',
    categoryHindi: 'कृषि',
    categoryEnglish: 'Agriculture',
    sampleTitle: 'सूखा-प्रभावित क्षेत्र में सिंचाई सुविधा',
  },
  {
    hindi: 'स्कूल आधारभूत संरचना',
    english: 'School Infrastructure',
    categoryHindi: 'शिक्षा',
    categoryEnglish: 'Education',
    sampleTitle: 'विद्यालय भवन और स्वच्छता सुविधाओं की आवश्यकता',
  },
  {
    hindi: 'स्वास्थ्य सेवाएँ',
    english: 'Healthcare Access',
    categoryHindi: 'स्वास्थ्य',
    categoryEnglish: 'Healthcare',
    sampleTitle: 'प्राथमिक स्वास्थ्य केंद्र तक पहुँच में कठिनाई',
  },
  {
    hindi: 'कचरा प्रबंधन',
    english: 'Waste Management',
    categoryHindi: 'पर्यावरण',
    categoryEnglish: 'Environment',
    sampleTitle: 'गाँव के कचरे के संग्रहण और निस्तारण की व्यवस्था',
  },
]

export function LandingChallenges() {
  return (
    <section
      id="challenges"
      aria-label="Example challenges on YUGMIT"
      className="scroll-mt-20 border-b border-[var(--landing-line)] bg-[var(--landing-ivory)]"
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
              समाज की चुनौतियाँ, एक जगह।
            </h2>
            <p className="mt-2 font-heading text-lg font-medium text-[var(--landing-ink-soft)]">
              Real problems, in one place.
            </p>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-[var(--landing-muted)] sm:text-base">
              <span lang="hi">
                स्कूल से लेकर स्वास्थ्य, पानी से लेकर खेती तक। नागरिक अपने क्षेत्र
                की असली समस्याएँ YUGMIT पर साझा करते हैं। सत्यापित चुनौतियाँ ही
                विश्वविद्यालयों तक पहुँचती हैं।
              </span>
            </p>
            <p className="mt-4 max-w-xl border-l-2 border-[var(--landing-amber)] pl-4 text-xs leading-relaxed text-[var(--landing-muted)]">
              ये केवल उदाहरण हैं। वास्तविक डेटा नागरिकों द्वारा साझा की गई
              चुनौतियों से आता है।
              <span className="mt-1 block">
                These are illustrative examples, not live data.
              </span>
            </p>
          </div>

          <ul className="divide-y divide-[var(--landing-line)] overflow-hidden rounded-lg border border-[var(--landing-line)] bg-[var(--landing-surface)]">
            {sampleChallenges.map((challenge) => (
              <li key={challenge.english}>
                <div className="flex items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <p className="font-heading text-lg font-semibold text-[var(--landing-ink)]">
                      <span lang="hi">{challenge.hindi}</span>
                      <span className="ml-2 text-sm font-medium text-[var(--landing-ink-soft)]">
                        {challenge.english}
                      </span>
                    </p>
                    <p
                      className="mt-1 truncate text-sm text-[var(--landing-muted)]"
                      lang="hi"
                    >
                      {challenge.sampleTitle}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-[var(--landing-line)] bg-[var(--landing-ivory)] px-3 py-1 text-xs text-[var(--landing-muted)]">
                    <span lang="hi">{challenge.categoryHindi}</span>
                    <span className="mx-1 opacity-50">/</span>
                    {challenge.categoryEnglish}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}