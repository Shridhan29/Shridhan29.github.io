import { create } from 'zustand'
import { LAYERS } from '@/canvas/layers'

/** Renderer numbers for one sample window (about half a second), per frame where it applies. */
export type FrameStats = {
  fps: number
  /** Mean frame time, ms — steadier than fps for judging a device. */
  ms: number
  calls: number
  tris: number
  /** GPU resources alive right now: geometries, textures, compiled shader programs. */
  geometries: number
  textures: number
  programs: number
}

type ScrollState = {
  /**
   * Camera journey, 0 at the first layer and 1 at the last, with layer i at
   * i / (n - 1). Mapped from scroll through measured stops (`stops.ts`), so it is
   * not the document's scroll fraction.
   */
  progress: number
  /** Index of the layer the camera is currently nearest. */
  layer: number
  direction: 1 | -1
  /** Frame stats, published by the canvas for the debug overlay. */
  stats: FrameStats
  setProgress: (progress: number, direction: 1 | -1) => void
  /**
   * Named values published by the layers' effects — the screen a device shows,
   * how many pipeline stages have lit. The debug overlay prints them and the
   * verification suite reads them, so an effect is checked by its own state
   * rather than guessed from pixels, which a scrolling page makes unreliable.
   */
  effects: Record<string, number>
  setStats: (stats: FrameStats) => void
  setEffect: (name: string, value: number) => void
}

export const useScrollStore = create<ScrollState>((set) => ({
  progress: 0,
  layer: 0,
  direction: 1,
  stats: { fps: 0, ms: 0, calls: 0, tris: 0, geometries: 0, textures: 0, programs: 0 },
  effects: {},
  setProgress: (progress, direction) =>
    set({
      progress,
      direction,
      layer: Math.min(LAYERS.length - 1, Math.round(progress * (LAYERS.length - 1))),
    }),
  setStats: (stats) => set({ stats }),
  setEffect: (name, value) =>
    set((state) =>
      state.effects[name] === value ? state : { effects: { ...state.effects, [name]: value } },
    ),
}))
