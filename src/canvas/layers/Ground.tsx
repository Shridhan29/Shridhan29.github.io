import { RoundedBox } from '@react-three/drei'
import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  BoxGeometry,
  type Group,
  type InstancedMesh,
  MathUtils,
  MeshStandardMaterial,
  Object3D,
} from 'three'
import type { Layer } from '../layers'
import { Glow } from '../shared/Glow'
import { ScreenPlane } from '../shared/ScreenPlane'
import { KioskScreen } from '../shared/KioskScreen'
import { useStagedFrame } from '../useStagedFrame'

/**
 * L3 · Ground — the Raspberry Pi products running in the field.
 *
 * The one warm layer (decision D1). Two pieces of physical hardware, each drawn
 * into the stage its article reserves on desktop, in place of its screenshots:
 *
 * - DMS: a countertop point-of-sale terminal showing the real POS screen, with
 *   the Raspberry Pi board that runs it lying beside it.
 * - Urja Dairy Tour: a free-standing kiosk showing the real language chooser.
 *
 * Grounded, eye-level camera language: both sway only slightly. Warmth comes
 * from an amber glow, not a real-time light, which would recompile every lit
 * material in the scene as the layer mounts.
 *
 * The kiosk's screen is the real interface, running (4.5): pick a language and
 * the tour list answers. The POS terminal keeps its screenshot — it is a till,
 * not something to try.
 */

const DISTANCE = 6

/** Painted-metal housings: matte, so the screens are the brightest thing. */
function Housing() {
  return <meshStandardMaterial color="#1c2130" metalness={0.35} roughness={0.55} />
}

// ------------------------------------------------------------ POS terminal --

/** DMS point-of-sale screenshot is 1284 × 959. */
const POS_W = 1.4
const POS_H = POS_W * (959 / 1284)

export function GroundPos({ layer, index }: { layer: Layer; index: number }) {
  const group = useRef<Group>(null)

  useStagedFrame('ground-pos', index, group, DISTANCE, (fit, state) => {
    const g = group.current!
    // The terminal and board together span about 3.3 × 2 units.
    g.scale.setScalar(Math.min((fit.width * 0.7) / 3.3, (fit.height * 0.8) / 2.1))
    g.rotateY(0.28 + Math.sin(state.clock.elapsedTime * 0.3) * 0.03)
    g.rotateX(0.12 + MathUtils.clamp(fit.screenY, -1, 1) * -0.05)
  })

  return (
    <group ref={group} visible={false} userData={{ layer: layer.id }}>
      <group position={[-0.45, 0, 0]}>
        {/* Base, neck and a screen housing tilted back toward the operator. */}
        <RoundedBox args={[0.95, 0.08, 0.62]} radius={0.02} position={[0, -0.98, 0.05]}>
          <Housing />
        </RoundedBox>
        <mesh position={[0, -0.72, -0.05]} rotation={[-0.25, 0, 0]}>
          <boxGeometry args={[0.14, 0.5, 0.1]} />
          <Housing />
        </mesh>
        <group position={[0, 0.02, -0.12]} rotation={[-0.2, 0, 0]}>
          <RoundedBox args={[POS_W + 0.1, POS_H + 0.1, 0.08]} radius={0.03}>
            <Housing />
          </RoundedBox>
          <ScreenPlane
            url="/img/dms/02-point-of-sale-1600.webp"
            width={POS_W}
            height={POS_H}
            radius={0.02}
            position={[0, 0, 0.042]}
          />
        </group>
      </group>

      <RaspberryPi position={[1.15, -0.93, 0.35]} rotation={[0, -0.5, 0]} />
      <Glow color={layer.color} width={4.4} height={3} strength={0.5} position={[0, 0, -0.6]} />
    </group>
  )
}

// ------------------------------------------------------------ Raspberry Pi --

/**
 * A Raspberry Pi 4 at 1 unit ≈ 100 mm: 85 × 56 mm board, SoC, two USB stacks,
 * Ethernet, and the 40-pin GPIO header as one instanced draw call.
 */
