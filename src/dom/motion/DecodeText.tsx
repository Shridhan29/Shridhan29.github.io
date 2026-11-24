import { useEffect, useState } from 'react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·/<>'

/**
 * Text that decodes into place once, left to right (5.3) — written for this
 * site after React Bits' `DecryptedText`, with no dependencies.
 *
 * The real text is what assistive tech reads (a visually hidden copy; the
 * scrambled glyphs are hidden from it — `aria-label` on a plain span is not
 * reliably announced), and what renders with reduced motion.
 * Each character keeps its own width while scrambling only if the font is
 * monospaced, which is the only place this is used.
 */
export function DecodeText({ text, duration = 900 }: { text: string; duration?: number }) {
  const reduced = usePrefersReducedMotion()
  const [shown, setShown] = useState(reduced ? text : scramble(text, 0))

  useEffect(() => {
    if (reduced) {
      setShown(text)
      return
    }
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      setShown(scramble(text, Math.floor(t * text.length)))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [text, duration, reduced])

  return (
    <span>
      <span className="sr-only">{text}</span>
      <span aria-hidden data-decode>
        {shown}
      </span>
    </span>
  )
}

/** The first `resolved` characters as written, the rest random; spaces stay spaces. */
function scramble(text: string, resolved: number) {
  let out = text.slice(0, resolved)
  for (let i = resolved; i < text.length; i++) {
    const c = text[i]
    out += c === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
  }
  return out
}
