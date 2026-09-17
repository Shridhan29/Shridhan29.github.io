import { type RootState, useThree } from '@react-three/fiber'
import { type RefObject, useEffect, useMemo, useRef } from 'react'
import type { Object3D, PerspectiveCamera } from 'three'
import { Vector3 } from 'three'
import { type StageFit, fitToStage } from './stage'
import { useLayerFrame } from './useLayerFrame'

/**
 * The frame loop for a staged layer (ARCHITECTURE §4.6): visibility-gated like
 * every layer, then placed on the camera ray through its stage and turned to
 * face the camera. `onFrame` sizes and animates the content for this frame.
 * Hidden whenever the stage is not laid out or is off screen.
 */
export function useStagedFrame(
  stage: string,
  index: number,
  ref: RefObject<Object3D | null>,
  distance: number,
  onFrame: (fit: StageFit, state: RootState) => void,
) {
  const element = useRef<Element | null>(null)
  const target = useMemo(() => new Vector3(), [])
  const size = useThree((s) => s.size)

  useEffect(() => {
    element.current = document.querySelector(`[data-stage="${stage}"]`)
  }, [stage])

  useLayerFrame(index, ref, (state) => {
    const object = ref.current!
    const camera = state.camera as PerspectiveCamera
    const fit = element.current ? fitToStage(element.current, camera, size, distance, target) : null

    object.visible = !!fit?.visible
    if (!fit?.visible) return

    object.position.copy(target)
    object.quaternion.copy(camera.quaternion)
    onFrame(fit, state)
  })
}
