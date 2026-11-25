import { useEffect, useState } from 'react'
import { profile } from '@/data/profile'

// `always` links stay visible on phones, where there is no room for the full
// set — without them a mobile visitor has no navigation at all.
const LINKS = [
  { href: '#work', label: 'Work', always: true },
  { href: '#about', label: 'About', always: false },
  { href: '#experience', label: 'Experience', always: false },
  { href: '#contact', label: 'Contact', always: true },
]

export function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? 'border-b border-line bg-void/80 backdrop-blur-md'
          : 'border-b border-transparent'
      }`}
    >
      <nav aria-label="Primary" className="shell flex items-center justify-between py-4">
        <a href="#top" className="font-mono text-sm tracking-tight text-bone">
          shridhan
          {/* Decorative: part of the logotype, not read aloud. */}
          <span aria-hidden className="text-accent">
            .
          </span>
        </a>
        <ul className="flex items-center gap-1 text-sm text-mist sm:gap-2">
          {LINKS.map((l) => (
            <li key={l.href} className={l.always ? '' : 'hidden sm:block'}>
              <a
                href={l.href}
                className="rounded-full px-3 py-1.5 transition-colors hover:bg-white/[0.06] hover:text-bone"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href={profile.resume}
              data-goatcounter-click="resume-nav"
              className="btn btn-ghost ml-1 !px-4 !py-1.5"
            >
              Résumé
            </a>
          </li>
        </ul>
      </nav>
    </header>
  )
}
