import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { profile } from '@/data/profile'

// `always` links stay visible on phones, where there is no room for the full
// set — without them a mobile visitor has no navigation at all.
const LINKS = [
  { href: '#work', label: 'Work', always: true },
  { href: '#about', label: 'About', always: false },
  { href: '#experience', label: 'Experience', always: false },
  { href: '#contact', label: 'Contact', always: true },
]

/** The section whose top has passed this share of the viewport is the current one. */
const CURRENT_AT = 0.35

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [current, setCurrent] = useState('')
  const list = useRef<HTMLUListElement>(null)
  // The highlight behind the current link: one element that slides between
  // links rather than a background that jumps from one to the next.
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    const place = () => {
      const a = list.current?.querySelector<HTMLElement>('a[aria-current]')
      setPill(a ? { left: a.offsetLeft, width: a.offsetWidth } : null)
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [current])

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24)
      // The last linked section that has scrolled up past the line.
      let id = ''
      for (const l of LINKS) {
        const el = document.querySelector(l.href)
        if (el && el.getBoundingClientRect().top <= window.innerHeight * CURRENT_AT) {
          id = l.href
        }
      }
      setCurrent(id)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? // Near-opaque: at 80% the headings passing beneath showed through.
            'border-b border-line bg-void/95 backdrop-blur-xl'
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
        <ul ref={list} className="relative flex items-center gap-1 text-sm text-mist sm:gap-2">
          <li
            aria-hidden
            className="pointer-events-none absolute top-1/2 h-8 -translate-y-1/2 rounded-full bg-white/[0.08] transition-[left,width,opacity] duration-300 ease-out"
            style={{ left: pill?.left ?? 0, width: pill?.width ?? 0, opacity: pill ? 1 : 0 }}
          />
          {LINKS.map((l) => (
            <li key={l.href} className={l.always ? '' : 'hidden sm:block'}>
              <a
                href={l.href}
                aria-current={current === l.href ? 'location' : undefined}
                className="relative rounded-full px-3 py-1.5 transition-colors hover:text-bone aria-[current]:text-bone"
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
