import { experience } from '@/data/experience'
import { education, certifications } from '@/data/education'
import { Section } from '@/dom/ui/Section'

export function Experience() {
  return (
    <Section id="experience" label="Experience" title="Where I've been shipping.">
      {experience.map((job) => (
        <article key={job.company} className="border-t border-slate/60 pt-8">
          <div className="grid gap-6 md:grid-cols-[210px_1fr] md:gap-10">
            <div>
              <p className="font-mono text-xs text-mist">{job.period}</p>
              <p className="mt-1 text-xs text-mist/70">{job.location}</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold tracking-tight">
                {job.role} ·{' '}
                <a href={job.href} target="_blank" rel="noreferrer noopener" className="text-accent hover:underline">
                  {job.company}
                </a>
              </h3>
              <p className="mt-1 text-xs text-mist/70">{job.note}</p>
              <p className="mt-4 text-[0.95rem] text-mist">{job.summary}</p>
              <ul className="mt-5 space-y-3">
                {job.bullets.map((b) => (
                  <li key={b.slice(0, 24)} className="flex gap-3 text-[0.92rem] leading-relaxed text-mist">
                    <span aria-hidden className="mt-2.5 size-1 shrink-0 rounded-full bg-accent" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      ))}

      <div className="mt-14 grid gap-10 border-t border-slate/60 pt-8 md:grid-cols-2">
        <div>
          <h3 className="mb-4 font-mono text-xs tracking-[0.16em] text-mist uppercase">Education</h3>
          {education.map((e) => (
            <div key={e.qualification}>
              <p className="font-medium text-bone">{e.qualification}</p>
              <p className="mt-1 text-sm text-mist">{e.institution}</p>
              <p className="mt-0.5 font-mono text-xs text-mist/70">
                {e.period} · {e.detail}
              </p>
            </div>
          ))}
        </div>
        <div>
          <h3 className="mb-4 font-mono text-xs tracking-[0.16em] text-mist uppercase">Certifications</h3>
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
