import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useScrollStore } from '@/store/useScrollStore'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'
import { FORCED_PROGRESS } from '@/debug'
import { measureStops, toJourney } from '@/store/stops'

gsap.registerPlugin(ScrollTrigger)

/**
 * Smooth scroll plus the single ScrollTrigger that publishes camera progress.
 * Scroll is mapped through measured stops, so each layer arrives with its
 * article rather than at an even fraction of the page.
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

    let stops = measureStops()
    let last = 0
    const publish = (scroll: number) => {
      const p = toJourney(scroll, stops)
      setProgress(p, p >= last ? 1 : -1)
      last = p
    }

    const trigger = ScrollTrigger.create({
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      // Damping lives in the camera rig, not here; this only reports.
      onUpdate: (self) => publish(self.scroll()),
    })

    // Images load, fonts settle and the viewport resizes: the articles move, so
    // the stops are measured again and the camera re-placed without a scroll.
    const remeasure = () => {
      stops = measureStops()
      publish(window.scrollY)
    }
    const observer = new ResizeObserver(remeasure)
    observer.observe(document.body)
    // A phone's address bar changes the viewport height without resizing body.
    window.addEventListener('resize', remeasure)
    publish(window.scrollY)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', remeasure)
      trigger.kill()
      if (raf) gsap.ticker.remove(raf)
      lenis?.destroy()
    }
  }, [reduced, setProgress])
}
