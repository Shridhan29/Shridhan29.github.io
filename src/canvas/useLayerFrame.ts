import { type RootState, useFrame } from '@react-three/fiber'
import type { RefObject } from 'react'
import type { Object3D } from 'three'
import { useScrollStore } from '@/store/useScrollStore'

/** How many layers either side of the active one stay rendered. */
const REACH = 1

/**
 * Visibility gating for a layer (tracker 3.7). Layers more than one step from
 * the camera are hidden — so they cost no draw calls — and their per-frame work
 * is skipped. Every layer goes through this, so the draw-call budget holds no
 * matter how much the individual layers contain.
 */
export function useLayerFrame(
  index: number,
  ref: RefObject<Object3D | null>,
  onFrame?: (state: RootState, delta: number) => void,
) {
  useFrame((state, delta) => {
    const object = ref.current
    if (!object) return
    const near = Math.abs(useScrollStore.getState().layer - index) <= REACH
    object.visible = near
    if (near) onFrame?.(state, delta)
  })
}
