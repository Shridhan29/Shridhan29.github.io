import { RoundedBox } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { type RefObject, useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  type Group,
  MathUtils,
  ShaderMaterial,
} from 'three'
import type { Layer } from '../layers'
import { PALETTE } from '../palette'
import { useLayerFrame } from '../useLayerFrame'

/**
 * L0 · Orbit — the hero.
 *
 * One object and a sky. The monolith is near-black glass that reads almost
 * entirely through thin rim highlights from the studio lighting, so it stays
 * dark behind the page and never competes with the headline. It is kept out
 * from behind the copy by measuring the page: it stands in the real gap between
 * the headline and the portrait, sized to the copy block. Where that gap is too
 * narrow (tablets, phones) it is not shown at all — anywhere else on screen it
 * would sit behind text.
 *
 * Its proportions are 1:4:9.
 */

const UNIT = 0.25
const MONOLITH: [number, number, number] = [4 * UNIT, 9 * UNIT, 1 * UNIT]

/** Placement the monolith eases toward, in the layer's local space. */
type Placement = { x: number; y: number; scale: number }

const HIDDEN: Placement = { x: 0, y: 0, scale: 0 }

/** Below this gap, in CSS px, there is no room to stand between copy and portrait. */
const MIN_GAP_PX = 140

export function Orbit({ layer, index }: { layer: Layer; index: number }) {
  const group = useRef<Group>(null)
  const monolith = useRef<Group>(null)
  const rim = useRef<ShaderMaterial>(null)
  const target = useRef<Placement>(HIDDEN)
  const size = useThree((s) => s.size)

  // Measure the hero, not a hard-coded breakpoint: the gap moves with the fluid
  // shell and the font, and this stays right at every width.
  useEffect(() => {
    const copy = document.querySelector<HTMLElement>('[data-hero-copy]')
    const portrait = document.querySelector<HTMLElement>('[data-hero-portrait]')
    if (!copy || !portrait) return

    const measure = () => {
      // Page coordinates, not viewport ones: the placement is for the top of the
      // page, where this layer is seen, even if the reload lands mid-scroll.
      const scrollY = window.scrollY
      // The copy column is wider than its text, so measure the glyphs.
      const range = document.createRange()
      let right = 0
      for (const el of copy.querySelectorAll('h1, p, a')) {
        range.selectNodeContents(el)
        right = Math.max(right, range.getBoundingClientRect().right)
      }
      const block = copy.getBoundingClientRect()
      const left = portrait.getBoundingClientRect().left
      const gap = left - right

      if (gap < MIN_GAP_PX) {
        target.current = HIDDEN
        return
      }

      // World units per CSS px at the monolith's distance, seen from this layer's
      // own camera.
      const distance = Math.hypot(...layer.camera.map((c, i) => c - layer.anchor[i]))
      const halfHeight = Math.tan(MathUtils.degToRad(layer.fov / 2)) * distance
      const pxToWorld = (2 * halfHeight) / size.height

      // Take a little over half the gap's width, and no more height than the copy.
      const scale = Math.min(
        1.15,
        (gap * pxToWorld * 0.55) / MONOLITH[0],
        (block.height * pxToWorld * 0.95) / MONOLITH[1],
      )
      const centerY = block.top + scrollY + block.height / 2

      target.current = {
        x: ((right + left) / 2 - size.width / 2) * pxToWorld,
        y: (size.height / 2 - centerY) * pxToWorld,
        scale,
      }
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(copy)
    observer.observe(portrait)
    return () => observer.disconnect()
  }, [layer, size.width, size.height])

  useLayerFrame(index, group, (state, delta) => {
    const m = monolith.current!
    const t = target.current
    const time = state.clock.elapsedTime
    m.position.x = MathUtils.damp(m.position.x, t.x, 3, delta)
    m.position.y = MathUtils.damp(m.position.y, t.y, 3, delta)
    m.scale.setScalar(MathUtils.damp(m.scale.x, t.scale, 3, delta))
    // Not drawn at all when there is no room for it.
    m.visible = m.scale.x > 0.01
    // A slow swing rather than a full turn: every angle in this range catches
    // the rim light, so the slab never goes edge-on or reads as a flat hole.
    m.rotation.y = -0.55 + Math.sin(time * 0.18) * 0.4
    // The rim's hue drifts with the same clock as the swing.
    if (rim.current) rim.current.uniforms.uTime.value = time
  })

  return (
    <group ref={group} position={layer.anchor}>
      <group ref={monolith} scale={0}>
        <RoundedBox args={MONOLITH} radius={0.035} smoothness={3}>
          <meshPhysicalMaterial
            // Black glass, not metal: a metal tints its reflections by its base
            // colour, which at near-black leaves no highlights at all. A dielectric
            // reflects little face-on and strongly at grazing angles — dark faces,
            // bright edges.
            color={PALETTE.ink}
            metalness={0}
            roughness={0.2}
            clearcoat={1}
            clearcoatRoughness={0.04}
            envMapIntensity={2.5}
            // A thin film over the glass, for the colour it lends the few
            // reflections the slab catches.
            iridescence={0.8}
            iridescenceIOR={1.35}
            iridescenceThicknessRange={[100, 700]}
          />
        </RoundedBox>
        <Rim materialRef={rim} />
      </group>
      <Stars />
    </group>
  )
}

// -------------------------------------------------------------------- rim --

/**
 * The monolith's signature effect (4.2): an iridescent fresnel rim.
 *
 * A shell just outside the slab, lit only where its surface turns away from the
 * viewer, so it draws the silhouette and leaves the faces black — the page
 * behind stays as dark as it was. The hue walks with the angle and drifts with
 * time, which is where the iridescence reads; the physical film alone was
 * invisible in a scene this dim. One additive draw call, no lighting work.
 */
function Rim({ materialRef }: { materialRef: RefObject<ShaderMaterial | null> }) {
  const shader = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uNear: { value: new Color(PALETTE.accent) },
          uFar: { value: new Color('#b98cff') },
        },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        vertexShader: /* glsl */ `
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
            vec4 world = modelMatrix * vec4(position, 1.0);
            vNormal = normalize(mat3(modelMatrix) * normal);
            vView = normalize(cameraPosition - world.xyz);
            gl_Position = projectionMatrix * viewMatrix * world;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform vec3 uNear;
          uniform vec3 uFar;
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
            float facing = clamp(dot(normalize(vNormal), normalize(vView)), 0.0, 1.0);
            // Edge-on surfaces glow; surfaces facing the viewer stay dark.
            float rim = pow(1.0 - facing, 4.0);
            // Hue walks with the angle and drifts slowly: a thin-film sheen.
            float shift = 0.5 + 0.5 * sin(facing * 6.2831 + uTime * 0.35);
            vec3 colour = mix(uNear, uFar, shift);
            gl_FragColor = vec4(colour * rim * 1.6, rim);
          }
        `,
      }),
    [],
  )

  useEffect(() => () => shader.dispose(), [shader])

  return (
    <RoundedBox args={MONOLITH} radius={0.035} smoothness={3} scale={1.006}>
      <primitive object={shader} ref={materialRef} attach="material" />
    </RoundedBox>
  )
}

