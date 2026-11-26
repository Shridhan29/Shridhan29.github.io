import type { ReactNode } from 'react'

export function Section({
  id,
  label,
  title,
  children,
}: {
  id: string
  label: string
  title: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="reveal scroll-mt-24 py-16 md:py-24 xl:py-28"
    >
      <div className="mb-8 flex items-center gap-4 md:mb-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.03] px-3 py-1 font-mono text-[0.7rem] tracking-[0.2em] text-accent-soft uppercase">
          <span aria-hidden className="size-1.5 rounded-full bg-accent" />
          {label}
        </span>
        <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-line to-transparent" />
      </div>
      <h2
        id={`${id}-heading`}
        className="t-section mb-10 max-w-[20ch] font-semibold text-balance md:mb-16"
      >
        {title}
      </h2>
      {children}
    </section>
  )
}
