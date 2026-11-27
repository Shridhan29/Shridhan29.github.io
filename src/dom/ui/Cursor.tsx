import { useEffect, useRef } from 'react'

const INTERACTIVE =
  'a, button, summary, label, [role="button"], input, textarea, select, [tabindex="0"]'

/**
 * A soft ring that trails the mouse on desktops and widens over anything that
 * can be clicked. It is decoration only: the system cursor stays visible, the
 * ring never takes pointer events, and it is not rendered at all on touch
 * screens, with reduced motion, or before the mouse first moves (so it never
 * sits in a screenshot or over the 3D scene uninvited).
 */
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ring.current
    if (!el) return
    // Only mouse movement turns the ring on (see onMove), so touch screens never
    // show it. A media query is not used for that: some desktops, and headless
    // Chrome, report no fine pointer even with a mouse attached.
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let x = 0
    let y = 0
    let rx = 0
    let ry = 0
    let frame = 0
    let shown = false

    let last = 0
    const tick = (now: number) => {
      // Eased by elapsed time, not per frame, so a slow frame rate trails no
      // further behind (about 70 ms to close most of the gap).
      const k = last ? 1 - Math.exp(-(now - last) / 70) : 0.2
      last = now
      rx += (x - rx) * k
      ry += (y - ry) * k
      el.style.translate = `${rx}px ${ry}px`
      const moving = Math.abs(x - rx) + Math.abs(y - ry) > 0.1
      frame = moving ? requestAnimationFrame(tick) : 0
      if (!moving) last = 0
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      x = e.clientX
      y = e.clientY
      if (!shown) {
        rx = x
        ry = y
        shown = true
      }
      const target = e.target as Element | null
      el.toggleAttribute('data-hot', !!target?.closest(INTERACTIVE))
      // The lightbox sits in the top layer, above the ring, so the ring steps aside.
      el.toggleAttribute('data-on', !document.querySelector('dialog[open]'))
      if (!frame) frame = requestAnimationFrame(tick)
    }
    const onLeave = () => el.removeAttribute('data-on')
    const onDown = () => el.setAttribute('data-down', '')
    const onUp = () => el.removeAttribute('data-down')

    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  return <div ref={ring} aria-hidden className="cursor-ring" />
}
