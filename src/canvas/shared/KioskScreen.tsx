import { Html } from '@react-three/drei'
import { useState } from 'react'

/**
 * The Urja Dairy Tour kiosk, running inside the scene (4.5).
 *
 * Not a screenshot: the real interface, in three languages, mounted on the
 * kiosk's screen with drei's `Html transform`, so a visitor can pick a language
 * and watch the tour list answer. It is the same choice the kiosk in the plant
 * offers, and it costs nothing to ship — the strings are the content.
 *
 * Deliberately mouse-only. The canvas is `aria-hidden` scenery, and focusable
 * controls inside it would be a keyboard trap: reachable by Tab, invisible to a
 * screen reader. Everything it says is in the article's own text, and the
 * screenshot row is what phones and the Static tier show.
 */

const LANGUAGES = [
  { code: 'en', label: 'English', prompt: 'Choose your language' },
  { code: 'hi', label: 'हिंदी', prompt: 'अपनी भाषा चुनें' },
  { code: 'mr', label: 'मराठी', prompt: 'तुमची भाषा निवडा' },
] as const

const TOURS: Record<(typeof LANGUAGES)[number]['code'], string[]> = {
  en: ['Milk reception', 'Pasteurising', 'Packing line', 'Cold store'],
  hi: ['दूध संग्रह', 'पाश्चुरीकरण', 'पैकिंग लाइन', 'शीत भंडार'],
  mr: ['दूध स्वीकृती', 'पाश्चरीकरण', 'पॅकिंग लाइन', 'शीतगृह'],
}

/** Screen size in CSS pixels; scaled to fill the kiosk's screen in world units. */
export const SCREEN_PX = { width: 640, height: 329 }

/**
 * drei's `Html transform` lays the page out at 40 CSS pixels to the world unit
 * (its `(distanceFactor || 10) / 400` ratio). Sizing by hand without this, the
 * interface rendered as a 2 px speck on the kiosk.
 */
const PX_PER_UNIT = 40

export function KioskScreen({ width }: { width: number }) {
  const scale = (width / SCREEN_PX.width) * PX_PER_UNIT
  const [code, setCode] = useState<(typeof LANGUAGES)[number]['code']>('en')
  const language = LANGUAGES.find((l) => l.code === code)!

  return (
    <Html
      transform
      center
      // Its own pixel grid, scaled into the kiosk's screen.
      scale={scale}
      position={[0, 0, 0.047]}
      zIndexRange={[10, 0]}
      style={{ width: SCREEN_PX.width, height: SCREEN_PX.height }}
    >
      <div
        data-kiosk
        aria-hidden
        style={{
          width: SCREEN_PX.width,
          height: SCREEN_PX.height,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: 22,
          boxSizing: 'border-box',
          background: '#f6f7f1',
          color: '#14321f',
          fontFamily: 'system-ui, sans-serif',
          borderRadius: 10,
          userSelect: 'none',
          // The screen is the frame: nothing may spill past the kiosk's bezel.
          overflow: 'hidden',
        }}
      >
        <div style={{ fontSize: 13, letterSpacing: '0.18em', color: '#5c7a63' }}>
          URJA DAIRY TOUR
        </div>
        <div style={{ fontSize: 26, fontWeight: 600 }}>{language.prompt}</div>

        <div style={{ display: 'flex', gap: 12 }}>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              // Mouse-only by design: see the note at the top of this file.
              tabIndex={-1}
              onClick={() => setCode(l.code)}
              style={{
                flex: 1,
                padding: '10px 8px',
                fontSize: 18,
                cursor: 'pointer',
                borderRadius: 8,
                border: `2px solid ${l.code === code ? '#1d6b3c' : '#c9d3c6'}`,
                background: l.code === code ? '#1d6b3c' : 'transparent',
                color: l.code === code ? '#f6f7f1' : '#14321f',
                fontFamily: 'inherit',
              }}
            >
              {l.label}
            </button>
          ))}
        </div>

        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 5 }}>
          {TOURS[code].map((stop, i) => (
            <li
              key={stop}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 16,
                color: '#2c4a36',
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: '50%',
                  background: '#e3eade',
                  fontSize: 14,
                }}
              >
                {i + 1}
              </span>
              {stop}
            </li>
          ))}
        </ul>
      </div>
    </Html>
  )
}
