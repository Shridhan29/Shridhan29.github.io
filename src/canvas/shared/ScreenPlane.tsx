import { useTexture } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { SRGBColorSpace } from 'three'
import { roundedScreen } from './roundedScreen'

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

  const geometry = useMemo(() => roundedScreen(width, height, radius), [width, height, radius])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh geometry={geometry} position={position}>
      <meshBasicMaterial map={texture} toneMapped={false} color={[dim, dim, dim]} />
    </mesh>
  )
}
