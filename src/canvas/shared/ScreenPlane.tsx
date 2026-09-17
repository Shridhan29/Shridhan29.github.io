import { useTexture } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { Shape, ShapeGeometry, SRGBColorSpace } from 'three'

/**
 * A lit display showing a real screenshot: a rounded rectangle with the image
 * stretched exactly across it. Unlit and not tone-mapped — a screen emits light,
 * it is not lit by the room.
 */
export function ScreenPlane({
  url,
  width,
  height,
  radius = 0.04,
  position = [0, 0, 0],
  dim = 1,
}: {
  url: string
  width: number
  height: number
  radius?: number
  position?: [number, number, number]
  /** Brightness multiplier, for screens meant to recede. */
  dim?: number
}) {
  const gl = useThree((s) => s.gl)
  const texture = useTexture(url, (t) => {
    t.colorSpace = SRGBColorSpace
    // Screens are seen at an angle; without this their text smears.
    t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
  })

  const geometry = useMemo(() => {
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
    const g = new ShapeGeometry(shape, 6)
    const pos = g.attributes.position
    const uv = g.attributes.uv
    for (let i = 0; i < pos.count; i++) {
      uv.setXY(i, (pos.getX(i) - x) / w, (pos.getY(i) - y) / h)
    }
    return g
  }, [width, height, radius])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh geometry={geometry} position={position}>
      <meshBasicMaterial map={texture} toneMapped={false} color={[dim, dim, dim]} />
    </mesh>
  )
}
