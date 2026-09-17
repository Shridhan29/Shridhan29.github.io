import { type ReactNode, Suspense, useEffect, useState } from 'react'
import { useScrollStore } from '@/store/useScrollStore'
import { REACH } from './useLayerFrame'

/**
 * Mounts a staged layer — and so starts its texture downloads — only once it
 * can be seen: its stage is laid out, and the camera is within reach of it.
 *
 * Without this every staged layer loaded at startup: 156 KB of screenshots on a
 * phone, where no stage is ever shown, and the aashman.in pages on desktop
 * before anyone had scrolled past the hero. Once mounted it stays mounted, so
 * scrolling back does not reload or recompile anything.
 */
export function Staged({
  stage,
  index,
  children,
}: {
  stage: string
  index: number
  children: ReactNode
}) {
  const near = useScrollStore((s) => Math.abs(s.layer - index) <= REACH)
  const laidOut = useLaidOut(`[data-stage="${stage}"]`)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (near && laidOut) setReady(true)
  }, [near, laidOut])

  // Its own boundary: while textures load, the rest of the scene keeps rendering.
  return ready ? <Suspense fallback={null}>{children}</Suspense> : null
}

/** Whether the element has a layout box — false while it is display: none at this breakpoint. */
function useLaidOut(selector: string) {
  const [laidOut, setLaidOut] = useState(false)

  useEffect(() => {
    const el = document.querySelector(selector)
    if (!el) return
    const update = () => setLaidOut(el.getBoundingClientRect().width > 0)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [selector])

  return laidOut
}
