/**
 * The palette for the 3D scene. Mirrors the `@theme` tokens in
 * `src/styles/index.css` — change both together, so the canvas and the DOM
 * overlay never drift apart.
 */
export const PALETTE = {
  void: '#05060a',
  ink: '#0b0d14',
  slate: '#151925',
  mist: '#8b93a7',
  bone: '#e8eaf0',
  accent: '#4d7cfe',
  ember: '#ff8a3d',
} as const
