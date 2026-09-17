import { useEffect, useMemo } from 'react'
import { AdditiveBlending, Color, ShaderMaterial } from 'three'

/**
 * Light falling on the dark around an object: a soft elliptical halo. One
 * additive quad, so it costs a draw call and no lighting work — no real-time
 * light is added, which would recompile every lit material when it mounts.
 */
export function Glow({
  color,
  width,
  height,
  strength = 0.32,
  position = [0, 0, -0.25],
}: {
  color: string
  width: number
  height: number
  strength?: number
  position?: [number, number, number]
}) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uColor: { value: new Color(color) }, uStrength: { value: strength } },
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
            vec2 p = (vUv - 0.5) * 2.0;
            float a = pow(max(0.0, 1.0 - length(p)), 2.2) * uStrength;
            gl_FragColor = vec4(uColor * a, a);
          }
        `,
      }),
    [color, strength],
  )
  useEffect(() => () => material.dispose(), [material])

  return (
    <mesh position={position} material={material}>
      <planeGeometry args={[width, height]} />
    </mesh>
  )
}
