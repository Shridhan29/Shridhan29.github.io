/**
 * Whether this visit gets the 3D scene, decided once at startup.
 *
 * No 3D — the DOM is the whole site, and it is complete on its own — when:
 *  - there is no WebGL2,
 *  - the visitor asked for reduced motion, or
 *  - it is a touch-first screen narrower than the stages (decision D12). Every
 *    layer below the hero draws into a stage that needs ≥ 1024 px, so a phone
 *    would download three.js and start a GPU context to show a starfield.
 *
 * Read by App to mount the canvas, and by any section that makes room for a 3D
 * stage — so a stage is never left empty. Rotating a tablet later does not
 * change the answer; reloading does.
 */
export const STAGE_MIN_PX = 1024

export const CAN_RENDER_3D =
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
