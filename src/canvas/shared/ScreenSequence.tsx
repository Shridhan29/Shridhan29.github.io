import { useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { type RefObject, useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  Color,
  MathUtils,
  ShaderMaterial,
  SRGBColorSpace,
  type Texture,
} from 'three'
import { roundedScreen } from './roundedScreen'
import { useScrollStore } from '@/store/useScrollStore'

/**
 * A display that advances through a sequence of real screenshots.
 *
 * `progress` (0 → 1, read every frame) walks the sequence: each screen holds,
 * then cross-fades into the next, so scrolling past the device plays the app's
 * flow rather than smearing the screens together. Two samplers and a mix — no
 * per-screen meshes, one draw call however many screens there are.
 *
 * With `spill`, the screen's light falls on what surrounds it: a ring of
 * additive light just behind the display, fading out over `spill` world units,
 * coloured by the average colour of the screen in view and following the
 * cross-fade. One more draw call, and no real-time light.
 */
export function ScreenSequence({
  urls,
  width,
  height,
  radius = 0.04,
  position = [0, 0, 0],
  progress,
  effect = 'screen',
  spill = 0,
  spillStrength = 0.4,
}: {
  urls: string[]
  width: number
  height: number
  radius?: number
  position?: [number, number, number]
  progress: RefObject<number>
  /** Name this sequence publishes its current screen under. */
  effect?: string
  /** How far the screen's light spills past its edge, in world units; 0 for none. */
  spill?: number
  spillStrength?: number
}) {
  const gl = useThree((s) => s.gl)
  const setEffect = useScrollStore((s) => s.setEffect)
  const shown = useRef(-1)
  const textures = useTexture(urls, (loaded) => {
    for (const t of Array.isArray(loaded) ? loaded : [loaded]) {
      t.colorSpace = SRGBColorSpace
      // Seen at an angle; without this the text on screen smears.
      t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
    }
  }) as Texture[]

  const geometry = useMemo(() => roundedScreen(width, height, radius), [width, height, radius])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uFrom: { value: textures[0] },
          uTo: { value: textures[Math.min(1, textures.length - 1)] },
          uMix: { value: 0 },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform sampler2D uFrom;
          uniform sampler2D uTo;
          uniform float uMix;
          varying vec2 vUv;
          void main() {
            gl_FragColor = mix(texture2D(uFrom, vUv), texture2D(uTo, vUv), uMix);
          }
        `,
      }),
    [textures],
  )

  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])

  // Each screen's average colour, read once from the decoded image.
  const averages = useMemo(() => textures.map(averageColour), [textures])

  const spillMaterial = useMemo(
    () =>
      spill > 0
        ? new ShaderMaterial({
            uniforms: {
              uColor: { value: new Color() },
              uSize: { value: [width / 2, height / 2] },
              uRadius: { value: radius },
              uReach: { value: spill },
              uStrength: { value: spillStrength },
            },
            transparent: true,
            depthWrite: false,
            blending: AdditiveBlending,
            vertexShader: /* glsl */ `
              varying vec2 vPos;
              void main() {
                vPos = position.xy;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
            fragmentShader: /* glsl */ `
              uniform vec3 uColor;
              uniform vec2 uSize;
              uniform float uRadius;
              uniform float uReach;
              uniform float uStrength;
              varying vec2 vPos;
              void main() {
                // Distance outside the screen's rounded rectangle.
                vec2 q = abs(vPos) - uSize + uRadius;
                float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
                if (d < 0.0) discard;
                float a = pow(1.0 - clamp(d / uReach, 0.0, 1.0), 2.5) * uStrength;
                gl_FragColor = vec4(uColor * a, a);
              }
            `,
          })
        : null,
    [spill, spillStrength, width, height, radius],
  )
  useEffect(() => () => spillMaterial?.dispose(), [spillMaterial])

  useFrame(() => {
    const steps = textures.length - 1
    const walked = MathUtils.clamp(progress.current ?? 0, 0, 1) * steps
    const index = Math.min(steps - 1, Math.floor(walked))
    material.uniforms.uFrom.value = textures[index]
    material.uniforms.uTo.value = textures[index + 1]
    // Hold, then flip: the fade happens in the middle third of each step.
    const mix = MathUtils.smoothstep(walked - index, 0.35, 0.65)
    material.uniforms.uMix.value = mix
    if (spillMaterial) {
      ;(spillMaterial.uniforms.uColor.value as Color).lerpColors(
        averages[index],
        averages[index + 1],
        mix,
      )
    }

    // Publish the screen in view, on change only — a store write per frame would
    // re-render the overlay sixty times a second.
    const current = mix > 0.5 ? index + 1 : index
    if (current !== shown.current) {
      shown.current = current
      setEffect(effect, current)
    }
  })

  return (
    <>
      <mesh geometry={geometry} material={material} position={position} />
      {spillMaterial && (
        // Just behind the display, so it lights the glass around it and never the screen.
        <mesh material={spillMaterial} position={[position[0], position[1], position[2] - 0.001]}>
          <planeGeometry args={[width + spill * 2, height + spill * 2]} />
        </mesh>
      )}
    </>
  )
}

const sampler = typeof document === 'undefined' ? null : document.createElement('canvas')

/** Mean colour of a texture's image, in linear space, from an 8 × 8 downsample. */
function averageColour(texture: Texture): Color {
  const colour = new Color(0.5, 0.5, 0.5)
  const image = texture.image as CanvasImageSource | undefined
  const ctx = sampler?.getContext('2d', { willReadFrequently: true })
  if (!image || !ctx || !sampler) return colour
  sampler.width = sampler.height = 8
  try {
    ctx.drawImage(image, 0, 0, 8, 8)
    const data = ctx.getImageData(0, 0, 8, 8).data
    let [r, g, b] = [0, 0, 0]
    for (let i = 0; i < data.length; i += 4) {
      r += data[i]
      g += data[i + 1]
      b += data[i + 2]
    }
    const n = data.length / 4
    colour.setRGB(r / n / 255, g / n / 255, b / n / 255, SRGBColorSpace)
  } catch {
    // A tainted or undecoded image: keep the neutral fallback.
  }
  return colour
}
