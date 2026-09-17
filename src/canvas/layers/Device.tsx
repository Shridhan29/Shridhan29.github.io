import { RoundedBox } from '@react-three/drei'
import { useRef } from 'react'
import { type Group, MathUtils } from 'three'
import type { Layer } from '../layers'
import { PALETTE } from '../palette'
import { Glow } from '../shared/Glow'
import { ScreenPlane } from '../shared/ScreenPlane'
import { useStagedFrame } from '../useStagedFrame'

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

  useStagedFrame('device', index, group, DISTANCE, (fit, state) => {
    const g = group.current!
    g.scale.setScalar((fit.height * FILL) / BODY[1])
    // A three-quarter turn that breathes, and a tilt that follows the stage up
    // the screen, so the phone reads as an object in space, not a sticker.
    g.rotateY(-0.38 + Math.sin(state.clock.elapsedTime * 0.35) * 0.06)
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
      <ScreenPlane
        url={SCREEN}
        width={SCREEN_W}
        height={SCREEN_H}
        radius={0.045}
        // Just proud of the glass.
        position={[0, 0, BODY[2] / 2 + 0.002]}
      />
      <Glow color={layer.color} width={BODY[0] * 3.2} height={BODY[1] * 2.2} />
    </group>
  )
}
