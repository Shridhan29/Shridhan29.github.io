import { type ReactNode, useRef } from 'react'

/**
 * A soft light that follows the pointer across its child (5.3) — after React
 * Bits' `GlareHover`, as CSS custom properties and one gradient: no
 * dependencies, no re-renders. Purely decorative, and only where a fine pointer
 * can hover (see `.glare` in the stylesheet).
 */
export function Glare({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div
      ref={ref}
      className={`glare ${className}`}
      onPointerMove={(e) => {
        const el = ref.current
        if (!el) return
        const r = el.getBoundingClientRect()
        el.style.setProperty('--glare-x', `${e.clientX - r.left}px`)
        el.style.setProperty('--glare-y', `${e.clientY - r.top}px`)
      }}
    >
      {children}
    </div>
  )
}
