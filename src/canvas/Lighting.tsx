import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import {
  Color,
  DoubleSide,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  type Texture,
  type WebGLRenderer,
  type WebGLRenderTarget,
} from 'three'
import { useScrollStore } from '@/store/useScrollStore'
import { type Mood, MOODS } from './moods'

/**
 * Image-based lighting with no image (decision D9).
 *
 * A handful of emissive panels — a studio's softboxes and strip lights — are
 * rendered into a prefiltered environment map. Reflective materials pick up
 * clean highlights from them, which is most of what an HDRI buys, for 0 KB of
 * download: a 1k HDRI is 1.3–1.6 MB, eight times the lighting budget.
 *
 * One studio per layer (4.9): the same panels in that layer's colours
 * (`moods.ts`), baked ahead of the camera (see below) and kept. Orbit's is the
 * scene's environment; the other layers' materials are pointed at their own by
 * `useLayerFrame`. Every map is 64 px, so swapping one for another changes a
 * uniform and never recompiles a shader.
 */
const PANELS: {
  size: [number, number]
  tone: keyof Omit<Mood, 'sky'>
  intensity: number
  /** Every panel faces the layer origin, like a light stand aimed at the subject. */
  position: [number, number, number]
}[] = [
  // Key: a wide softbox above and in front, so top faces and bevels catch light.
  { size: [10, 2.5], tone: 'key', intensity: 3.3, position: [0, 6, 5] },
  // Fill: a large, dim panel behind the camera. Front faces reflect it as a soft
  // gradient instead of reading as a flat black cut-out.
  { size: [14, 7], tone: 'fill', intensity: 0.5, position: [0, 2, 10] },
  // Rims: strips behind the subject, which the edges reflect as thin lines as
  // the subject turns.
  { size: [1.4, 12], tone: 'rim', intensity: 10, position: [-4.5, 0, -6] },
  { size: [0.9, 12], tone: 'rimSoft', intensity: 5, position: [4.5, 1, -7] },
]

const studios = new Map<number, WebGLRenderTarget>()

function bake(gl: WebGLRenderer, mood: Mood): WebGLRenderTarget {
  const studio = new Scene()
  studio.background = new Color('#05060a')
  const disposables: { dispose: () => void }[] = []
  for (const p of PANELS) {
    const geometry = new PlaneGeometry(...p.size)
    // Components above 1 survive: PMREM renders into a half-float target.
    const material = new MeshBasicMaterial({
      color: new Color(mood[p.tone]).multiplyScalar(p.intensity),
      side: DoubleSide,
    })
    const panel = new Mesh(geometry, material)
    panel.position.set(...p.position)
    panel.lookAt(0, 0, 0)
    studio.add(panel)
    disposables.push(geometry, material)
  }
  const pmrem = new PMREMGenerator(gl)
  // 64 px, no pre-blur. At the default 256 px with a blur pass this took 6–15 s
  // to the first frame under software GL (1.2 s without it); at 64 px it adds
  // ~0.3 s. The material's roughness blurs the highlights more than the lower
  // resolution does, so the difference does not show.
  const target = pmrem.fromScene(studio, 0, 0.1, 20, { size: 64 })
  pmrem.dispose()
  disposables.forEach((d) => d.dispose())
  return target
}

/** The layer's environment map, baked on first use. */
export function studioFor(gl: WebGLRenderer, index: number): Texture {
  let target = studios.get(index)
  if (!target) {
    target = bake(gl, MOODS[index] ?? MOODS[0])
    studios.set(index, target)
  }
  return target.texture
}

const SKIES = MOODS.map((m) => new Color(m.sky))
const sky = new Color()

export function Lighting() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const setEffect = useScrollStore((s) => s.setEffect)

  useEffect(() => {
    scene.environment = studioFor(gl, 0)
    // A colour background is a clear, not a draw call.
    scene.background = sky
    return () => {
      scene.environment = null
      scene.background = null
      studios.forEach((t) => t.dispose())
      studios.clear()
    }
  }, [gl, scene])

  // The sky holds the current layer's mood while its article is read, and eases
  // to the next one (about a second) when the camera hands over — blended in
  // linear colour through the layers in between, so there is never a cut.
  // Keyed to the active layer rather than raw progress: a stage sits part-way
  // between two layers' points, and raw progress would show a half-mix there.
  const mood = useRef(-1)
  useFrame((_, delta) => {
    const target = useScrollStore.getState().layer
    mood.current =
      mood.current < 0 ? target : MathUtils.damp(mood.current, target, 3, Math.min(delta, 0.25))
    if (Math.abs(mood.current - target) < 0.005) mood.current = target
    const from = Math.floor(mood.current)
    const to = Math.min(MOODS.length - 1, from + 1)
    sky.lerpColors(SKIES[from], SKIES[to], mood.current - from)
    setEffect('palette', Math.round(mood.current * 100) / 100)

    // Bake ahead: the studios of layers up to two steps away, at most one per
    // frame. A staged layer mounts one step away and compiles its shaders then;
    // baking its studio a step earlier keeps the two from landing in one frame.
    // Not before the first scroll: page load is busy enough, and a visitor who
    // never scrolls never needs a second studio.
    if (useScrollStore.getState().progress === 0) return
    for (const index of [target + 1, target - 1, target + 2, target - 2]) {
      if (index > 0 && index < MOODS.length && !studios.has(index)) {
        studioFor(gl, index)
        break
      }
    }
  })

  return null
}
