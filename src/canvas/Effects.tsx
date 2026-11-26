import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useEffect } from 'react'
import { Vector2 } from 'three'
import { type QualityTier, useQualityStore } from '@/store/useQualityStore'
import { useScrollStore } from '@/store/useScrollStore'

/**
 * Post-processing (4.8), gated by quality tier (ARCHITECTURE §7).
 *
 *   high    bloom, vignette, a trace of chromatic aberration
 *   medium  bloom only
 *   low     no composer at all — the renderer draws straight to the screen
 *
 * Bloom is selective by brightness, not by object: the threshold sits at 1.0,
 * so nothing a screenshot or the page's palette can produce (at most 1.0) ever
 * blooms. Only light sources pushed past 1 — the monolith's rim, the packets,
 * the pipeline's lit stages — do, which is what `GLOW_GAIN` is for.
 * The product screens stay sharp, and the copy over them stays readable.
 *
 * The composer renders into a half-float buffer and turns the renderer's own
 * tone mapping off, so tone mapping is re-applied here as the last effect, with
 * the same ACES curve the renderer uses on the Low tier.
 *
 * No depth of field: the content is placed on stages beside the copy and is
 * meant to be read, and a focus blur over a product screen works against that.
 */

/** How far emissive accents are pushed past 1.0 when bloom can pick them up. */
export const GLOW_GAIN: Record<QualityTier, number> = { low: 1, medium: 2.2, high: 2.2 }

/** Emissive gain for this tier; 1 where there is no bloom to read it. */
export const useGlowGain = () => useQualityStore((s) => GLOW_GAIN[s.tier])

const ABERRATION = new Vector2(0.0003, 0.0002)

export function Effects() {
  const tier = useQualityStore((s) => s.tier)
  const setEffect = useScrollStore((s) => s.setEffect)

  // Published for the debug overlay and the verification suite: 0 none, 1 bloom
  // only, 2 the full stack.
  const passes = tier === 'high' ? 2 : tier === 'medium' ? 1 : 0
  useEffect(() => setEffect('postfx', passes), [passes, setEffect])

  if (tier === 'low') return null

  return tier === 'high' ? (
    <EffectComposer multisampling={4}>
      <Bloom
        mipmapBlur
        luminanceThreshold={1}
        luminanceSmoothing={0.08}
        intensity={0.9}
        radius={0.7}
      />
      <ChromaticAberration offset={ABERRATION} radialModulation modulationOffset={0.4} />
      <Vignette offset={0.32} darkness={0.55} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
    </EffectComposer>
  ) : (
    <EffectComposer multisampling={0}>
      <Bloom
        mipmapBlur
        luminanceThreshold={1}
        luminanceSmoothing={0.08}
        intensity={0.7}
        radius={0.6}
      />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
    </EffectComposer>
  )
}
