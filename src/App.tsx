import { Suspense, lazy } from 'react'
import { Nav } from '@/dom/ui/Nav'
import { LayerNav } from '@/dom/ui/LayerNav'
import { DebugOverlay } from '@/dom/ui/DebugOverlay'
import { DEBUG } from '@/debug'
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
  // No WebGL, or the visitor asked for reduced motion: the DOM below is the
  // whole site, and it is complete on its own.
  const canRender3D =
    typeof window !== 'undefined' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
    (() => {
      try {
        return !!document.createElement('canvas').getContext('webgl2')
      } catch {
        return false
      }
    })()

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-60 focus:rounded focus:bg-bone focus:px-4 focus:py-2 focus:text-void"
      >
        Skip to content
      </a>

      {canRender3D && (
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
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
