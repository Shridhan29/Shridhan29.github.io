import { projects, type Project } from '@/data/projects'
import { Section } from '@/dom/ui/Section'
import { Picture } from '@/dom/ui/Picture'

function Shots({ project }: { project: Project }) {
  const phone = project.shots[0]?.kind === 'phone'
  return (
    <ul
      className={
        // Phone shots scroll horizontally where they do not fit and lay out as a
        // plain row once the shell is wide enough to hold all five.
        phone
          ? 'mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 lg:grid lg:grid-cols-5 lg:gap-6 lg:overflow-visible'
          : 'mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:gap-6'
      }
    >
      {project.shots.map((shot, i) => (
        <li
          key={shot.slug}
          className={phone ? 'w-[168px] shrink-0 snap-start lg:w-auto' : ''}
        >
          <figure>
            <Picture
              base={`/img/${project.dir}/${shot.slug}`}
              widths={project.widths}
              width={phone ? 1080 : 1843}
              height={phone ? 1920 : 954}
              alt={shot.alt}
              priority={i === 0 && project.featured}
              sizes={phone ? '(max-width: 1024px) 168px, 19vw' : '(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw'}
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
      className="scroll-mt-24 border-t border-slate/60 py-12 first:border-t-0 first:pt-0 md:py-16 xl:py-24"
    >
      <div className="grid gap-8 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.5fr)] md:gap-14 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,2fr)] xl:gap-20">
        <div className="md:sticky md:top-24 md:self-start">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="t-project font-semibold">{project.name}</h3>
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
              <dt className="w-14 shrink-0 text-mist/80">Period</dt>
              <dd>{project.period}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-14 shrink-0 text-mist/80">Role</dt>
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
          <ul className="space-y-3 xl:grid xl:grid-cols-2 xl:gap-x-12 xl:gap-y-3 xl:space-y-0">
            {project.highlights.map((h) => (
              <li key={h.slice(0, 24)} className="flex gap-3 text-[0.92rem] leading-relaxed text-mist xl:text-[0.98rem]">
                <span aria-hidden className="mt-2.5 size-1 shrink-0 rounded-full bg-accent" />
                {h}
              </li>
            ))}
          </ul>

          <details className="group mt-6 border-t border-slate/60 pt-4">
            <summary className="cursor-pointer list-none font-mono text-xs tracking-[0.14em] text-mist uppercase transition-colors hover:text-bone">
              <span className="inline-block transition-transform group-open:rotate-90">›</span> Engineering detail
            </summary>
            <ul className="mt-4 space-y-3 xl:grid xl:grid-cols-2 xl:gap-x-12 xl:gap-y-3 xl:space-y-0">
              {project.depth.map((d) => (
                <li key={d.slice(0, 24)} className="flex gap-3 text-[0.88rem] leading-relaxed text-mist/85">
                  <span aria-hidden className="mt-2.5 size-1 shrink-0 rounded-full bg-slate" />
                  {d}
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>

      <Shots project={project} />
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
