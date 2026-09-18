import { RoundedBox } from '@react-three/drei'
import { type RefObject, useLayoutEffect, useMemo, useRef } from 'react'
import {
  CatmullRomCurve3,
  type Group,
  type InstancedMesh,
  MathUtils,
  MeshBasicMaterial,
  Object3D,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from 'three'
import type { Layer } from '../layers'
import { PALETTE } from '../palette'
import { Glow } from '../shared/Glow'
import { useStagedFrame } from '../useStagedFrame'
import { useScrollStore } from '@/store/useScrollStore'

/**
 * L4 · Core — FastAPI and PostgreSQL, the service behind the products.
 *
 * A request's path as a diagram in space: a line comes in from the edge, runs
 * into the API, and on to the database. The API is a glass block with lit
 * endpoint slots; the database is the stacked discs everyone reads as one.
 * No labels — words belong in the page. Drawn into the empty column beside the
 * About copy on desktop, where the stats sit on smaller screens.
 *
 * The packets travel the lines, in from the edge and on to the database (4.6):
 * the request path is read by watching it move, not by labelling it.
 */

const DISTANCE = 6

// Diagram layout, in units: API upper left, database lower right and further back.
const API = new Vector3(-0.55, 0.45, 0.2)
const DB = new Vector3(0.75, -0.55, -0.3)

/** Incoming request line, and the API-to-database line. */
const CURVES = [
  new CatmullRomCurve3([
    new Vector3(-1.9, 0.9, 0.5),
    new Vector3(-1.3, 0.55, 0.4),
    API.clone().add(new Vector3(-0.5, 0, 0)),
  ]),
  new CatmullRomCurve3([
    API.clone().add(new Vector3(0.3, -0.35, 0)),
    new Vector3(0.35, -0.2, 0),
    DB.clone().add(new Vector3(-0.2, 0.3, 0)),
  ]),
]
const PACKETS_PER_LINE = 7
/** Fraction of a line travelled per second. */
const SPEED = 0.16

function Glass() {
  return (
    <meshPhysicalMaterial
      color={PALETTE.ink}
      metalness={0}
      roughness={0.22}
      clearcoat={1}
      clearcoatRoughness={0.05}
      envMapIntensity={2.5}
    />
  )
}

export function Core({ layer, index }: { layer: Layer; index: number }) {
  const group = useRef<Group>(null)
  const setEffect = useScrollStore((s) => s.setEffect)
  const packets = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])

  useStagedFrame('core', index, group, DISTANCE, (fit, state) => {
    const g = group.current!
    // The diagram spans about 3.1 × 2.4 units.
    g.scale.setScalar(Math.min((fit.width * 0.8) / 3.1, (fit.height * 0.8) / 2.4))
    // Forward push: the diagram leans in as the column rises through the screen.
    g.rotateY(-0.35 + Math.sin(state.clock.elapsedTime * 0.25) * 0.04)
    g.rotateX(0.18 + MathUtils.clamp(fit.screenY, -1, 1) * -0.08)

    // Packets ride the curves; each line's packets are evenly spaced and all
    // move together, so the diagram reads as one continuous request path.
    const mesh = packets.current
    if (!mesh) return
    const travelled = state.clock.elapsedTime * SPEED
    // Published so the effect is checked by its own state: the diagram also
    // sways, so "pixels changed" cannot tell whether the packets are moving.
    setEffect('packets', Math.round((travelled % 1) * 100))
    CURVES.forEach((curve, c) => {
      for (let i = 0; i < PACKETS_PER_LINE; i++) {
        const along = (travelled + (i + 0.5) / PACKETS_PER_LINE) % 1
        curve.getPointAt(along, dummy.position)
        // Fade in and out at the ends instead of popping.
        const edge = Math.min(along, 1 - along) / 0.12
        dummy.scale.setScalar(MathUtils.clamp(edge, 0, 1))
        dummy.updateMatrix()
        mesh.setMatrixAt(c * PACKETS_PER_LINE + i, dummy.matrix)
      }
    })
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <group ref={group} visible={false} userData={{ layer: layer.id }}>
      {/* API: a glass block with three lit endpoint slots on its face. */}
      <group position={API}>
        <RoundedBox args={[0.9, 0.9, 0.9]} radius={0.06} smoothness={4}>
          <Glass />
        </RoundedBox>
        {[0.2, 0, -0.2].map((y, i) => (
          <mesh key={y} position={[-0.08 + i * 0.04, y, 0.452]}>
            <planeGeometry args={[0.5 - i * 0.1, 0.045]} />
            <meshBasicMaterial color={layer.color} toneMapped={false} />
          </mesh>
        ))}
      </group>

      {/* PostgreSQL: three stacked discs with lit seams between them. */}
      <group position={DB}>
        {[0.26, 0, -0.26].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <cylinderGeometry args={[0.46, 0.46, 0.22, 48]} />
            <Glass />
          </mesh>
        ))}
        {[0.13, -0.13].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <cylinderGeometry args={[0.47, 0.47, 0.018, 48, 1, true]} />
            <meshBasicMaterial color={layer.color} toneMapped={false} />
          </mesh>
        ))}
      </group>

      <Lines color={layer.color} packets={packets} />
      <Glow color={layer.color} width={4.2} height={3.4} strength={0.14} position={[0, 0, -0.9]} />
    </group>
  )
}

/** The lines as thin glass tubes, and every packet on them as one instanced draw call. */
function Lines({ color, packets }: { color: string; packets: RefObject<InstancedMesh | null> }) {
  const tubes = useMemo(() => CURVES.map((c) => new TubeGeometry(c, 48, 0.028, 8)), [])
  const packetGeometry = useMemo(() => new SphereGeometry(0.05, 12, 12), [])
  const packetMaterial = useMemo(() => new MeshBasicMaterial({ color, toneMapped: false }), [color])

  useLayoutEffect(
    () => () => {
      tubes.forEach((t) => t.dispose())
      packetGeometry.dispose()
      packetMaterial.dispose()
    },
    [tubes, packetGeometry, packetMaterial],
  )

  return (
    <>
      {tubes.map((geometry, i) => (
        <mesh key={i} geometry={geometry}>
          <meshPhysicalMaterial
            color={PALETTE.slate}
            metalness={0}
            roughness={0.3}
            clearcoat={1}
            envMapIntensity={2}
          />
        </mesh>
      ))}
      <instancedMesh
        ref={packets}
        args={[packetGeometry, packetMaterial, CURVES.length * PACKETS_PER_LINE]}
      />
    </>
  )
}
