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
    <section id={id} aria-labelledby={`${id}-heading`} className="reveal scroll-mt-24 py-20 md:py-28 xl:py-36">
      <div className="mb-10 flex items-baseline gap-4 md:mb-14">
        <span className="font-mono text-xs tracking-[0.2em] text-accent uppercase">{label}</span>
        <span aria-hidden className="h-px flex-1 bg-slate" />
      </div>
      <h2 id={`${id}-heading`} className="t-section mb-8 max-w-[20ch] font-semibold text-balance md:mb-14">
        {title}
      </h2>
      {children}
    </section>
  )
}
