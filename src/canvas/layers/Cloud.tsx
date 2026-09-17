import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  EdgesGeometry,
  Float32BufferAttribute,
  type Group,
  type InstancedMesh,
  LineBasicMaterial,
  MathUtils,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Object3D,
} from 'three'
import type { Layer } from '../layers'
import { PALETTE } from '../palette'
import { Glow } from '../shared/Glow'
import { useStagedFrame } from '../useStagedFrame'

/**
 * L5 · Cloud — Azure and GitHub Actions, how the work reaches production.
 *
 * A delivery pipeline read bottom to top: a rail climbing through four stage
 * markers — commit, build and test, container registry, deploy — to a cluster
 * of containers rising above it, the running service. Drawn into the empty
 * space under the dates in the Experience entry's left column on desktop.
 * Slow-crane camera language: seen from slightly above, turning gently.
 *
 * The markers are lit evenly here; Phase 4.7 lights them stage by stage.
 */

const DISTANCE = 6

/** Rail from the first stage to the last; the containers sit above it. */
const RAIL = { bottom: -1.45, top: 0.75 }
const STAGE_Y = [-1.45, -0.72, 0.02, 0.75]

/** Containers, as offsets from the top of the rail: rising, and fanned slightly. */
const CONTAINERS: [number, number, number][] = [
  [-0.32, 0.55, 0.1],
  [0.3, 0.62, -0.12],
  [0, 0.92, 0.22],
  [-0.22, 1.28, -0.18],
  [0.26, 1.36, 0.12],
  [0.02, 1.7, 0],
]
const CONTAINER = 0.34

// Vertical extent of the whole pipeline, for centring and fitting it.
const TOP = RAIL.top + Math.max(...CONTAINERS.map(([, y]) => y)) + CONTAINER / 2
const BOTTOM = RAIL.bottom - 0.07
const SPAN_H = TOP - BOTTOM
const SPAN_W = 1.3

export function Cloud({ layer, index }: { layer: Layer; index: number }) {
  const group = useRef<Group>(null)
  const markers = useRef<InstancedMesh>(null)
  const lights = useRef<InstancedMesh>(null)

  const parts = useMemo(() => {
    const markerGeometry = new BoxGeometry(0.4, 0.14, 0.4)
    const markerMaterial = new MeshPhysicalMaterial({
      color: PALETTE.ink,
      metalness: 0,
      roughness: 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      envMapIntensity: 2.5,
    })
    const lightGeometry = new BoxGeometry(0.16, 0.03, 0.02)
    const lightMaterial = new MeshBasicMaterial({ color: layer.color, toneMapped: false })

    // Every container's edges merged into one line set: one draw call for all.
    const box = new BoxGeometry(CONTAINER, CONTAINER, CONTAINER)
    const cube = new EdgesGeometry(box)
    box.dispose()
    const source = cube.attributes.position.array as Float32Array
    const merged = new Float32Array(source.length * CONTAINERS.length)
    CONTAINERS.forEach(([x, y, z], c) => {
      for (let i = 0; i < source.length; i += 3) {
        merged[c * source.length + i] = source[i] + x
        merged[c * source.length + i + 1] = source[i + 1] + y + RAIL.top
        merged[c * source.length + i + 2] = source[i + 2] + z
      }
    })
    cube.dispose()
    const containerGeometry = new BufferGeometry()
    containerGeometry.setAttribute('position', new Float32BufferAttribute(merged, 3))
    const containerMaterial = new LineBasicMaterial({ color: layer.color, toneMapped: false })

    const railGeometry = new CylinderGeometry(0.018, 0.018, RAIL.top - RAIL.bottom, 12)
    const railMaterial = new MeshPhysicalMaterial({
      color: PALETTE.slate,
      metalness: 0,
      roughness: 0.3,
      clearcoat: 1,
      envMapIntensity: 2,
    })

    return {
      markerGeometry,
      markerMaterial,
      lightGeometry,
      lightMaterial,
      containerGeometry,
      containerMaterial,
      railGeometry,
      railMaterial,
    }
  }, [layer.color])

  useLayoutEffect(() => {
    const dummy = new Object3D()
    STAGE_Y.forEach((y, i) => {
      dummy.position.set(0, y, 0)
      dummy.updateMatrix()
      markers.current?.setMatrixAt(i, dummy.matrix)
      // The indicator sits on the marker's front edge.
      dummy.position.set(0, y, 0.211)
      dummy.updateMatrix()
      lights.current?.setMatrixAt(i, dummy.matrix)
    })
    if (markers.current) markers.current.instanceMatrix.needsUpdate = true
    if (lights.current) lights.current.instanceMatrix.needsUpdate = true
  }, [])

  useLayoutEffect(() => () => Object.values(parts).forEach((p) => p.dispose()), [parts])

  useStagedFrame('cloud', index, group, DISTANCE, (fit, state) => {
    const g = group.current!
    g.scale.setScalar(Math.min((fit.height * 0.86) / SPAN_H, (fit.width * 0.78) / SPAN_W))
    // Slow crane: looking down on it, turning gently.
    g.rotateX(0.3 + MathUtils.clamp(fit.screenY, -1, 1) * -0.06)
    g.rotateY(-0.5 + state.clock.elapsedTime * 0.08)
  })

  return (
    <group ref={group} visible={false} userData={{ layer: layer.id }}>
      {/* Centred on the whole pipeline, rail bottom to top container. */}
      <group position={[0, -(TOP + BOTTOM) / 2, 0]}>
        <mesh
          geometry={parts.railGeometry}
          material={parts.railMaterial}
          position={[0, (RAIL.top + RAIL.bottom) / 2, 0]}
        />
        <instancedMesh
          ref={markers}
          args={[parts.markerGeometry, parts.markerMaterial, STAGE_Y.length]}
        />
        <instancedMesh
          ref={lights}
          args={[parts.lightGeometry, parts.lightMaterial, STAGE_Y.length]}
        />
        <lineSegments geometry={parts.containerGeometry} material={parts.containerMaterial} />
        <Glow
          color={layer.color}
          width={2.6}
          height={4.6}
          strength={0.18}
          position={[0, 0.2, -0.7]}
        />
      </group>
    </group>
  )
}
