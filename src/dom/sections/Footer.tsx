import { profile } from '@/data/profile'
import { GraphicsToggle } from '@/dom/ui/GraphicsToggle'

export function Footer() {
  return (
    <footer className="border-t border-line py-10">
      <div className="flex flex-col gap-4 text-xs text-mist/85 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {profile.fullName}. Built with React, Three.js and too much
          attention to bundle size.
        </p>
        <div className="flex flex-wrap items-center gap-6">
          <GraphicsToggle />
          <p className="font-mono">
            <a
              href={profile.links.github}
              target="_blank"
              rel="noreferrer noopener"
              className="link hover:text-bone"
            >
              Source on GitHub <span className="link-arrow">↗</span>
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
