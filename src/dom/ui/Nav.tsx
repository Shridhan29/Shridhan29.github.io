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
        scrolled ? 'border-b border-slate/70 bg-void/85 backdrop-blur-md' : 'border-b border-transparent'
      }`}
    >
      <nav aria-label="Primary" className="shell flex items-center justify-between py-4">
        <a href="#top" className="font-mono text-sm tracking-tight text-bone">
          shridhan<span className="text-accent">.</span>
        </a>
        <ul className="flex items-center gap-5 text-sm text-mist md:gap-7">
          {LINKS.map((l) => (
            <li key={l.href} className={l.always ? '' : 'hidden sm:block'}>
              <a href={l.href} className="transition-colors hover:text-bone">
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href={profile.resume}
              className="rounded-full border border-slate px-4 py-1.5 text-sm text-bone transition-colors hover:border-accent hover:text-accent"
            >
              Résumé
            </a>
          </li>
        </ul>
      </nav>
    </header>
  )
}
