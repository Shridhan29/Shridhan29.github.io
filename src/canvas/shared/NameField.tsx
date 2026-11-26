import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  MathUtils,
  PerspectiveCamera,
  Plane,
  type Points,
  Ray,
  ShaderMaterial,
  Vector3,
} from 'three'
import { CAMERA_CURVE, LOOK_CURVE } from '../curve'
import type { Layer } from '../layers'
import { PALETTE } from '../palette'
import { useScrollStore } from '@/store/useScrollStore'

/**
 * The particle system (4.1) and L0's name dispersal (4.2).
 *
 * One `Points` buffer for the life of the page — one draw call on every tier,
 * only its size changes. Each particle carries two positions: a target, where
 * it sits in the formed name, and a scatter, out in the starfield's shell. The
 * vertex shader interpolates between them on `uMorph`, staggered per particle,
 * so the morph costs no per-frame CPU work however many particles there are.
 *
 * The name is sampled at runtime from a 2D canvas, set in the page's own
 * heading font, rather than baked to a file at build time: the only formation
 * is text, and sampling it here costs 0 KB where a baked buffer for 60k
 * particles would be ~240 KB even quantised. It also stays right if the font
 * or the name in `src/data/profile.ts` changes.
 *
 * Placed from measured layout, like the monolith, never under text. The hero
 * reserves a fixed-height band for it (`[data-name-band]`) so its size does not
 * depend on how the headline wraps: with a wider fallback font the free space
 * above the copy shrank below the minimum and the name vanished. Without that
 * band (it is hidden on narrow screens) the name falls back to the free space
 * between the header and the copy. Where there is too little room for legible
 * letters, nothing is drawn.
 */

/** Below this the letters stop reading as letters. */
const MIN_BAND_PX = 56
/** Letter height cap, so tall screens do not get a billboard. */
const MAX_TEXT_PX = 110

/** Scroll, as a share of the viewport height, over which the name fully disperses. */
const DISPERSE_OVER = 0.55

