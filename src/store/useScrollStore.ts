import { create } from 'zustand'
import { LAYERS } from '@/canvas/layers'

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
  stats: { fps: number; calls: number; tris: number }
  setProgress: (progress: number, direction: 1 | -1) => void
  setStats: (stats: { fps: number; calls: number; tris: number }) => void
}

export const useScrollStore = create<ScrollState>((set) => ({
  progress: 0,
  layer: 0,
  direction: 1,
  stats: { fps: 0, calls: 0, tris: 0 },
  setProgress: (progress, direction) =>
    set({
      progress,
      direction,
      layer: Math.min(LAYERS.length - 1, Math.round(progress * (LAYERS.length - 1))),
    }),
  setStats: (stats) => set({ stats }),
}))