function RaspberryPi({
  position,
  rotation,
}: {
  position: [number, number, number]
  rotation: [number, number, number]
}) {
  const pins = useRef<InstancedMesh>(null)
  const pinGeometry = useMemo(() => new BoxGeometry(0.0064, 0.06, 0.0064), [])
  const pinMaterial = useMemo(
    () => new MeshStandardMaterial({ color: '#d4b35a', metalness: 0.9, roughness: 0.3 }),
    [],
  )

  useLayoutEffect(() => {
    const mesh = pins.current
    if (!mesh) return
    const dummy = new Object3D()
    // 2 × 20 at 2.54 mm pitch, along the board's long edge.
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 20; col++) {
        dummy.position.set(-0.24 + col * 0.0254, 0.04, -0.245 + row * 0.0254)
        dummy.updateMatrix()
        mesh.setMatrixAt(row * 20 + col, dummy.matrix)
      }
    }
    mesh.instanceMatrix.needsUpdate = true
    return () => {
      pinGeometry.dispose()
      pinMaterial.dispose()
    }
  }, [pinGeometry, pinMaterial])

  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[0.85, 0.016, 0.56]} />
        <meshStandardMaterial color="#1d6b3c" roughness={0.7} metalness={0.1} />
      </mesh>
      {/* SoC */}
      <mesh position={[-0.12, 0.018, 0.02]}>
        <boxGeometry args={[0.15, 0.02, 0.15]} />
        <meshStandardMaterial color="#20232b" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* USB stacks and Ethernet along the short edge */}
      {[-0.12, 0.08].map((z) => (
        <mesh key={z} position={[0.36, 0.08, z]}>
          <boxGeometry args={[0.17, 0.15, 0.14]} />
          <meshStandardMaterial color="#b9bec8" roughness={0.35} metalness={0.9} />
        </mesh>
      ))}
      <mesh position={[0.36, 0.075, 0.23]}>
        <boxGeometry args={[0.2, 0.13, 0.16]} />
        <meshStandardMaterial color="#b9bec8" roughness={0.35} metalness={0.9} />
      </mesh>
      <instancedMesh ref={pins} args={[pinGeometry, pinMaterial, 40]} />
    </group>
  )
}

// ------------------------------------------------------------------- kiosk --

/** Urja kiosk screenshots are 1600 × 823. */
const KIOSK_W = 1.6
const KIOSK_H = KIOSK_W * (823 / 1600)

export function GroundKiosk({ layer, index }: { layer: Layer; index: number }) {
  const group = useRef<Group>(null)

  useStagedFrame('ground-kiosk', index, group, DISTANCE, (fit, state) => {
    const g = group.current!
    // The kiosk stands about 3 units tall and 1.8 wide.
    g.scale.setScalar(Math.min((fit.height * 0.84) / 3, (fit.width * 0.8) / 1.8))
    g.rotateY(-0.32 + Math.sin(state.clock.elapsedTime * 0.3) * 0.03)
    g.rotateX(0.1 + MathUtils.clamp(fit.screenY, -1, 1) * -0.05)
  })

  return (
    <group ref={group} visible={false} userData={{ layer: layer.id }}>
      {/* Floor plate, column, and a landscape head angled up toward a visitor. */}
      <RoundedBox args={[0.9, 0.06, 0.62]} radius={0.02} position={[0, -1.47, 0]}>
        <Housing />
      </RoundedBox>
      <RoundedBox args={[0.3, 1.9, 0.22]} radius={0.04} position={[0, -0.5, -0.02]}>
        <Housing />
      </RoundedBox>
      <group position={[0, 0.72, 0.06]} rotation={[-0.3, 0, 0]}>
        <RoundedBox args={[KIOSK_W + 0.12, KIOSK_H + 0.12, 0.09]} radius={0.04}>
          <Housing />
        </RoundedBox>
        <KioskScreen width={KIOSK_W} />
      </group>
      <Glow color={layer.color} width={3} height={3.6} strength={0.5} position={[0, 0.1, -0.6]} />
    </group>
  )
}