export function NameField({ text, count, layer }: { text: string; count: number; layer: Layer }) {
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)
  const points = useRef<Points>(null)
  /** False until the name has been placed, and whenever there is no room for it. */
  const placed = useRef(false)
  const published = useRef(-1)
  const setEffect = useScrollStore((s) => s.setEffect)

  const geometry = useMemo(() => {
    const g = new BufferGeometry()
    const random = mulberry32(0x9a3e)
    const target = new Float32Array(count * 3)
    const scatter = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      // Scatter over the starfield's shell, so the name dissolves into the sky.
      const u = random() * 2 - 1
      const theta = random() * Math.PI * 2
      const r = 14 + random() * 30
      const s = Math.sqrt(1 - u * u)
      scatter.set([r * s * Math.cos(theta), r * u, r * s * Math.sin(theta)], i * 3)
      seed[i] = random()
    }
    // `position` is the target; three needs it for the bounding sphere anyway.
    g.setAttribute('position', new BufferAttribute(target, 3))
    g.setAttribute('aScatter', new BufferAttribute(scatter, 3))
    g.setAttribute('aSeed', new BufferAttribute(seed, 1))
    return g
  }, [count])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uMorph: { value: 0 },
          uTime: { value: 0 },
          uDpr: { value: dpr },
          uPointPx: { value: 2 },
          // Denser tiers draw more particles into the same strokes; scale each
          // one down so every tier lands at the same overall brightness.
          // Lifted from 0.75 at 1.6 px: at 60 000 particles that left each one so faint
          // the name read as grain rather than letters.
          uOpacity: { value: 0.95 * Math.sqrt(8000 / count) },
          uColor: { value: new Color(PALETTE.bone) },
          uAccent: { value: new Color(PALETTE.accent) },
        },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        vertexShader: /* glsl */ `
          attribute vec3 aScatter;
          attribute float aSeed;
          uniform float uMorph;
          uniform float uTime;
          uniform float uDpr;
          uniform float uPointPx;
          varying float vFade;
          varying float vSeed;
          void main() {
            // Staggered: some particles leave first, so the name frays
            // rather than exploding all at once.
            float t = clamp(uMorph * 1.6 - aSeed * 0.6, 0.0, 1.0);
            t = t * t * (3.0 - 2.0 * t);
            // A slight shimmer while formed, gone once the particle is in flight.
            vec3 shimmer = vec3(
              sin(uTime * 1.3 + aSeed * 40.0),
              cos(uTime * 1.1 + aSeed * 31.0),
              0.0
            ) * 0.006 * (1.0 - t);
            vec3 p = mix(position, aScatter, t) + shimmer;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = uPointPx * uDpr * mix(1.0, 1.8, t);
            vFade = 1.0 - t;
            vSeed = aSeed;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform vec3 uAccent;
          uniform float uOpacity;
          varying float vFade;
          varying float vSeed;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.15, d) * vFade * uOpacity;
            // One in eight faintly blue, like the stars it becomes.
            vec3 c = vSeed > 0.875 ? uAccent : uColor;
            gl_FragColor = vec4(c * a, a);
          }
        `,
      }),
    [dpr, count],
  )

  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])

  // Driven by the page's own scroll rather than camera progress: the name
  // belongs to the hero, and should be gone by the time the hero is.
  useFrame((state) => {
    const p = points.current
    if (!p) return
    const morph = MathUtils.clamp(window.scrollY / (window.innerHeight * DISPERSE_OVER), 0, 1)
    material.uniforms.uMorph.value = morph
    material.uniforms.uTime.value = state.clock.elapsedTime
    // Fully dispersed particles are invisible; skip the draw call entirely.
    p.visible = placed.current && morph < 0.999
    const percent = placed.current ? Math.round(morph * 100) : -1
    if (percent !== published.current) {
      published.current = percent
      setEffect('nameMorph', percent)
      setEffect('nameParticles', placed.current ? count : 0)
    }
  })

  // Measure the band and sample the name into it.
  useEffect(() => {
    const header = document.querySelector('header')
    const copy = document.querySelector<HTMLElement>('[data-hero-copy]')
    const heading = copy?.querySelector('h1')
    if (!copy || !heading) return

    const reserved = document.querySelector<HTMLElement>('[data-name-band]')

    const place = () => {
      const scrollY = window.scrollY
      const below = (header?.getBoundingClientRect().bottom ?? 0) + scrollY + 12
      const block = copy.getBoundingClientRect()
      const slot = reserved?.getBoundingClientRect()
      const [top, bottom] =
        slot && slot.height > 0
          ? [Math.max(below, slot.top + scrollY), slot.bottom + scrollY]
          : [below, block.top + scrollY - 20]
      const band = bottom - top
      if (band < MIN_BAND_PX) {
        placed.current = false
        return
      }

      // Never larger than the headline: the name is texture, the headline is the message.
      const headlinePx = parseFloat(getComputedStyle(heading).fontSize) || MAX_TEXT_PX
      const textPx = Math.min(MAX_TEXT_PX, band * 0.7, headlinePx * 0.9)
      const font = `700 ${textPx}px ${getComputedStyle(heading).fontFamily}`
      const sampled = sampleText(text, font, textPx, block.width, count)
      if (!sampled) return

      // Project through the camera exactly as it stands at the top of the page
      // (journey start), onto the plane through the layer's anchor. A flat
      // px-to-world scale ignores the camera's tilt and put the name ~15% off.
      const camera = new PerspectiveCamera(layer.fov, size.width / size.height, 0.1, 200)
      camera.position.copy(CAMERA_CURVE.getPoint(0))
      camera.lookAt(LOOK_CURVE.getPoint(0))
      camera.updateMatrixWorld()
      const anchor = new Vector3(...layer.anchor)
      const plane = new Plane(new Vector3(0, 0, 1), -anchor.z)
      const ray = new Ray()
      const hit = new Vector3()
      const left = block.left
      const centreY = top + band / 2

      const target = geometry.getAttribute('position') as BufferAttribute
      const random = mulberry32(0x1d)
      for (let i = 0; i < count; i++) {
        // Page px at scroll 0 → normalised device coordinates → world.
        const ndcX = ((left + sampled.x[i]) / size.width) * 2 - 1
        const ndcY = 1 - ((centreY + sampled.y[i]) / size.height) * 2
        ray.origin.copy(camera.position)
        ray.direction.set(ndcX, ndcY, 0.5).unproject(camera).sub(camera.position).normalize()
        if (!ray.intersectPlane(plane, hit)) continue
        hit.sub(anchor)
        target.setXYZ(i, hit.x, hit.y, hit.z + (random() - 0.5) * 0.04)
      }
      target.needsUpdate = true
      geometry.computeBoundingSphere()
      placed.current = true
      published.current = -2
    }

    // The heading font may still be loading; sample once it is ready.
    let cancelled = false
    document.fonts.ready.then(() => !cancelled && place())
    const observer = new ResizeObserver(place)
    observer.observe(copy)
    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [text, count, layer, size.width, size.height, geometry])

  return (
    <points
      ref={points}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      visible={false}
    />
  )
}

/**
 * Rasterises `text` and returns `count` points inside its glyphs, in CSS px
 * relative to the text's left edge and vertical centre. Each point is a random
 * covered pixel plus sub-pixel jitter, so dense tiers read as solid strokes and
 * sparse ones as a fine grain, never as a visible grid.
 */
function sampleText(text: string, font: string, textPx: number, maxWidth: number, count: number) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.font = font
  let width = Math.ceil(ctx.measureText(text).width)
  let scale = 1
  if (width > maxWidth) {
    scale = maxWidth / width
    width = Math.floor(maxWidth)
  }
  const height = Math.ceil(textPx * 1.3)
  canvas.width = width
  canvas.height = height
  ctx.font = font
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'
  ctx.setTransform(scale, 0, 0, scale, 0, height / 2)
  ctx.fillText(text, 0, 0)

  const data = ctx.getImageData(0, 0, width, height).data
  const covered: number[] = []
  for (let i = 3; i < data.length; i += 4) if (data[i] > 128) covered.push((i - 3) / 4)
  if (!covered.length) return null

  const random = mulberry32(0x7e57)
  const x = new Float32Array(count)
  const y = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const pixel = covered[Math.floor(random() * covered.length)]
    x[i] = (pixel % width) + random()
    y[i] = Math.floor(pixel / width) + random() - height / 2
  }
  return { x, y }
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
