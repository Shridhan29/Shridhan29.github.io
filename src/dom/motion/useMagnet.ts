import { type RefObject, useEffect } from 'react'

/**
 * Pulls an element a little toward the pointer when it comes near (5.2) —
 * after React Bits' `Magnet`, as a hook with no dependencies and no re-renders:
 * it writes `transform` directly.
 *
 * Only for a fine pointer that can hover, and never with reduced motion; on
 * touch there is no pointer to follow.
 */
export function useMagnet<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { reach = 40, strength = 0.22 } = {},
) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const capable = window.matchMedia(
      '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
    )
    if (!capable.matches) return

    el.style.transition = 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)'
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const near = Math.abs(dx) < r.width / 2 + reach && Math.abs(dy) < r.height / 2 + reach
      el.style.transform = near ? `translate(${dx * strength}px, ${dy * strength}px)` : ''
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      el.style.transform = ''
      el.style.transition = ''
    }
  }, [ref, reach, strength])
}
