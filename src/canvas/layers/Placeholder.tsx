import { Edges } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import type { Layer } from '../layers'
import { useScrollStore } from '@/store/useScrollStore'

/**
 * Stand-in geometry for Phase 2. Real layers replace these in Phase 3, but the
 * visibility gating and the per-layer wake-up already work here so the camera
 * work can be judged against a constant draw-call budget.
 */
export function Placeholder({ layer, index }: { layer: Layer; index: number }) {
  const group = useRef<Group>(null)

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return

    // Skip work — and rendering — for layers the camera is nowhere near.
    const active = useScrollStore.getState().layer
    const near = Math.abs(active - index) <= 1
    g.visible = near
    if (!near) return

    g.rotation.y += delta * 0.15
    g.position.y = layer.anchor[1] + Math.sin(state.clock.elapsedTime + index) * 0.12
  })

  return (
    <group ref={group} position={layer.anchor}>
      <mesh>
        <boxGeometry args={[2.2, 2.2, 2.2]} />
        <meshBasicMaterial color={layer.color} transparent opacity={0.06} />
        <Edges color={layer.color} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <icosahedronGeometry args={[0.7, 0]} />
        <meshBasicMaterial color={layer.color} wireframe />
      </mesh>
    </group>
  )
}
