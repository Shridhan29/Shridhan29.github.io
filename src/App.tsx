import { Nav } from '@/dom/ui/Nav'
import { Hero } from '@/dom/sections/Hero'
import { About } from '@/dom/sections/About'
import { Projects } from '@/dom/sections/Projects'
import { Skills } from '@/dom/sections/Skills'
import { Experience } from '@/dom/sections/Experience'
import { Contact } from '@/dom/sections/Contact'
import { Footer } from '@/dom/sections/Footer'

/**
 * Phase 1 — the static portfolio. Every word of content lives in real semantic
 * HTML here, which is also what the no-WebGL Static tier will serve once the 3D
 * layers arrive in Phase 2.
 */
export default function App() {
  return (
    <>
      <a
        href="#work"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-60 focus:rounded focus:bg-bone focus:px-4 focus:py-2 focus:text-void"
      >
        Skip to content
      </a>
      <Nav />
      <main className="shell">
        <Hero />
        <Projects />
        <About />
        <Skills />
        <Experience />
        <Contact />
      </main>
      <div className="shell">
        <Footer />
      </div>
    </>
  )
}
