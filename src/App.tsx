import { Suspense, lazy } from 'react'
import { Nav } from '@/dom/ui/Nav'
import { LayerNav } from '@/dom/ui/LayerNav'
import { DebugOverlay } from '@/dom/ui/DebugOverlay'
import { SceneBoundary } from '@/dom/SceneBoundary'
import { DEBUG } from '@/debug'
import { CAN_RENDER_3D } from '@/tier'
import { Hero } from '@/dom/sections/Hero'
import { About } from '@/dom/sections/About'
import { Projects } from '@/dom/sections/Projects'
import { Skills } from '@/dom/sections/Skills'
import { Experience } from '@/dom/sections/Experience'
import { Contact } from '@/dom/sections/Contact'
import { Footer } from '@/dom/sections/Footer'

// The 3D payload is fetched only after the document has painted, so the Static
// tier and every crawler get the full page without touching three.js.
const Scene = lazy(() => import('@/canvas/Scene'))

export default function App() {
  // Decided once at startup (src/tier.ts): no WebGL or reduced motion means the
  // DOM below is the whole site, complete on its own.
  const canRender3D = CAN_RENDER_3D

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-60 focus:rounded focus:bg-bone focus:px-4 focus:py-2 focus:text-void"
      >
        Skip to content
      </a>

      {canRender3D && (
        <SceneBoundary>
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </SceneBoundary>
      )}

      <Nav />
      {canRender3D && <LayerNav />}

      <main id="main" className="shell relative z-10">
        <Hero />
        <Projects />
        <About />
        <Skills />
        <Experience />
        <Contact />
      </main>
      <div className="shell relative z-10">
        <Footer />
      </div>

      {DEBUG && <DebugOverlay />}
    </>
  )
}
