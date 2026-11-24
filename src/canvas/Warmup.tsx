import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'

/**
 * Reveal gate for the canvas (5.1). Compiles every shader in the scene up front
 * (asynchronously, where the driver allows),
 * then waits two real frames before calling `onReady`, so the fade-in shows a
 * finished picture instead of the black flicker of programs compiling on first
 * draw. Staged layers that mount later compile on their own approach; this only
 * guards the first reveal.
 */
export function Warmup({ onReady }: { onReady: () => void }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const frames = useRef(-1)

  useEffect(() => {
    let cancelled = false
    // Async: with KHR_parallel_shader_compile the driver compiles off the main
    // thread and three polls for completion, instead of one long blocking task
    // (it was ~1 s of Total Blocking Time under Lighthouse). Without the
    // extension it degrades to the same work as compile(), spread over ticks.
    gl.compileAsync(scene, camera)
      .catch(() => undefined)
      .then(() => {
        if (!cancelled) frames.current = 0
      })
    return () => {
      cancelled = true
    }
  }, [gl, scene, camera])

  useFrame(() => {
    if (frames.current < 0 || frames.current > 2) return
    frames.current += 1
    if (frames.current === 2) onReady()
  })

  return null
}
