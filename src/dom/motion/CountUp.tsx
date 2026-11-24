import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

/**
 * A figure that counts up once when it first comes into view (5.3) — modelled
 * on React Bits' `CountUp`, rewritten without `motion` so it costs a few
 * hundred bytes instead of a library.
 *
 * Takes the figure as written ("20+", "100%"): the leading number counts, the
 * rest stays put. The final value is always in the DOM for screen readers and
 * crawlers; only the visible copy animates, and not at all with reduced motion.
 */
export function CountUp({ value, duration = 1200 }: { value: string; duration?: number }) {
  const reduced = usePrefersReducedMotion()
  const match = /^(\d+)(.*)$/.exec(value)
  const target = match ? Number(match[1]) : 0
  const suffix = match ? match[2] : ''
  const numeric = !!match
  const ref = useRef<HTMLSpanElement>(null)
  const [current, setCurrent] = useState(reduced || !numeric ? target : 0)

  useEffect(() => {
    const el = ref.current
    if (reduced || !numeric || !el) {
      setCurrent(target)
      return
    }
    let frame = 0
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        const start = performance.now()
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration)
          // Ease out: quick at first, settling onto the figure.
          setCurrent(Math.round(target * (1 - (1 - t) ** 3)))
          if (t < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
      },
      { threshold: 0.6 },
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [target, numeric, duration, reduced])

  if (!numeric) return <>{value}</>
  return (
    <span ref={ref}>
      <span className="sr-only">{value}</span>
      <span aria-hidden className="tabular-nums">
        {current}
        {suffix}
      </span>
    </span>
  )
}
