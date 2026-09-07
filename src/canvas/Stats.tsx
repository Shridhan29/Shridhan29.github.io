import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { useScrollStore } from '@/store/useScrollStore'

/** Publishes renderer counters to the store for the ?debug=1 overlay. */
export function Stats() {
  const gl = useThree((s) => s.gl)
  // three clears the render counters at the top of every render(), so reading
  // them from useFrame — which runs before the render — always yields zero.
  // Taking over the reset lets the numbers survive long enough to be read.
  gl.info.autoReset = false
  const setStats = useScrollStore((s) => s.setStats)
  const frames = useRef(0)
  const elapsed = useRef(0)

  useFrame((_, delta) => {
    frames.current += 1
    elapsed.current += delta
    if (elapsed.current < 0.5) return
    setStats({
      fps: Math.round(frames.current / elapsed.current),
      calls: gl.info.render.calls,
      tris: gl.info.render.triangles,
    })
    frames.current = 0
    elapsed.current = 0
    gl.info.reset()
  })

  return null
}
