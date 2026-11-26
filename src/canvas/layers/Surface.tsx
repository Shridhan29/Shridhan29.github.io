import { useTexture } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { type Group, type Mesh, MathUtils, SRGBColorSpace } from 'three'
import type { Layer } from '../layers'
import { PALETTE } from '../palette'
import { useStagedFrame } from '../useStagedFrame'
import { useScrollStore } from '@/store/useScrollStore'
import { useQualityStore } from '@/store/useQualityStore'

/**
 * L2 · Surface — aashman.in, the company's React site.
 *
 * Six pages of the site as layered panes, cascading back in depth like browser
 * windows, drawn into the stage the aashman.in article reserves on desktop in
 * place of its screenshot grid. The camera language here is a lateral truck:
 * as the stage scrolls, each pane slides sideways at a speed set by its depth,
 * so the stack separates the way windows would past a moving camera.
 *
 * It once had glowing ribbons woven between the panes (4.4). The opaque panes
 * hid most of their length, so what showed read as stray blue bars, and they
 * were removed. On the High
 * tier a sheet of real glass (transmission) lies over the front page; it
 * renders the opaque scene a second time per frame, so no other tier gets it.
 */

/** Front to back. The front pane is the one read closely, so it gets 1600 px. */
const PAGES = [
  { slug: '02-home', width: 1600 },
  { slug: '05-products', width: 800 },
  { slug: '04-services', width: 800 },
  { slug: '07-contact', width: 800 },
  { slug: '06-help', width: 800 },
  { slug: '03-about', width: 800 },
]
const URLS = PAGES.map((p) => `/img/aashman.in/${p.slug}-${p.width}.webp`)

/** Screenshots are 1600 × 828. Panes are one unit tall. */
const PANE_W = 1600 / 828
const PANE_H = 1

/** Each pane steps this far left, up and back from the one in front of it. */
const STEP = { x: -0.5, y: 0.13, z: -0.42 }

// Extent of the stack, measured from the layout itself, so it always fits its stage.
const CENTRED: Origin = {
  x: -(STEP.x * (PAGES.length - 1)) / 2,
  y: -(STEP.y * (PAGES.length - 1)) / 2,
}

/** Share of the stage the cascade may fill, leaving room for the turn and the slide. */
const FILL = 0.74
/** Extra reach of the lateral truck at full travel, in pane units. */
const TRUCK_REACH = 0.16 * (PAGES.length - 1)
const DISTANCE = 6
/** How far, in pane units per unit of screen travel, the back pane slides relative to the front. */
const TRUCK = 0.16

type Origin = { x: number; y: number }

const EXTENT = (() => {
  let [w, h] = [0, 0]
  PAGES.forEach((_, i) => {
    // A pane, plus how far the truck can carry it sideways.
    w = Math.max(w, Math.abs(CENTRED.x + STEP.x * i) + PANE_W / 2 + TRUCK_REACH)
    h = Math.max(h, Math.abs(CENTRED.y + STEP.y * i) + PANE_H / 2)
  })
  return { width: w * 2, height: h * 2 }
})()

export function Surface({ layer, index }: { layer: Layer; index: number }) {
  const group = useRef<Group>(null)
  const panes = useRef<(Mesh | null)[]>([])
  const gl = useThree((s) => s.gl)
  const setEffect = useScrollStore((s) => s.setEffect)

  const textures = useTexture(URLS, (loaded) => {
    for (const t of Array.isArray(loaded) ? loaded : [loaded]) {
      t.colorSpace = SRGBColorSpace
      // Panes are turned away from the camera; without this their text smears.
      t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
    }
  })

  const origin = CENTRED
  // Real glass renders the opaque scene a second time per frame, so High only (§7).
  const glass = useQualityStore((s) => s.tier === 'high')
  useEffect(() => setEffect('glass', glass ? 1 : 0), [glass, setEffect])

  useStagedFrame('surface', index, group, DISTANCE, (fit) => {
    const g = group.current!
    g.scale.setScalar(
      Math.min((fit.width * FILL) / EXTENT.width, (fit.height * FILL) / EXTENT.height),
    )
    // Turned so the stack reads as depth, not as a flat collage.
    g.rotateY(0.32)

    // Lateral truck: deeper panes slide further as the stage crosses the screen.
    const travel = MathUtils.clamp(fit.screenY, -1, 1)
    panes.current.forEach((pane, i) => {
      if (pane) pane.position.x = origin.x + STEP.x * i + travel * TRUCK * i
    })
  })

  return (
    <group ref={group} visible={false} userData={{ layer: layer.id }}>
      {PAGES.map((page, i) => (
        <mesh
          key={page.slug}
          ref={(m) => {
            panes.current[i] = m
          }}
          position={[origin.x + STEP.x * i, origin.y + STEP.y * i, STEP.z * i]}
        >
          <planeGeometry args={[PANE_W, PANE_H]} />
          {/* Pages further back are dimmer, as if seen through the panes in front. */}
          <meshBasicMaterial
            map={textures[i]}
            toneMapped={false}
            color={[1 - i * 0.11, 1 - i * 0.11, 1 - i * 0.11]}
          />
          {/* Window frame: a slightly larger dark plane just behind the page. */}
          <mesh position={[0, 0, -0.004]}>
            <planeGeometry args={[PANE_W + 0.04, PANE_H + 0.04]} />
            <meshBasicMaterial color={PALETTE.slate} />
          </mesh>
        </mesh>
      ))}
      {glass && (
        // A sheet of glass over the front page: the page reads through it
        // unchanged while its surface catches the studio light as the stack turns.
        <mesh position={[origin.x, origin.y, 0.035]}>
          <planeGeometry args={[PANE_W + 0.06, PANE_H + 0.06]} />
          <meshPhysicalMaterial
            transmission={1}
            thickness={0}
            ior={1.45}
            roughness={0}
            metalness={0}
            clearcoat={1}
            clearcoatRoughness={0.03}
            envMapIntensity={1.6}
          />
        </mesh>
      )}
    </group>
  )
}
