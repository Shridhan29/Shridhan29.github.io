import { CatmullRomCurve3, Vector3 } from 'three'
import { LAYERS } from './layers'

/** One continuous camera path through every layer. */
export const CAMERA_CURVE = new CatmullRomCurve3(
  LAYERS.map((l) => new Vector3(...l.camera)),
  false,
  'catmullrom',
  0.4,
)

/** Look targets, sampled on the same parameter as the camera. */
export const LOOK_CURVE = new CatmullRomCurve3(
  LAYERS.map((l) => new Vector3(...l.anchor).add(new Vector3(...l.lookOffset))),
  false,
  'catmullrom',
  0.4,
)
