/**
 * Whether this visit gets the 3D scene, decided once at startup.
 *
 * No WebGL, or the visitor asked for reduced motion: the DOM is the whole site,
 * and it is complete on its own. Read by App to mount the canvas, and by any
 * section that makes room for a 3D stage — so a stage is never left empty.
 */
export const CAN_RENDER_3D =
  typeof window !== 'undefined' &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
  (() => {
    try {
      return !!document.createElement('canvas').getContext('webgl2')
    } catch {
      return false
    }
  })()
