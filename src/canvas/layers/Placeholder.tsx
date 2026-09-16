import { Edges } from '@react-three/drei'
import { useRef } from 'react'
import type { Group } from 'three'
import type { Layer } from '../layers'
import { useLayerFrame } from '../useLayerFrame'

/**
 * Stand-in geometry for layers not built yet. Replaced one layer at a time in
 * Phase 3; gated like a real layer so the draw-call budget can be judged.
 */
export function Placeholder({ layer, index }: { layer: Layer; index: number }) {
  const group = useRef<Group>(null)

  useLayerFrame(index, group, (state, delta) => {
    const g = group.current!
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
