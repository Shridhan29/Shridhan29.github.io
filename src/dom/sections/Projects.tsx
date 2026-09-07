import { projects, type Project } from '@/data/projects'
import { Section } from '@/dom/ui/Section'
import { Picture } from '@/dom/ui/Picture'

function Shots({ project }: { project: Project }) {
  const phone = project.shots[0]?.kind === 'phone'
  return (
    <ul
      className={
        phone
          ? 'mt-8 -mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-3'
          : 'mt-8 grid gap-4 sm:grid-cols-2'
      }
    >
      {project.shots.map((shot, i) => (
        <li key={shot.slug} className={phone ? 'w-[168px] shrink-0 snap-start' : ''}>
          <figure>
            <Picture
              base={`/img/${project.dir}/${shot.slug}`}
              widths={project.widths}
              width={phone ? 1080 : 1843}
              height={phone ? 1920 : 954}
              alt={shot.alt}
              priority={i === 0 && project.featured}
              sizes={phone ? '168px' : '(max-width: 640px) 90vw, 44vw'}
              className={`w-full rounded-md border border-slate/70 bg-ink ${phone ? '' : 'aspect-[1843/954] object-cover object-top'}`}
            />
            <figcaption className="sr-only">{shot.alt}</figcaption>
          </figure>
        </li>
      ))}
    </ul>
  )
}

function ProjectBlock({ project }: { project: Project }) {
  return (
    <article
      id={project.id}
      className="scroll-mt-24 border-t border-slate/60 py-12 first:border-t-0 first:pt-0 md:py-16"
    >
      <div className="grid gap-8 md:grid-cols-[1fr_1.15fr] md:gap-14">
        <div className="md:sticky md:top-24 md:self-start">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">{project.name}</h3>
            {project.featured && (
              <span className="rounded-full border border-ember/50 px-2 py-0.5 font-mono text-[0.65rem] tracking-wider text-ember uppercase">
                Live on Google Play
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-accent">{project.tagline}</p>
          <p className="mt-4 text-[0.95rem] leading-relaxed text-mist">{project.hook}</p>

          <dl className="mt-6 space-y-2 font-mono text-xs text-mist/80">
            <div className="flex gap-3">
              <dt className="w-14 shrink-0 text-mist/50">Period</dt>
              <dd>{project.period}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-14 shrink-0 text-mist/50">Role</dt>
              <dd>{project.role}</dd>
            </div>
          </dl>

          <ul className="mt-5 flex flex-wrap gap-1.5">
            {project.stack.map((s) => (
              <li key={s} className="rounded border border-slate/70 px-2 py-0.5 text-[0.72rem] text-bone/85">
                {s}
              </li>
            ))}
          </ul>

          {project.links.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-4">
              {project.links.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-sm text-bone underline decoration-slate underline-offset-4 transition-colors hover:decoration-accent"
                  >
                    {l.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* min-w-0: the phone-shot strip is a flex row of fixed-width items, so
            without this its min-content width forces the grid open and starves
            the left column. */}
        <div className="min-w-0">
          <ul className="space-y-3">
            {project.highlights.map((h) => (
              <li key={h.slice(0, 24)} className="flex gap-3 text-[0.92rem] leading-relaxed text-mist">
                <span aria-hidden className="mt-2.5 size-1 shrink-0 rounded-full bg-accent" />
                {h}
              </li>
            ))}
          </ul>

          <details className="group mt-6 border-t border-slate/60 pt-4">
            <summary className="cursor-pointer list-none font-mono text-xs tracking-[0.14em] text-mist uppercase transition-colors hover:text-bone">
              <span className="inline-block transition-transform group-open:rotate-90">›</span> Engineering detail
            </summary>
            <ul className="mt-4 space-y-3">
              {project.depth.map((d) => (
                <li key={d.slice(0, 24)} className="flex gap-3 text-[0.88rem] leading-relaxed text-mist/85">
                  <span aria-hidden className="mt-2.5 size-1 shrink-0 rounded-full bg-slate" />
                  {d}
                </li>
              ))}
            </ul>
          </details>

          <Shots project={project} />
        </div>
      </div>
    </article>
  )
}

export function Projects() {
  return (
    <Section id="work" label="Work" title="Four things I built and shipped.">
      {projects.map((p) => (
        <ProjectBlock key={p.id} project={p} />
      ))}
    </Section>
  )
}
