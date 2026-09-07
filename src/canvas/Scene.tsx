import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { useLenis } from '@/hooks/useLenis'
import { CameraRig } from './CameraRig'
import { Stats } from './Stats'
import { Placeholder } from './layers/Placeholder'
import { LAYERS } from './layers'

/**
 * One canvas for the life of the page, fixed behind the scrolling document.
 * It is never remounted — doing so per section is the usual cause of jank in
 * 3D portfolios, and it would drop every compiled shader and uploaded texture.
 */
export default function Scene() {
  // Lenis and ScrollTrigger live here rather than in App so GSAP rides the lazy
  // 3D chunk. Visitors on the Static tier never download them.
  useLenis()

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        // Clamped so a retina display does not quietly quadruple fill cost.
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ fov: 42, near: 0.1, far: 200 }}
        frameloop="always"
      >
        <Suspense fallback={null}>
          <CameraRig />
          <Stats />
          <ambientLight intensity={0.6} />
          <directionalLight position={[4, 6, 8]} intensity={1.2} />
          {LAYERS.map((layer, i) => (
            <Placeholder key={layer.id} layer={layer} index={i} />
          ))}
        </Suspense>
      </Canvas>
    </div>
  )
}
