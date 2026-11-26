import { type GraphicsPreference, SUPPORTS_3D } from '@/tier'
import { useQualityStore } from '@/store/useQualityStore'

const OPTIONS: { value: GraphicsPreference; label: string }[] = [
  { value: 'auto', label: 'Automatic' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'static', label: 'Off (2D page)' },
]

/**
 * The visitor's say over the 3D scene (6.1): a tier, or off entirely. A native
 * select, so it is keyboard- and screen-reader-ready with no extra code.
 *
 * Offered only where the scene could run at all. With no WebGL, reduced motion,
 * or a phone, the page is already 2D and there is nothing to choose.
 */
export function GraphicsToggle() {
  const preference = useQualityStore((s) => s.preference)
  const setPreference = useQualityStore((s) => s.setPreference)

  if (!SUPPORTS_3D) return null

  return (
    <label className="flex items-center gap-2.5">
      <span>Graphics</span>
      {/* Native, for the keyboard and screen readers; styled as a pill to match
          the page's buttons, with its own chevron in place of the system one. */}
      <span className="relative">
        <select
          data-graphics-toggle
          value={preference}
          onChange={(e) => setPreference(e.target.value as GraphicsPreference)}
          className="cursor-pointer appearance-none rounded-full border border-line-strong bg-white/[0.02] py-1.5 pr-8 pl-3.5 text-bone transition-colors hover:border-accent"
        >
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="bg-ink text-bone">
              {o.label}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[0.6rem] text-mist"
        >
          ▾
        </span>
      </span>
    </label>
  )
}
