interface JourneyStep {
  hindi: string
  english: string
  note: string
}

const journeySteps: JourneyStep[] = [
  {
    hindi: 'नागरिक समस्या साझा करता है',
    english: 'Citizen submits a challenge',
    note: 'क्षेत्र की वास्तविक समस्या, उसके प्रमाण और संदर्भ के साथ',
  },
  {
    hindi: 'AI समस्या को समझता और वर्गीकृत करता है',
    english: 'AI analyzes and categorizes the challenge',
    note: 'क्षेत्र, टैग और तात्कालिकता के अनुमान के साथ (सहायक भूमिका में)',
  },
  {
    hindi: 'सरकार सत्यापन करती है',
    english: 'Government validates the challenge',
    note: 'मानव निर्णय, कोई चुनौती बिना सत्यापन के आगे नहीं बढ़ती',
  },
  {
    hindi: 'सही विश्वविद्यालय से मिलान',
    english: 'Best-fit university is matched',
    note: 'विशेषज्ञता, संसाधन, पिछली परियोजनाएँ और स्थान के आधार पर',
  },
  {
    hindi: 'फैकल्टी और छात्र टीम बनाते हैं',
    english: 'Faculty and students form a team',
    note: 'चुनौती पर काम करने के लिए सही टीम इकट्ठा होती है',
  },
  {
    hindi: 'समाधान प्रस्ताव तैयार होता है',
    english: 'Solution proposal is prepared',
    note: 'परियोजना की योजना और संभावित समाधान का प्रारूप',
  },
]

export function LandingJourney() {
  return (
    <section
      id="how-it-works"
      aria-label="The journey of a challenge"
      className="scroll-mt-20 border-b border-[var(--landing-line)] bg-[var(--landing-coal)] text-[var(--landing-on-coal)]"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--landing-amber)]">
            YUGMIT
          </p>
          <h2
            className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl"
            lang="hi"
          >
            एक चुनौती की यात्रा
          </h2>
          <p className="mt-2 font-heading text-lg font-medium text-[var(--landing-on-coal)] opacity-80">
            The journey of a challenge
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed opacity-75 sm:text-base">
            जब कोई नागरिक एक समस्या साझा करता है, तो वह एक साझा प्रक्रिया शुरू
            होती है जिसमें तकनीक मदद करती है और मनुष्य निर्णय लेते हैं। यही
            पूरी यात्रा है।
          </p>
        </div>

        <ol className="mx-auto mt-14 max-w-3xl">
          {journeySteps.map((step, index) => (
            <li key={step.english} className="relative flex gap-6">
              {index < journeySteps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute left-[21px] top-12 h-[calc(100%-3rem)] w-px bg-[var(--landing-line)] opacity-40"
                />
              ) : null}
              <span
                aria-hidden="true"
                className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--landing-line)]/50 bg-[var(--landing-coal-soft)] font-heading text-sm font-semibold"
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="pb-10">
                <p className="font-heading text-xl font-semibold">
                  <span lang="hi">{step.hindi}</span>
                </p>
                <p className="mt-0.5 text-sm font-medium opacity-70">
                  {step.english}
                </p>
                <p className="mt-2 max-w-xl text-sm leading-relaxed opacity-60">
                  <span lang="hi">{step.note}</span>
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}