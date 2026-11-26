import { useCallback, useEffect, useRef, useState } from 'react'
import type { Project, Shot } from '@/data/projects'
import { Picture } from './Picture'

const WEB: [number, number] = [1600, 828]

/** Intrinsic size of a screenshot: its own, or the default for its kind. */
function sizeOf(shot: Shot): [number, number] {
  return shot.size ?? (shot.kind === 'phone' ? [1080, 1920] : WEB)
}

/** Whether a web screenshot is a noticeably different shape from its frame. */
function offShape(shot: Shot) {
  const [w, h] = sizeOf(shot)
  return Math.abs(w / h - WEB[0] / WEB[1]) > 0.05
}

const caption = 'text-[0.8rem] leading-snug text-mist'

/**
 * Every screenshot of a project, at its true proportions: nothing is cropped.
 *
 * Phone screens sit in a row of handset frames (a sideways scroller on narrow
 * screens). Web screens sit in browser frames, two to a row, large enough to
 * read. Any of them opens full size in a lightbox.
 */
export function Gallery({ project }: { project: Project }) {
  const [open, setOpen] = useState<number | null>(null)
  const phone = project.shots[0]?.kind === 'phone'

  return (
    <>
      {phone ? (
        <PhoneRow project={project} onOpen={setOpen} />
      ) : (
        <WebGrid project={project} onOpen={setOpen} />
      )}
      <Lightbox project={project} index={open} onChange={setOpen} />
    </>
  )
}

type RowProps = { project: Project; onOpen: (i: number) => void }

function PhoneRow({ project, onOpen }: RowProps) {
  return (
    <ul
      className="gallery-scroller -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pt-1 pb-4 md:gap-6 lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-1"
      // A row that scrolls sideways must be reachable without a pointer: focus
      // it and the arrow keys scroll it (6.5, axe scrollable-region-focusable).
      tabIndex={0}
      aria-label={`${project.name} screens, scrollable`}
    >
      {project.shots.map((shot, i) => (
        // `relative` keeps anything absolutely positioned inside the scroller,
        // so nothing escapes overflow-x and widens the page on phones.
        <li
          key={shot.slug}
          className="relative w-[46vw] max-w-[200px] shrink-0 snap-start lg:w-auto lg:max-w-none"
        >
          <figure className="group">
            <button
              type="button"
              onClick={() => onOpen(i)}
              aria-label={`Enlarge: ${shot.alt}`}
              className="shot-frame block w-full rounded-[1.4rem] p-1.5"
            >
              <Picture
                base={`/img/${project.dir}/${shot.slug}`}
                widths={project.widths}
                width={sizeOf(shot)[0]}
                height={sizeOf(shot)[1]}
                alt={shot.alt}
                sizes="(max-width: 1024px) 46vw, 18vw"
                className="aspect-[1080/1920] w-full rounded-[1.05rem] bg-ink object-contain"
              />
            </button>
            <figcaption className={`mt-3 px-1 ${caption}`}>{shot.alt}</figcaption>
          </figure>
        </li>
      ))}
    </ul>
  )
}

function WebGrid({ project, onOpen }: RowProps) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:gap-6">
      {project.shots.map((shot, i) => {
        const [w, h] = sizeOf(shot)
        return (
          <li key={shot.slug}>
            <figure className="group flex h-full flex-col">
              {/* The frame holds the browser bar and the button; the bar sits
                  outside the button so its address is not read as part of the
                  button's name. */}
              <div className="shot-frame flex w-full flex-1 flex-col overflow-hidden rounded-xl">
                <span
                  aria-hidden
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-line px-3 py-2"
                >
                  <span className="flex gap-1.5">
                    <span className="size-2 rounded-full bg-line-strong" />
                    <span className="size-2 rounded-full bg-line-strong" />
                    <span className="size-2 rounded-full bg-line-strong" />
                  </span>
                  {project.host && (
                    <span className="justify-self-center truncate rounded-md bg-white/[0.04] px-3 py-0.5 font-mono text-[0.68rem] text-mist">
                      {project.host}
                    </span>
                  )}
                  <span className="w-[2.6rem]" />
                </span>
                {/* Never cropped: the frame keeps the common browser shape, and a
                    screenshot of another shape fits inside it over a blurred copy
                    of itself rather than over bare bars. */}
                <button
                  type="button"
                  onClick={() => onOpen(i)}
                  aria-label={`Enlarge: ${shot.alt}`}
                  className="relative my-auto block w-full cursor-zoom-in overflow-hidden bg-ink"
                >
                  {offShape(shot) && (
                    // An <img>, not a CSS background, so it loads lazily like the
                    // screenshot itself; decorative, so presentation and no alt.
                    <img
                      src={`/img/${project.dir}/${shot.slug}-${project.widths[0]}.avif`}
                      role="presentation"
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 size-full scale-110 object-cover opacity-40 blur-2xl"
                    />
                  )}
                  <Picture
                    base={`/img/${project.dir}/${shot.slug}`}
                    widths={project.widths}
                    width={w}
                    height={h}
                    alt={shot.alt}
                    sizes="(max-width: 640px) 92vw, 44vw"
                    className="relative aspect-[1600/828] h-auto w-full object-contain"
                  />
                </button>
              </div>
              <figcaption className={`mt-3 px-0.5 ${caption}`}>{shot.alt}</figcaption>
            </figure>
          </li>
        )
      })}
    </ul>
  )
}

