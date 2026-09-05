const aiAssists = [
  { hindi: 'समस्या को एक स्वीकृत श्रेणी में रखता है', english: 'categorizes the challenge' },
  { hindi: 'प्रासंगिक टैग की पहचान करता है', english: 'identifies relevant tags' },
  { hindi: 'तात्कालिकता का अनुमान लगाता है', english: 'estimates urgency' },
  { hindi: 'आवश्यक विशेषज्ञता और संसाधन जोड़ता है', english: 'identifies required expertise' },
  { hindi: 'समान चुनौतियों को खोजने में मदद करता है', english: 'helps discover related challenges' },
]

export function LandingAiBoundary() {
  return (
    <section
      aria-label="AI and human decision boundary"
      className="border-b border-[var(--landing-line)] bg-[var(--landing-ivory)]"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--landing-amber)]">
            AI
          </p>
          <h2
            className="mt-4 font-heading text-3xl font-semibold tracking-tight text-[var(--landing-ink)] sm:text-4xl"
            lang="hi"
          >
            AI समस्या को समझता है। निर्णय इंसान लेते हैं।
          </h2>
          <p className="mt-2 font-heading text-lg font-medium text-[var(--landing-ink-soft)]">
            AI understands the problem. People make the decisions.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-[var(--landing-line)] bg-[var(--landing-surface)] p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--landing-amber)]">
              <span lang="hi">AI की भूमिका</span>
              <span className="ml-2 text-xs text-[var(--landing-muted)]">
                assistance layer
              </span>
            </p>
            <ul className="mt-5 space-y-3">
              {aiAssists.map((item) => (
                <li key={item.english} className="flex items-baseline gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--landing-amber)]"
                  />
                  <span className="text-sm leading-relaxed text-[var(--landing-ink-soft)]">
                    <span lang="hi">{item.hindi}</span>
                    <span className="ml-2 text-xs text-[var(--landing-muted)]">
                      {item.english}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-[var(--landing-green-soft)]/40 bg-[var(--landing-surface)] p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--landing-green)]">
              <span lang="hi">मानव निर्णय</span>
              <span className="ml-2 text-xs text-[var(--landing-muted)]">
                human authority
              </span>
            </p>
            <ul className="mt-5 space-y-3">
              <li className="flex items-baseline gap-3">
                <span
                  aria-hidden="true"
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--landing-green)]"
                />
                <span lang="hi" className="text-sm leading-relaxed text-[var(--landing-ink-soft)]">
                  सरकार ही चुनौती को सत्यापित करती है। कोई भी चुनौती उसकी
                  स्वीकृति के बिना आगे नहीं बढ़ती।
                </span>
              </li>
              <li className="flex items-baseline gap-3">
                <span
                  aria-hidden="true"
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--landing-green)]"
                />
                <span lang="hi" className="text-sm leading-relaxed text-[var(--landing-ink-soft)]">
                  मिलान, विलय या अस्वीकृति जैसे निर्णय हमेशा मनुष्य लेते हैं।
                </span>
              </li>
              <li className="flex items-baseline gap-3">
                <span
                  aria-hidden="true"
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--landing-green)]"
                />
                <span className="text-sm leading-relaxed text-[var(--landing-ink-soft)]">
                  <span lang="hi">AI केवल सुझाव देता है</span>
                  <span className="ml-2 text-xs text-[var(--landing-muted)]">
                    final authority stays with people
                  </span>
                </span>
              </li>
            </ul>
            <p className="mt-6 border-t border-[var(--landing-line)] pt-4 text-xs leading-relaxed text-[var(--landing-muted)]">
              <span lang="hi">
                सरकार सत्यापन और निर्णयों के लिए पूरी तरह जवाबदेह है।
              </span>
              <span className="mt-1 block">
                Government remains responsible for validation and decisions.
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}