import { Shape, ShapeGeometry } from 'three'

/**
 * A rounded rectangle with UVs spanning it exactly, so a screenshot fills the
 * screen and its corners are cut like a real display's.
 */
export function roundedScreen(width: number, height: number, radius: number) {
  const [x, y, w, h, r] = [-width / 2, -height / 2, width, height, radius]
  const shape = new Shape()
    .moveTo(x + r, y)
    .lineTo(x + w - r, y)
    .quadraticCurveTo(x + w, y, x + w, y + r)
    .lineTo(x + w, y + h - r)
    .quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    .lineTo(x + r, y + h)
    .quadraticCurveTo(x, y + h, x, y + h - r)
    .lineTo(x, y + r)
    .quadraticCurveTo(x, y, x + r, y)

  const geometry = new ShapeGeometry(shape, 6)
  const position = geometry.attributes.position
  const uv = geometry.attributes.uv
  for (let i = 0; i < position.count; i++) {
    uv.setXY(i, (position.getX(i) - x) / w, (position.getY(i) - y) / h)
  }
  return geometry
}
