import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { AdditiveBlending, Color, ShaderMaterial } from 'three'

/**
 * Fog that drifts upward through a layer, faked as a few depth-staggered sheets
 * of animated noise. Each sheet is one additive quad: no raymarching, no depth
 * texture, so it costs a draw call per sheet and a little fill. Several sheets
 * at different depths and speeds slide past each other as the layer turns,
 * which is what makes flat noise read as volume.
 *
 * `sheets` is the tier knob: more sheets, more depth, more fill.
 */
export function Fog({
  color,
  width,
  height,
  sheets,
  strength = 0.4,
  depth = 1.2,
  position = [0, 0, 0],
}: {
  color: string
  width: number
  height: number
  sheets: number
  strength?: number
  /** Total depth the sheets are spread across, centred on `position`. */
  depth?: number
  position?: [number, number, number]
}) {
  const materials = useMemo(
    () =>
      Array.from(
        { length: sheets },
        (_, i) =>
          new ShaderMaterial({
            uniforms: {
              uTime: { value: 0 },
              // Each sheet gets its own seed, so no two sheets share a pattern.
              uSeed: { value: 3.7 + i * 5.13 },
              uColor: { value: new Color(color) },
              // Sheets add up, so each is fainter the more there are: more sheets
              // buy depth, not density.
              uStrength: { value: (strength * 1.6) / (sheets + 0.6) },
            },
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
          uniform float uTime;
          uniform vec3 uColor;
          uniform float uStrength;
          uniform float uSeed;
          varying vec2 vUv;

          float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float noise(vec2 p) {
            vec2 i = floor(p), f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
                       mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
          }
          float fbm(vec2 p) {
            float v = 0.0, a = 0.5;
            for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
            return v;
          }

          void main() {
            // Rising: the noise field scrolls upward, slower on deeper sheets.
            vec2 p = vUv * vec2(2.2, 3.0) + vec2(uSeed, -uTime * (0.05 + 0.02 * fract(uSeed)));
            float n = fbm(p + fbm(p + uTime * 0.03));
            // Soft edges on every side, so no sheet ever shows its rectangle.
            vec2 e = smoothstep(0.0, 0.3, vUv) * smoothstep(1.0, 0.7, vUv);
            float a = smoothstep(0.3, 0.75, n) * e.x * e.y * uStrength;
            gl_FragColor = vec4(uColor * a, a);
          }
        `,
          }),
      ),
    [color, strength, sheets],
  )
  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials])

  useFrame((state) => {
    for (const m of materials) m.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <group position={position}>
      {Array.from({ length: sheets }, (_, i) => {
        const z = sheets === 1 ? 0 : -depth / 2 + (depth * i) / (sheets - 1)
        return (
          <mesh key={i} position={[0, 0, z]} material={materials[i]} renderOrder={1}>
            <planeGeometry args={[width, height]} />
          </mesh>
        )
      })}
    </group>
  )
}
