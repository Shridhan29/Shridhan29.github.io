import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { MathUtils, PerspectiveCamera, Vector3 } from 'three'
import { CAMERA_CURVE, LOOK_CURVE } from './curve'
import { LAYERS } from './layers'
import { useScrollStore } from '@/store/useScrollStore'

const position = new Vector3()
const look = new Vector3()

/**
 * Rides the camera along one curve rather than animating it per section.
 *
 * Raw scroll progress is damped before it reaches the curve, so a single wheel
 * notch glides instead of snapping — this is the frame-rate-independent
 * equivalent of ScrollTrigger's `scrub: 1`.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const damped = useRef(0)

  useFrame((_, delta) => {
    const target = useScrollStore.getState().progress
    damped.current = MathUtils.damp(damped.current, target, 4, delta)
    const t = MathUtils.clamp(damped.current, 0, 1)

    // getPoint, not getPointAt: by parameter, control point i sits at exactly
    // i / (n - 1), which is where the journey places layer i. Arc-length sampling
    // would shift every stop by the unequal lengths of the segments.
    CAMERA_CURVE.getPoint(t, position)
    LOOK_CURVE.getPoint(t, look)
    camera.position.copy(position)
    camera.lookAt(look)

    // Camera language: blend the field of view between the two layers the
    // camera sits between, so each stop is framed differently.
    const scaled = t * (LAYERS.length - 1)
    const i = Math.min(LAYERS.length - 2, Math.floor(scaled))
    const fov = MathUtils.lerp(LAYERS[i].fov, LAYERS[i + 1].fov, scaled - i)
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
  })

  return null
}
