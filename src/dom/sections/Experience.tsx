import { experience } from '@/data/experience'
import { education, certifications } from '@/data/education'
import { Section } from '@/dom/ui/Section'
import { CAN_RENDER_3D } from '@/tier'

export function Experience() {
  return (
    <Section
      id="experience"
      label="Experience"
      title="Where I've been shipping."
      accent="shipping."
    >
      {experience.map((job, i) => (
        <article key={job.company} className="card relative p-5 sm:p-8 md:p-10 xl:p-12">
          {/* A timeline rule that draws down the entry as it scrolls past. */}
          <span
            aria-hidden
            className="draw-y absolute top-10 bottom-10 left-0 w-0.5 rounded-full bg-gradient-to-b from-accent via-accent/60 to-transparent"
          />
          {/* Three columns on wide screens: dates, the entry at a reading measure,
              and the stack, so the card has no empty right half. */}
          <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)] md:gap-12 xl:grid-cols-[260px_minmax(0,40rem)_minmax(0,1fr)]">
            <div className="flex flex-col">
              <p className="inline-flex w-fit items-center gap-2 rounded-full border border-line bg-white/[0.03] px-3 py-1 font-mono text-xs text-bone/90">
                <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-accent" />
                {job.period}
              </p>
              <p className="mt-2.5 text-sm text-mist">{job.location}</p>
              {/* Below the dates this column is empty for the length of the entry: on
                  desktop the L5 Cloud layer draws its delivery pipeline here. */}
              {CAN_RENDER_3D && i === 0 && (
                <div
                  data-stage="cloud"
                  aria-hidden
                  className="mt-8 hidden min-h-[360px] flex-1 lg:block scene-off:hidden"
                />
              )}
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight md:text-2xl">
                {job.role} ·{' '}
                <a
                  href={job.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="link text-accent-soft"
                >
                  {job.company}
                </a>
              </h3>
              <p className="mt-1.5 text-sm text-mist">{job.note}</p>
              <p className="measure mt-5 leading-relaxed text-bone/85 xl:max-w-none">
                {job.summary}
              </p>
              <ul className="mt-5 space-y-3">
                {job.bullets.map((b) => (
                  <li
                    key={b.slice(0, 24)}
                    className="measure flex gap-3 text-[0.94rem] leading-relaxed text-mist xl:max-w-none"
                  >
                    <span
                      aria-hidden
                      className="mt-[0.6rem] size-1.5 shrink-0 rounded-full bg-accent"
                    />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-start-2 xl:col-start-auto xl:border-l xl:border-line xl:pl-10">
              <h4 className="mb-4 font-mono text-xs tracking-[0.16em] text-mist uppercase">
                Day to day
              </h4>
              <ul className="flex flex-wrap gap-2" aria-label="Day-to-day stack">
                {job.stack.map((s) => (
                  <li key={s} className="chip">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      ))}

      <div className="mt-6 grid gap-4 md:grid-cols-2 md:gap-6">
        <div className="card rounded-2xl p-5 md:p-7">
          <h3 className="mb-4 font-mono text-xs tracking-[0.16em] text-accent-soft uppercase">
            Education
          </h3>
          {education.map((e) => (
            <div key={e.qualification}>
              <p className="font-medium text-bone">{e.qualification}</p>
              <p className="mt-1 text-sm text-mist">{e.institution}</p>
              <p className="mt-2 font-mono text-xs text-mist">
                {e.period} · {e.detail}
              </p>
            </div>
          ))}
        </div>
        <div className="card rounded-2xl p-5 md:p-7">
          <h3 className="mb-4 font-mono text-xs tracking-[0.16em] text-accent-soft uppercase">
            Certifications
          </h3>
          {certifications.map((c) => (
            <div key={c.name}>
              <p className="font-medium text-bone">{c.name}</p>
              <p className="mt-1 text-sm text-mist">{c.issuer}</p>
              <p className="mt-2 font-mono text-xs text-mist">{c.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}
