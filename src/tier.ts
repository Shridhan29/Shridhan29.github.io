/**
 * Whether this visit gets the 3D scene, decided once at startup.
 *
 * No 3D — the DOM is the whole site, and it is complete on its own — when:
 *  - there is no WebGL2,
 *  - the visitor asked for reduced motion,
 *  - it is a touch-first screen narrower than the stages (decision D12). Every
 *    layer below the hero draws into a stage that needs ≥ 1024 px, so a phone
 *    would download three.js and start a GPU context to show a starfield, or
 *  - the visitor turned graphics off with the footer toggle (6.1).
 *
 * Read by App to mount the canvas, and by any section that makes room for a 3D
 * stage — so a stage is never left empty. Rotating a tablet later does not
 * change the answer; reloading does.
 */
export const STAGE_MIN_PX = 1024

/** localStorage key for the graphics choice: a tier, `static`, or absent for automatic. */
export const PREFERENCE_KEY = 'quality-tier'

export type GraphicsPreference = 'auto' | 'high' | 'medium' | 'low' | 'static'

/** The saved graphics choice. Storage can be blocked; that reads as automatic. */
export function readPreference(): GraphicsPreference {
  try {
    const saved = window.localStorage.getItem(PREFERENCE_KEY)
    return saved === 'high' || saved === 'medium' || saved === 'low' || saved === 'static'
      ? saved
      : 'auto'
  } catch {
    return 'auto'
  }
}

/** Whether this device could run the scene at all — the toggle is offered only then. */
export const SUPPORTS_3D =
  typeof window !== 'undefined' &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
  !(window.matchMedia('(pointer: coarse)').matches && window.innerWidth < STAGE_MIN_PX) &&
  (() => {
    try {
      return !!document.createElement('canvas').getContext('webgl2')
    } catch {
      return false
    }
  })()

export const CAN_RENDER_3D = SUPPORTS_3D && readPreference() !== 'static'
