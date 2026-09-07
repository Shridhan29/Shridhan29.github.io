import { profile } from '@/data/profile'

export function Footer() {
  return (
    <footer className="border-t border-slate/60 py-10">
      <div className="flex flex-col gap-4 text-xs text-mist/70 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {profile.fullName}. Built with React, Three.js and too much attention to bundle
          size.
        </p>
        <p className="font-mono">
          <a href={profile.links.github} target="_blank" rel="noreferrer noopener" className="hover:text-bone">
            Source on GitHub ↗
          </a>
        </p>
      </div>
    </footer>
  )
}
