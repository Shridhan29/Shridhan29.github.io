import { useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { type RefObject, useEffect, useMemo, useRef } from 'react'
import { MathUtils, ShaderMaterial, SRGBColorSpace, type Texture } from 'three'
import { roundedScreen } from './roundedScreen'
import { useScrollStore } from '@/store/useScrollStore'

/**
 * A display that advances through a sequence of real screenshots.
 *
 * `progress` (0 → 1, read every frame) walks the sequence: each screen holds,
 * then cross-fades into the next, so scrolling past the device plays the app's
 * flow rather than smearing the screens together. Two samplers and a mix — no
 * per-screen meshes, one draw call however many screens there are.
 */
export function ScreenSequence({
  urls,
  width,
  height,
  radius = 0.04,
  position = [0, 0, 0],
  progress,
}: {
  urls: string[]
  width: number
  height: number
  radius?: number
  position?: [number, number, number]
  progress: RefObject<number>
}) {
  const gl = useThree((s) => s.gl)
  const setScreen = useScrollStore((s) => s.setScreen)
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

  useFrame(() => {
    const steps = textures.length - 1
    const walked = MathUtils.clamp(progress.current ?? 0, 0, 1) * steps
    const index = Math.min(steps - 1, Math.floor(walked))
    material.uniforms.uFrom.value = textures[index]
    material.uniforms.uTo.value = textures[index + 1]
    // Hold, then flip: the fade happens in the middle third of each step.
    const mix = MathUtils.smoothstep(walked - index, 0.35, 0.65)
    material.uniforms.uMix.value = mix

    // Publish the screen in view, on change only — a store write per frame would
    // re-render the overlay sixty times a second.
    const current = mix > 0.5 ? index + 1 : index
    if (current !== shown.current) {
      shown.current = current
      setScreen(current)
    }
  })

  return <mesh geometry={geometry} material={material} position={position} />
}
