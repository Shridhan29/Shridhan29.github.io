import { PerformanceMonitor } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { useQualityStore } from '@/store/useQualityStore'
import { useScrollStore } from '@/store/useScrollStore'

/**
 * The auto-downgrade ladder (6.2, ARCHITECTURE §6): when the frame rate cannot
 * hold, step down one rung at a time —
 *
 *   High → Medium   glass, vignette and aberration off; fewer particles
 *   Medium → Low    post-processing off; fewer again
 *   Low → DPR 1     render at CSS resolution
 *
 * Each rung waits for drei's PerformanceMonitor to see a sustained decline, so
 * one slow frame (a shader compiling as a layer mounts) does not cost quality.
 * Never steps back up within a visit: flip-flopping between tiers would
 * recompile shaders each time, which is itself the stutter it is avoiding.
 * A tier the visitor chose, or a `?tier=`, is left alone.
 */
export function AutoDowngrade() {
  const setDpr = useThree((s) => s.setDpr)
  const downgrade = useQualityStore((s) => s.downgrade)
  const setEffect = useScrollStore((s) => s.setEffect)
  const steps = useRef(0)
  const floored = useRef(false)

  const onDecline = () => {
    if (useQualityStore.getState().source === 'override') return
    if (downgrade()) {
      steps.current += 1
    } else if (!floored.current) {
      floored.current = true
      steps.current += 1
      setDpr(1)
    } else {
      return
    }
    setEffect('downgrades', steps.current)
  }

  return <PerformanceMonitor onDecline={onDecline} flipflops={Infinity} />
}
