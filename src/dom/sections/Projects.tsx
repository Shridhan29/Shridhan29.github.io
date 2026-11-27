import { projects, type Project } from '@/data/projects'
import { Section } from '@/dom/ui/Section'
import { Gallery } from '@/dom/ui/Gallery'
import { Reel } from './Reel'
import { CAN_RENDER_3D } from '@/tier'

/** Projects a 3D layer illustrates on desktop, and the stage it draws into. */
type Stage = 'device' | 'surface' | 'ground-pos' | 'ground-kiosk'

const STAGES: Partial<Record<string, Stage>> = {
  truuna: 'device', // L1: one phone
  aashman: 'surface', // L2: layered browser panes
  dms: 'ground-pos', // L3: POS terminal and Raspberry Pi
  urja: 'ground-kiosk', // L3: free-standing kiosk
}

/** A phone or a kiosk is tall; a stack of windows or a countertop is wide. */
const TALL = new Set<Stage>(['device', 'ground-kiosk'])

/**
 * The 3D showcase: an empty, decorative box the project's layer draws into on
 * desktop. The screenshots themselves are always in the gallery below it, so
 * nothing depends on the scene to be seen.
 */
function Showcase({ project }: { project: Project }) {
  const stage = CAN_RENDER_3D ? STAGES[project.id] : undefined
  if (!stage) return null
  return (
    <div
      data-stage={stage}
      aria-hidden
      className={`mt-10 hidden lg:block scene-off:hidden ${
        TALL.has(stage) ? 'h-[min(62vh,580px)] min-h-[460px]' : 'h-[min(50vh,480px)] min-h-[380px]'
      }`}
    />
  )
}

function Bullets({ items, tone }: { items: string[]; tone: 'accent' | 'muted' }) {
  return (
    // One column: two uneven ones zig-zagged the reading order.
    <ul className="max-w-[72ch] space-y-3">
      {items.map((h) => (
        <li
          key={h.slice(0, 24)}
          className={`flex gap-3 leading-relaxed ${
            tone === 'accent' ? 'text-[0.95rem] text-bone/85' : 'text-[0.9rem] text-mist'
          }`}
        >
          <span
            aria-hidden
            className={`mt-[0.6rem] size-1.5 shrink-0 rounded-full ${
              tone === 'accent' ? 'bg-accent' : 'bg-line-strong'
            }`}
          />
          {h}
        </li>
      ))}
    </ul>
  )
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <article id={project.id} className="card reveal scroll-mt-24 p-5 sm:p-8 md:p-10 xl:p-14">
      {/* A chapter: on wide screens the name and facts stay pinned while the
          highlights, the 3D showcase and the screens scroll past beside them. */}
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.3fr)] lg:gap-14 xl:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <header className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="font-mono text-xs tracking-[0.2em] text-accent-soft">
              {String(index + 1).padStart(2, '0')}
              <span className="text-mist"> / {String(projects.length).padStart(2, '0')}</span>
            </span>
            {project.featured && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ember/40 bg-ember/10 px-2.5 py-0.5 font-mono text-[0.65rem] tracking-wider text-ember uppercase">
                <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-ember" />
                Live on Google Play
              </span>
            )}
          </header>
          <div className="mt-5">
            <h3 className="t-project font-semibold">{project.name}</h3>
            <p className="mt-2 text-[0.95rem] font-medium text-accent-soft">{project.tagline}</p>
            <p className="mt-4 leading-relaxed text-mist">{project.hook}</p>

            <dl className="mt-7 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5 border-t border-line pt-5 text-sm">
              <dt className="font-mono text-xs tracking-[0.14em] text-mist uppercase">Period</dt>
              <dd className="text-bone/90">{project.period}</dd>
              <dt className="font-mono text-xs tracking-[0.14em] text-mist uppercase">Role</dt>
              <dd className="text-bone/90">{project.role}</dd>
            </dl>

            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Stack">
              {project.stack.map((s) => (
                <li key={s} className="chip">
                  {s}
                </li>
              ))}
            </ul>

            {project.links.length > 0 && (
              <ul className="mt-7 flex flex-wrap gap-3">
                {project.links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="btn btn-ghost"
                    >
                      {l.label} <span className="link-arrow">↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="min-w-0">
          <h4 className="mb-4 font-mono text-xs tracking-[0.16em] text-mist uppercase">
            Highlights
          </h4>
          <Bullets items={project.highlights} tone="accent" />

          <details className="group mt-8 rounded-xl border border-line bg-void/40 transition-colors open:border-line-strong">
            {/* Says what it does, in words: a rotating + read as a "close" ×. */}
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 rounded-xl px-5 py-4 transition-colors hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden">
              <span className="font-mono text-xs tracking-[0.14em] whitespace-nowrap text-bone uppercase">
                Engineering detail
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs whitespace-nowrap text-accent-soft transition-colors group-hover:border-accent">
                <span className="group-open:hidden">Show details</span>
                <span className="hidden group-open:inline">Hide details</span>
                <svg
                  aria-hidden
                  viewBox="0 0 12 12"
                  className="size-3 transition-transform group-open:rotate-180"
                >
                  <path
                    d="M2.5 4.5 6 8l3.5-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </summary>
            <div className="px-5 pt-1 pb-5">
              <Bullets items={project.depth} tone="muted" />
            </div>
          </details>
          <Showcase project={project} />

          <div className="mt-10 border-t border-line pt-8">
            <Gallery project={project} />
          </div>
        </div>
      </div>
    </article>
  )
}

export function Projects() {
  return (
    <Section
      id="work"
      label="Work"
      title="Four things I built and shipped."
      accent="built and shipped."
    >
      <Reel />
      <div className="space-y-8 md:space-y-12">
        {projects.map((p, i) => (
          <ProjectCard key={p.id} project={p} index={i} />
        ))}
      </div>
    </Section>
  )
}
