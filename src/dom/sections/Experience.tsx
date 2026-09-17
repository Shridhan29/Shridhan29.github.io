import { experience } from '@/data/experience'
import { education, certifications } from '@/data/education'
import { Section } from '@/dom/ui/Section'
import { CAN_RENDER_3D } from '@/tier'

export function Experience() {
  return (
    <Section id="experience" label="Experience" title="Where I've been shipping.">
      {experience.map((job, i) => (
        <article key={job.company} className="border-t border-slate/60 pt-8">
          <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)] md:gap-12 xl:grid-cols-[300px_minmax(0,1fr)]">
            <div className="flex flex-col">
              <p className="font-mono text-xs text-mist">{job.period}</p>
              <p className="mt-1 text-xs text-mist/85">{job.location}</p>
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
              <h3 className="text-xl font-semibold tracking-tight">
                {job.role} ·{' '}
                <a
                  href={job.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-accent hover:underline"
                >
                  {job.company}
                </a>
              </h3>
              <p className="mt-1 text-xs text-mist/85">{job.note}</p>
              <p className="measure mt-4 text-[0.95rem] text-mist">{job.summary}</p>
              <ul className="mt-5 space-y-3">
                {job.bullets.map((b) => (
                  <li
                    key={b.slice(0, 24)}
                    className="measure flex gap-3 text-[0.92rem] leading-relaxed text-mist"
                  >
                    <span aria-hidden className="mt-2.5 size-1 shrink-0 rounded-full bg-accent" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      ))}

      <div className="mt-14 grid gap-10 border-t border-slate/60 pt-8 md:grid-cols-2 xl:max-w-4xl">
        <div>
          <h3 className="mb-4 font-mono text-xs tracking-[0.16em] text-mist uppercase">
            Education
          </h3>
          {education.map((e) => (
            <div key={e.qualification}>
              <p className="font-medium text-bone">{e.qualification}</p>
              <p className="mt-1 text-sm text-mist">{e.institution}</p>
              <p className="mt-0.5 font-mono text-xs text-mist/85">
                {e.period} · {e.detail}
              </p>
            </div>
          ))}
        </div>
        <div>
          <h3 className="mb-4 font-mono text-xs tracking-[0.16em] text-mist uppercase">
            Certifications
          </h3>
          {certifications.map((c) => (
            <div key={c.name}>
              <p className="font-medium text-bone">{c.name}</p>
              <p className="mt-1 text-sm text-mist">{c.issuer}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}
