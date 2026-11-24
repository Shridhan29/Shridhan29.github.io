import { useProgress } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useState } from 'react'
import { useLenis } from '@/hooks/useLenis'
import { AutoDowngrade } from './AutoDowngrade'
import { CameraRig } from './CameraRig'
import { Effects } from './Effects'
import { Lighting } from './Lighting'
import { Staged } from './Staged'
import { Stats } from './Stats'
import { Warmup } from './Warmup'
import { Cloud } from './layers/Cloud'
import { Core } from './layers/Core'
import { Device } from './layers/Device'
import { GroundKiosk, GroundPos } from './layers/Ground'
import { Orbit } from './layers/Orbit'
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

  // 5.1: no blocking preloader. The page is readable the moment it paints; the
  // scene fades in behind it once its shaders are compiled, and a hairline at
  // the top tracks real downloads (layer textures), never a timer.
  const [ready, setReady] = useState(false)
  const { active, progress } = useProgress()

  return (
    <>
      <div
        aria-hidden="true"
        data-loading-line
        className="pointer-events-none fixed top-0 left-0 z-60 h-px bg-accent transition-[width,opacity] duration-500"
        style={{ width: `${progress}%`, opacity: active ? 0.8 : 0 }}
      />
      <div
        className={`pointer-events-none fixed inset-0 z-0 transition-opacity duration-1000 ${ready ? 'opacity-100' : 'opacity-0'}`}
        data-scene-ready={ready || undefined}
        aria-hidden="true"
      >
        <Canvas
          // Clamped so a retina display does not quietly quadruple fill cost.
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          camera={{ fov: 42, near: 0.1, far: 200 }}
          frameloop="always"
          onCreated={({ gl }) => {
            // A lost GPU context hands the stages back to the page content
            // (the `scene-off:` CSS variant) until it is restored.
            const root = document.documentElement
            gl.domElement.addEventListener('webglcontextlost', () => (root.dataset.sceneOff = ''))
            gl.domElement.addEventListener(
              'webglcontextrestored',
              () => delete root.dataset.sceneOff,
            )
          }}
        >
          <Suspense fallback={null}>
            <CameraRig />
            <Stats />
            <Lighting />
            <Effects />
            <AutoDowngrade />
            <Orbit layer={LAYERS[0]} index={0} />
            <Warmup onReady={() => setReady(true)} />
            {/* Staged layers mount when their stage is laid out and the camera is near. */}
            <Staged stage="device" index={1}>
              <Device layer={LAYERS[1]} index={1} />
            </Staged>
            <Staged stage="surface" index={2}>
              <Surface layer={LAYERS[2]} index={2} />
            </Staged>
            <Staged stage="ground-pos" index={3}>
              <GroundPos layer={LAYERS[3]} index={3} />
            </Staged>
            <Staged stage="ground-kiosk" index={3}>
              <GroundKiosk layer={LAYERS[3]} index={3} />
            </Staged>
            <Staged stage="core" index={4}>
              <Core layer={LAYERS[4]} index={4} />
            </Staged>
            <Staged stage="cloud" index={5}>
              <Cloud layer={LAYERS[5]} index={5} />
            </Staged>
          </Suspense>
        </Canvas>
      </div>
    </>
  )
}
