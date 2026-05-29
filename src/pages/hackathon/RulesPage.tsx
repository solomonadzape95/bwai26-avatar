import { RULES_INTRO, RULES_TILES } from '../../content/rules';

export default function RulesPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-bwai-red px-8 py-12 text-white shadow-sm sm:px-16 sm:py-20">
        <div className="text-sm font-bold uppercase tracking-[0.4em] text-white/80 sm:text-base">
          Rules
        </div>
        <h2 className="mt-4 text-5xl font-semibold leading-[1.05] sm:text-7xl lg:text-8xl">
          Play big. Stay honest.
        </h2>
        <p className="mt-5 max-w-3xl text-lg text-white/90 sm:text-2xl">{RULES_INTRO}</p>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {RULES_TILES.map((tile) => (
          <article
            key={tile.heading}
            className="flex flex-col gap-3 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800 sm:p-8"
          >
            <h3 className="text-2xl font-semibold text-bwai-ink dark:text-neutral-100 sm:text-3xl">
              {tile.heading}
            </h3>
            <p className="text-base text-neutral-700 dark:text-neutral-300 sm:text-lg">
              {tile.body}
            </p>
            {tile.bullets && (
              <ul className="mt-1 space-y-2 text-base text-neutral-700 dark:text-neutral-300 sm:text-lg">
                {tile.bullets.map((b) => (
                  <li key={b} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-neutral-400 dark:bg-neutral-600" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
