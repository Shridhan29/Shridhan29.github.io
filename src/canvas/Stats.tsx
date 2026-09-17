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
    // The counters accumulate over the whole sample window, so divide by the
    // frame count: the budgets (≤ 120 draw calls) are per frame, and a raw
    // total would scale with fps instead of with the scene.
    setStats({
      fps: Math.round(frames.current / elapsed.current),
      ms: Math.round((elapsed.current / frames.current) * 10000) / 10,
      calls: Math.round(gl.info.render.calls / frames.current),
      tris: Math.round(gl.info.render.triangles / frames.current),
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      programs: gl.info.programs?.length ?? 0,
    })
    frames.current = 0
    elapsed.current = 0
    gl.info.reset()
  })

  return null
}
