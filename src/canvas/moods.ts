/**
 * Lighting mood per layer (4.9; D3's default, derived from D1 cinematic-serious).
 *
 * Each layer is lit by its own studio: the four panels of `Lighting.tsx`
 * recoloured, baked into that layer's environment map, so a layer keeps its own
 * light even while the next one is in view. `sky` is the colour the renderer
 * clears to — near black everywhere, tinted just enough to tell the layers
 * apart — and it blends with scroll, so the descent has no hard cuts.
 *
 * Panel intensities stay those of the original studio: a mood changes the
 * colour of the light, not how much there is, so the copy over the stages keeps
 * the contrast `verify:phase3` measures.
 *
 * Deliberately three-free, like `layers.ts`.
 */
export type Mood = {
  /** Clear colour behind everything. Keep it dark: text sits on it. */
  sky: string
  /** Wide softbox above and in front. */
  key: string
  /** Large dim panel behind the camera. */
  fill: string
  /** Left rim strip, the layer's signature colour. */
  rim: string
  /** Right rim strip. */
  rimSoft: string
}

/** Same order as `LAYERS`: Orbit, Device, Surface, Ground, Core, Cloud. */
export const MOODS: Mood[] = [
  // L0 Orbit: cold moonlight, blue-violet, near-black indigo.
  { sky: '#080a1c', key: '#dfe5ff', fill: '#6c78b4', rim: '#4d7cfe', rimSoft: '#c9d4ff' },
  // L1 Device: lit by the screen. Neutral key, cool teal fill.
  { sky: '#03120f', key: '#e8eef0', fill: '#4f9488', rim: '#5ee0a0', rimSoft: '#bff5ea' },
  // L2 Surface: a clean studio, slightly warm white, least saturated.
  { sky: '#0c0e13', key: '#fff2e4', fill: '#99928c', rim: '#8ab4ff', rimSoft: '#ffffff' },
  // L3 Ground: sodium-amber practicals, warm shadows.
  { sky: '#180a02', key: '#ffd3a6', fill: '#80553a', rim: '#ff8a3d', rimSoft: '#ffcf8a' },
  // L4 Core: the machine room. Neutral steel, the darkest layer; the warm accent
  // stays with Ground (see `layers.ts`), so Core reads cooler beside it.
  { sky: '#06070b', key: '#e8eaf0', fill: '#4a5368', rim: '#e8eaf0', rimSoft: '#9fb0d0' },
  // L5 Cloud: desaturated grey-blue dawn, the most ambient light.
  { sky: '#0a1823', key: '#e6f4ff', fill: '#8199ab', rim: '#67e8f9', rimSoft: '#dff7ff' },
]
