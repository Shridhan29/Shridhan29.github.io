import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useScrollStore } from '@/store/useScrollStore'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'
import { FORCED_PROGRESS } from '@/debug'

gsap.registerPlugin(ScrollTrigger)

/**
 * Smooth scroll plus the single ScrollTrigger that publishes document progress.
 *
 * Lenis scrolls the window itself, so no `scrollerProxy` is needed — it only has
 * to drive `ScrollTrigger.update` and be stepped from GSAP's ticker so both share
 * one clock. Reduced-motion users get native scrolling and the same progress
 * values, so nothing downstream has to special-case them.
 */
export function useLenis() {
  const reduced = usePrefersReducedMotion()
  const setProgress = useScrollStore((s) => s.setProgress)

  useEffect(() => {
    // ?p= pins the camera for inspection; no scroll machinery needed.
    if (FORCED_PROGRESS !== null) {
      setProgress(FORCED_PROGRESS, 1)
      return
    }

    let lenis: Lenis | undefined
    let raf: ((time: number) => void) | undefined

    if (!reduced) {
      lenis = new Lenis({ duration: 1.1, smoothWheel: true })
      lenis.on('scroll', ScrollTrigger.update)
      raf = (time: number) => lenis!.raf(time * 1000)
      gsap.ticker.add(raf)
      gsap.ticker.lagSmoothing(0)
    }

    let last = 0
    const trigger = ScrollTrigger.create({
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      // `scrub: 1` lives on the camera tween, not here; this only reports.
      onUpdate: (self) => {
        const p = self.progress
        setProgress(p, p >= last ? 1 : -1)
        last = p
      },
    })

    return () => {
      trigger.kill()
      if (raf) gsap.ticker.remove(raf)
      lenis?.destroy()
    }
  }, [reduced, setProgress])
}
