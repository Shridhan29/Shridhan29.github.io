import { type RootState, useFrame } from '@react-three/fiber'
import type { RefObject } from 'react'
import type { Material, Mesh, Object3D, Texture } from 'three'
import { useScrollStore } from '@/store/useScrollStore'
import { studioFor } from './Lighting'

/** How many layers either side of the active one stay rendered. */
export const REACH = 1

type EnvMaterial = Material & { envMap: Texture | null; isMeshStandardMaterial?: boolean }

/**
 * Visibility gating for a layer (tracker 3.7). Layers more than one step from
 * the camera are hidden — so they cost no draw calls — and their per-frame work
 * is skipped. Every layer goes through this, so the draw-call budget holds no
 * matter how much the individual layers contain.
 *
 * It also lights the layer with its own studio (4.9): every standard material
 * in it is pointed at the layer's environment map. Checked each visible frame,
 * so meshes that mount late (a model finishing its download) are caught too.
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
    if (!near) return
    if (index > 0) {
      const env = studioFor(state.gl, index)
      object.traverse((child) => {
        const material = (child as Mesh).material as EnvMaterial | EnvMaterial[] | undefined
        if (!material) return
        for (const m of Array.isArray(material) ? material : [material]) {
          if (m.isMeshStandardMaterial && m.envMap !== env) m.envMap = env
        }
      })
    }
    onFrame?.(state, delta)
  })
}