/** The lightbox's round controls: big, filled and outlined, so they read over any screenshot. */
const control =
  'grid place-items-center rounded-full border border-white/35 bg-[rgb(30_36_54/0.92)] text-bone shadow-[0_8px_24px_-8px_rgb(0_0_0/0.8)] backdrop-blur-md transition hover:border-accent hover:bg-accent/20 hover:shadow-[0_0_0_4px_rgb(77_124_255/0.18)] focus-visible:border-accent'

/** Horizontal travel, in CSS px, that counts as a swipe rather than a tap. */
const SWIPE_PX = 48

/**
 * Full-size view on a native <dialog>: focus is trapped and restored, Esc
 * closes it, and the page behind is inert — all by the browser. Arrow keys, the
 * side buttons, the dots and (on touch screens) a sideways swipe step through
 * the project's screenshots.
 */
function Lightbox({
  project,
  index,
  onChange,
}: {
  project: Project
  index: number | null
  onChange: (i: number | null) => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  const swipe = useRef<{ x: number; y: number } | null>(null)
  const count = project.shots.length
  const many = count > 1

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (index !== null && !dialog.open) {
      opener.current = document.activeElement as HTMLElement | null
      dialog.showModal()
    }
    if (index === null) {
      if (dialog.open) dialog.close()
      // Back to the thumbnail that opened it, so keyboard users keep their place.
      opener.current?.focus({ preventScroll: true })
      opener.current = null
    }
  }, [index])

  const step = useCallback(
    (d: number) => onChange(index === null ? null : (index + d + count) % count),
    [index, count, onChange],
  )

  const shot = index === null ? null : project.shots[index]
  const phone = shot?.kind === 'phone'

  return (
    <dialog
      ref={ref}
      data-lenis-prevent
      aria-label={`${project.name} screenshots`}
      onClose={() => onChange(null)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') step(1)
        if (e.key === 'ArrowLeft') step(-1)
      }}
      // A click on the backdrop lands on the dialog element itself.
      onClick={(e) => {
        if (e.target === e.currentTarget) onChange(null)
      }}
      className="lightbox m-auto max-h-none max-w-none bg-transparent p-0 text-bone"
    >
      {shot && (
        <div className="flex h-dvh w-screen flex-col items-center justify-center gap-4 p-4 md:gap-5 md:p-8">
          <div className="flex w-full max-w-6xl items-center justify-between gap-4">
            <p className="text-sm text-bone md:text-base">
              <span className="font-semibold">{project.name}</span>
              <span className="ml-3 font-mono text-mist" aria-live="polite">
                {index! + 1} / {count}
              </span>
            </p>
            <button
              type="button"
              onClick={() => onChange(null)}
              className={`${control} grid-flow-col gap-2 px-4 py-2 text-sm`}
            >
              Close <span aria-hidden>✕</span>
            </button>
          </div>

          <div
            className="relative flex min-h-0 w-full max-w-6xl flex-1 items-center justify-center md:px-20"
            // Touch only: a mouse drag is left for selecting text.
            onPointerDown={(e) => {
              if (e.pointerType === 'touch') swipe.current = { x: e.clientX, y: e.clientY }
            }}
            onPointerUp={(e) => {
              const start = swipe.current
              swipe.current = null
              if (!start || !many) return
              const dx = e.clientX - start.x
              if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(e.clientY - start.y))
                step(dx < 0 ? 1 : -1)
            }}
            onPointerCancel={() => (swipe.current = null)}
          >
            <Picture
              key={shot.slug}
              base={`/img/${project.dir}/${shot.slug}`}
              widths={project.widths}
              width={sizeOf(shot)[0]}
              height={sizeOf(shot)[1]}
              alt={shot.alt}
              priority
              sizes={phone ? '50vh' : '90vw'}
              className={`max-h-full w-auto max-w-full rounded-lg border border-line object-contain select-none ${phone ? 'h-full' : ''}`}
            />
            {many && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous screenshot"
                  className={`${control} absolute top-1/2 left-1 size-12 -translate-y-1/2 md:left-0 md:size-14`}
                >
                  <Chevron flip />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next screenshot"
                  className={`${control} absolute top-1/2 right-1 size-12 -translate-y-1/2 md:right-0 md:size-14`}
                >
                  <Chevron />
                </button>
              </>
            )}
          </div>

          <p className="max-w-3xl text-center text-sm leading-relaxed text-bone/90 md:text-base">
            {shot.alt}
          </p>

          {many && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center">
                {project.shots.map((s, i) => (
                  <button
                    key={s.slug}
                    type="button"
                    onClick={() => onChange(i)}
                    aria-label={`Screenshot ${i + 1} of ${count}`}
                    aria-current={i === index ? 'true' : undefined}
                    className="group/dot grid h-8 place-items-center px-1.5"
                  >
                    <span
                      className={`block h-2 rounded-full transition-all ${
                        i === index ? 'w-6 bg-accent' : 'w-2 bg-line-strong group-hover/dot:bg-mist'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="font-mono text-xs text-mist pointer-coarse:hidden">
                ← → to browse · Esc to close
              </p>
              <p className="hidden font-mono text-xs text-mist pointer-coarse:block">
                Swipe to browse
              </p>
            </div>
          )}
        </div>
      )}
    </dialog>
  )
}

function Chevron({ flip = false }: { flip?: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={`size-6 ${flip ? 'rotate-180' : ''}`}>
      <path
        d="M9 5l7 7-7 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
