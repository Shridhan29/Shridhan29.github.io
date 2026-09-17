import { RoundedBox, useTexture } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  Color,
  type Group,
  MathUtils,
  type PerspectiveCamera,
  Shape,
  ShaderMaterial,
  ShapeGeometry,
  SRGBColorSpace,
  Vector3,
} from 'three'
import type { Layer } from '../layers'
import { PALETTE } from '../palette'
import { fitToStage } from '../stage'
import { useLayerFrame } from '../useLayerFrame'

/**
 * L1 · Device — TRUUNA, the app live on Google Play.
 *
 * One phone, drawn into the stage the TRUUNA article reserves on desktop, in
 * place of the row of screenshots (they stay in the page for screen readers,
 * and for phones, tablets and the Static tier). Black glass like the monolith,
 * so the edges catch the same studio light, around a screen that glows with a
 * real screen from the app.
 *
 * Phase 4.3 makes the screen advance through the app flow as the page scrolls.
 */

/** The first screen a farmer sees: language choice. The rest arrive in 4.3. */
const SCREEN = '/img/truuna/01-language-840.webp'

// Screen is the screenshots' 9:16; the body adds even, slim bezels — no chin,
// like a current phone — and is thin enough to read as one at an angle.
const SCREEN_W = 0.7
const SCREEN_H = SCREEN_W * (16 / 9)
const BEZEL = 0.032
const BODY: [number, number, number] = [SCREEN_W + 2 * BEZEL, SCREEN_H + 2 * BEZEL, 0.055]

/** How far in front of the camera the phone sits, in world units. */
const DISTANCE = 5
/** Share of the stage's height the phone fills. */
const FILL = 0.86

export function Device({ layer, index }: { layer: Layer; index: number }) {
  const group = useRef<Group>(null)
  const stage = useRef<Element | null>(null)
  const target = useMemo(() => new Vector3(), [])
  const size = useThree((s) => s.size)

  useEffect(() => {
    stage.current = document.querySelector('[data-stage="device"]')
  }, [])

  useLayerFrame(index, group, (state) => {
    const g = group.current!
    const el = stage.current
    const camera = state.camera as PerspectiveCamera
    const fit = el ? fitToStage(el, camera, size, DISTANCE, target) : null

    // No stage on this layout (below lg, or the Static tier never renders one).
    g.visible = !!fit?.visible
    if (!fit?.visible) return

    g.position.copy(target)
    g.quaternion.copy(camera.quaternion)
    g.scale.setScalar((fit.height * FILL) / BODY[1])

    // A three-quarter turn that breathes, and a tilt that follows the stage up
    // the screen, so the phone reads as an object in space, not a sticker.
    const t = state.clock.elapsedTime
    g.rotateY(-0.38 + Math.sin(t * 0.35) * 0.06)
    g.rotateX(MathUtils.clamp(fit.screenY, -1, 1) * -0.12)
  })

  return (
    <group ref={group} visible={false} userData={{ layer: layer.id }}>
      <RoundedBox args={BODY} radius={0.026} smoothness={4}>
        <meshPhysicalMaterial
          color={PALETTE.ink}
          metalness={0}
          roughness={0.25}
          clearcoat={1}
          clearcoatRoughness={0.05}
          envMapIntensity={2.5}
        />
      </RoundedBox>
      <Screen />
      <Glow color={layer.color} />
    </group>
  )
}

function Screen() {
  const gl = useThree((s) => s.gl)
  const texture = useTexture(SCREEN, (t) => {
    t.colorSpace = SRGBColorSpace
    // The phone is seen at an angle; without this the text on screen smears.
    t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
  })

  // Rounded corners like a real display, with UVs spanning the screenshot.
  const geometry = useMemo(() => {
    const r = 0.045
    const [w, h] = [SCREEN_W, SCREEN_H]
    const [x, y] = [-w / 2, -h / 2]
    const shape = new Shape()
      .moveTo(x + r, y)
      .lineTo(x + w - r, y)
      .quadraticCurveTo(x + w, y, x + w, y + r)
      .lineTo(x + w, y + h - r)
      .quadraticCurveTo(x + w, y + h, x + w - r, y + h)
      .lineTo(x + r, y + h)
      .quadraticCurveTo(x, y + h, x, y + h - r)
      .lineTo(x, y + r)
      .quadraticCurveTo(x, y, x + r, y)
    const g = new ShapeGeometry(shape, 6)
    const pos = g.attributes.position
    const uv = g.attributes.uv
    for (let i = 0; i < pos.count; i++) {
      uv.setXY(i, (pos.getX(i) - x) / w, (pos.getY(i) - y) / h)
    }
    return g
  }, [])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    // Just proud of the glass, and unlit: a screen emits, it is not lit.
    <mesh geometry={geometry} position={[0, 0, BODY[2] / 2 + 0.002]}>
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}

/**
 * Light from the screen falling on the dark around it: a soft halo behind the
 * phone in the layer's colour. One additive quad, so it costs a draw call and
 * no lighting work.
 */
function Glow({ color }: { color: string }) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uColor: { value: new Color(color) }, uStrength: { value: 0.32 } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uStrength;
          varying vec2 vUv;
          void main() {
            // Elliptical falloff, taller than wide like the screen it comes from.
            vec2 p = (vUv - 0.5) * vec2(1.0, 0.72) * 2.0;
            float a = pow(max(0.0, 1.0 - length(p)), 2.2) * uStrength;
            gl_FragColor = vec4(uColor * a, a);
          }
        `,
      }),
    [color],
  )
  useEffect(() => () => material.dispose(), [material])

  return (
    <mesh position={[0, 0, -0.25]} material={material}>
      <planeGeometry args={[BODY[0] * 3.2, BODY[1] * 2.2]} />
    </mesh>
  )
}
