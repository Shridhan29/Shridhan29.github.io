import { useTexture } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  CatmullRomCurve3,
  type Group,
  type Mesh,
  MathUtils,
  MeshBasicMaterial,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
} from 'three'
import type { Layer } from '../layers'
import { PALETTE } from '../palette'
import { useStagedFrame } from '../useStagedFrame'
import { useScrollStore } from '@/store/useScrollStore'

/**
 * L2 · Surface — aashman.in, the company's React site.
 *
 * Six pages of the site as layered panes, cascading back in depth like browser
 * windows, drawn into the stage the aashman.in article reserves on desktop in
 * place of its screenshot grid. The camera language here is a lateral truck:
 * as the stage scrolls, each pane slides sideways at a speed set by its depth,
 * so the stack separates the way windows would past a moving camera.
 *
 * Ribbons weave between the panes and draw themselves as the stage crosses the
 * screen (4.4) — the routes threading the site's pages together. Real glass
 * (transmission) renders the scene a second time per frame and the plan marks it
 * High tier only, so it waits for the quality tiers in 6.1.
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

// Extent of everything drawn — panes and ribbons — measured from the layout
// itself, so the stack always fits its stage however the ribbons are routed.
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

/**
 * Three ribbons, each weaving front to back through the stack: the routes
 * threading the site's pages together. Their offsets carry them clear of the
 * pane silhouettes — inside them they would simply be hidden, the panes being
 * opaque — so they read as lines arcing over, under and around the stack.
 */
const RIBBONS = [
  { offset: [0.1, 0.72], sway: 0.22 },
  { offset: [-0.2, -0.74], sway: -0.18 },
  { offset: [1.18, -0.1], sway: 0.3 },
]
const RIBBON_RADIUS = 0.016

/** Where a ribbon passes the pane at `i`, in the group's own space. */
const ribbonPoint = (ribbon: (typeof RIBBONS)[number], i: number, origin: Origin) =>
  new Vector3(
    origin.x + STEP.x * i + ribbon.offset[0] + Math.sin(i * 1.7) * ribbon.sway,
    origin.y + STEP.y * i + ribbon.offset[1] + Math.cos(i * 1.3) * ribbon.sway,
    // Weaves in front of one pane and behind the next.
    STEP.z * i + (i % 2 ? 0.12 : -0.12),
  )

type Origin = { x: number; y: number }

const EXTENT = (() => {
  let [w, h] = [0, 0]
  PAGES.forEach((_, i) => {
    // A pane, plus how far the truck can carry it sideways.
    w = Math.max(w, Math.abs(CENTRED.x + STEP.x * i) + PANE_W / 2 + TRUCK_REACH)
    h = Math.max(h, Math.abs(CENTRED.y + STEP.y * i) + PANE_H / 2)
    for (const ribbon of RIBBONS) {
      const p = ribbonPoint(ribbon, i, CENTRED)
      w = Math.max(w, Math.abs(p.x) + RIBBON_RADIUS)
      h = Math.max(h, Math.abs(p.y) + RIBBON_RADIUS)
    }
  })
  return { width: w * 2, height: h * 2 }
})()

export function Surface({ layer, index }: { layer: Layer; index: number }) {
  const group = useRef<Group>(null)
  const panes = useRef<(Mesh | null)[]>([])
  const ribbons = useRef<(Mesh | null)[]>([])
  const drawn = useRef(-1)
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

    // The ribbons draw themselves as the stage rises: each is revealed along its
    // length by moving the end of what is drawn, which costs nothing per frame.
    const progress = (travel + 1) / 2
    ribbons.current.forEach((ribbon) => {
      if (!ribbon) return
      const total = ribbon.geometry.index?.count ?? 0
      ribbon.geometry.setDrawRange(0, Math.ceil(total * progress))
    })
    const percent = Math.round(progress * 100)
    if (percent !== drawn.current) {
      drawn.current = percent
      setEffect('ribbons', percent)
    }
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
      {RIBBONS.map((ribbon, i) => (
        <Ribbon
          key={i}
          ribbon={ribbon}
          origin={origin}
          color={layer.color}
          meshRef={(m) => {
            ribbons.current[i] = m
          }}
        />
      ))}
    </group>
  )
}

/** One ribbon: a tube through the stack, drawn from its start as the stage rises. */
function Ribbon({
  ribbon,
  origin,
  color,
  meshRef,
}: {
  ribbon: (typeof RIBBONS)[number]
  origin: Origin
  color: string
  meshRef: (mesh: Mesh | null) => void
}) {
  const geometry = useMemo(() => {
    const points = PAGES.map((_, i) => ribbonPoint(ribbon, i, origin))
    return new TubeGeometry(new CatmullRomCurve3(points), 96, RIBBON_RADIUS, 6)
  }, [ribbon, origin])

  const material = useMemo(
    () => new MeshBasicMaterial({ color, toneMapped: false, transparent: true, opacity: 0.75 }),
    [color],
  )

  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])

  return <mesh ref={meshRef} geometry={geometry} material={material} />
}
