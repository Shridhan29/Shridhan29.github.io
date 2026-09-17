import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { useLenis } from '@/hooks/useLenis'
import { CameraRig } from './CameraRig'
import { Lighting } from './Lighting'
import { Stats } from './Stats'
import { Device } from './layers/Device'
import { Orbit } from './layers/Orbit'
import { Placeholder } from './layers/Placeholder'
import { Surface } from './layers/Surface'
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
          <Lighting />
          <Orbit layer={LAYERS[0]} index={0} />
          {/* Its own boundary: while the screen texture loads, the rest of the
              scene keeps rendering instead of suspending with it. */}
          <Suspense fallback={null}>
            <Device layer={LAYERS[1]} index={1} />
          </Suspense>
          <Suspense fallback={null}>
            <Surface layer={LAYERS[2]} index={2} />
          </Suspense>
          {/* Layers not built yet. Each is replaced in turn during Phase 3. */}
          {LAYERS.slice(3).map((layer, i) => (
            <Placeholder key={layer.id} layer={layer} index={i + 3} />
          ))}
        </Suspense>
      </Canvas>
    </div>
  )
}
