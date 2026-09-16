import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import {
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
} from 'three'
import { PALETTE } from './palette'

/**
 * Image-based lighting with no image (decision D9).
 *
 * A handful of emissive panels — a studio's softboxes and strip lights — are
 * rendered once into a prefiltered environment map. Reflective materials pick
 * up clean highlights from them, which is most of what an HDRI buys, for 0 KB
 * of download: a 1k HDRI is 1.3–1.6 MB, eight times the lighting budget.
 */
const PANELS: {
  size: [number, number]
  color: string
  intensity: number
  /** Every panel faces the layer origin, like a light stand aimed at the subject. */
  position: [number, number, number]
}[] = [
  // Key: a wide softbox above and in front, so top faces and bevels catch light.
  { size: [10, 2.5], color: PALETTE.bone, intensity: 3.3, position: [0, 6, 5] },
  // Fill: a large, dim panel behind the camera. Front faces reflect it as a soft
  // gradient instead of reading as a flat black cut-out.
  { size: [14, 7], color: PALETTE.mist, intensity: 0.5, position: [0, 2, 10] },
  // Rims: strips behind the subject, left in the accent blue and right in cool
  // white, which the edges reflect as thin lines as the slab turns.
  { size: [1.4, 12], color: PALETTE.accent, intensity: 10, position: [-4.5, 0, -6] },
  { size: [0.9, 12], color: '#c9d4ff', intensity: 5, position: [4.5, 1, -7] },
]

export function Lighting() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)

  useEffect(() => {
    const studio = new Scene()
    studio.background = new Color(PALETTE.void)
    const geometries: PlaneGeometry[] = []
    const materials: MeshBasicMaterial[] = []

    for (const p of PANELS) {
      const geometry = new PlaneGeometry(...p.size)
      // Components above 1 survive: PMREM renders into a half-float target.
      const material = new MeshBasicMaterial({
        color: new Color(p.color).multiplyScalar(p.intensity),
        side: DoubleSide,
      })
      const panel = new Mesh(geometry, material)
      panel.position.set(...p.position)
      panel.lookAt(0, 0, 0)
      studio.add(panel)
      geometries.push(geometry)
      materials.push(material)
    }

    const pmrem = new PMREMGenerator(gl)
    // 64 px, no pre-blur. At the default 256 px with a blur pass this took 6–15 s
    // to the first frame under software GL (1.2 s without it); at 64 px it adds
    // ~0.3 s. The material's roughness blurs the highlights more than the lower
    // resolution does, so the difference does not show.
    const target = pmrem.fromScene(studio, 0, 0.1, 20, { size: 64 })
    scene.environment = target.texture

    return () => {
      scene.environment = null
      target.dispose()
      pmrem.dispose()
      geometries.forEach((g) => g.dispose())
      materials.forEach((m) => m.dispose())
    }
  }, [gl, scene])

  return null
}