// ------------------------------------------------------------------ stars --

const STAR_COUNT = 1400

/** Deterministic, so every load — and every screenshot test — gets the same sky. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A single draw call: every star is a point in one buffer. */
function Stars() {
  const dpr = useThree((s) => s.viewport.dpr)

  const geometry = useMemo(() => {
    const random = mulberry32(0x5eed)
    const positions = new Float32Array(STAR_COUNT * 3)
    const sizes = new Float32Array(STAR_COUNT)
    const colors = new Float32Array(STAR_COUNT * 3)
    const bone = new Color(PALETTE.bone)
    const accent = new Color(PALETTE.accent)

    for (let i = 0; i < STAR_COUNT; i++) {
      // Uniform over a thick shell, well clear of the monolith and the camera.
      const u = random() * 2 - 1
      const theta = random() * Math.PI * 2
      const r = 22 + random() * 38
      const s = Math.sqrt(1 - u * u)
      positions.set([r * s * Math.cos(theta), r * u, r * s * Math.sin(theta)], i * 3)
      // Mostly faint; a few brighter; one in eight faintly blue.
      sizes[i] = random() < 0.06 ? 2.2 + random() : 0.8 + random() * 0.9
      const c = random() < 0.125 ? accent : bone
      colors.set([c.r, c.g, c.b], i * 3)
    }

    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(positions, 3))
    g.setAttribute('size', new BufferAttribute(sizes, 1))
    g.setAttribute('color', new BufferAttribute(colors, 3))
    return g
  }, [])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uDpr: { value: dpr }, uOpacity: { value: 0.55 } },
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        vertexShader: /* glsl */ `
          attribute float size;
          uniform float uDpr;
          varying vec3 vColor;
          void main() {
            vColor = color;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * uDpr;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uOpacity;
          varying vec3 vColor;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.1, d) * uOpacity;
            gl_FragColor = vec4(vColor * a, a);
          }
        `,
      }),
    [dpr],
  )

  // Separate lifetimes: a DPR change rebuilds the material, not the geometry.
  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])

  return <points geometry={geometry} material={material} frustumCulled={false} />
}
