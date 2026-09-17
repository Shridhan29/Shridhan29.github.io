import { MathUtils, type PerspectiveCamera, Vector3 } from 'three'

/**
 * Places 3D content inside a DOM element's on-screen box.
 *
 * Some layers are illustrations inside an article rather than scenery around
 * it. The page reserves an empty element — a stage — and the layer draws into
 * it: on the camera ray through the stage's centre, at a fixed distance, sized
 * to the stage's height. Recomputed every frame, so the content stays locked to
 * the stage while the page scrolls and the camera moves.
 */

const point = new Vector3()
const forward = new Vector3()

export type StageFit = {
  /** False when the stage is not laid out (hidden at this breakpoint) or off screen. */
  visible: boolean
  /** World-space height that fills the stage. */
  height: number
  /** Stage centre's vertical position on screen, -1 at the bottom and 1 at the top. */
  screenY: number
}

export function fitToStage(
  stage: Element,
  camera: PerspectiveCamera,
  viewport: { width: number; height: number },
  distance: number,
  out: Vector3,
): StageFit {
  const rect = stage.getBoundingClientRect()
  if (rect.width === 0 || rect.bottom < 0 || rect.top > viewport.height) {
    return { visible: false, height: 0, screenY: 0 }
  }

  // The rig moved the camera this frame; its matrices are refreshed at render,
  // which is too late for unprojecting now — reading them stale makes the
  // content lag one frame behind the page while scrolling.
  camera.updateMatrixWorld()

  const screenX = ((rect.left + rect.width / 2) / viewport.width) * 2 - 1
  const screenY = -((rect.top + rect.height / 2) / viewport.height) * 2 + 1
  point.set(screenX, screenY, 0.5).unproject(camera).sub(camera.position).normalize()
  out.copy(camera.position).addScaledVector(point, distance)

  // Size by depth along the view axis, not along the ray, or content off-centre
  // would shrink.
  camera.getWorldDirection(forward)
  const depth = distance * point.dot(forward)
  const viewHeight = 2 * Math.tan(MathUtils.degToRad(camera.fov / 2)) * depth
  return { visible: true, height: viewHeight * (rect.height / viewport.height), screenY }
}
