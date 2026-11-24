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
    <label className="flex items-center gap-2 font-mono">
      <span>Graphics</span>
      <select
        data-graphics-toggle
        value={preference}
        onChange={(e) => setPreference(e.target.value as GraphicsPreference)}
        className="rounded border border-slate bg-void px-2 py-1 text-bone hover:border-mist focus-visible:outline-2 focus-visible:outline-accent"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
