import { create } from 'zustand'
import {
  type GraphicsPreference,
  PLAIN_VIEW_KEY,
  PREFERENCE_KEY,
  readPlainView,
  readPreference,
} from '@/tier'

/**
 * Rendering quality for visits that get the 3D scene (ARCHITECTURE §7).
 *
 * The Static tier is not one of these: it is decided earlier, in `src/tier.ts`,
 * and means the canvas never mounts. These tiers only choose how much the
 * canvas does — post-processing, glass, fog density, packet counts.
 *
 * Decided once at boot from the device, then overridable: `?tier=low|medium|high`
 * for tests and inspection, or a saved choice (the Phase 6 toggle writes it).
 * Deliberately three-free, like `layers.ts`: the DOM debug overlay reads it.
 */
export type QualityTier = 'low' | 'medium' | 'high'

export const TIERS: readonly QualityTier[] = ['low', 'medium', 'high']

const isTier = (value: unknown): value is QualityTier =>
  typeof value === 'string' && (TIERS as readonly string[]).includes(value)

/**
 * A best guess from what the browser will say about the hardware. Coarse
 * pointers are phones and tablets, whose GPUs share a thermal budget with
 * everything else; `deviceMemory` is Chromium-only and capped at 8, so a
 * missing value is treated as unknown rather than as low.
 */
export function detectTier(): QualityTier {
  if (typeof window === 'undefined') return 'medium'
  const nav = navigator as Navigator & { deviceMemory?: number }
  const memory = nav.deviceMemory
  const cores = nav.hardwareConcurrency ?? 4
  const coarse = window.matchMedia('(pointer: coarse)').matches

  if (coarse || (memory !== undefined && memory <= 2) || cores <= 2) return 'low'
  if ((memory === undefined || memory >= 8) && cores >= 8) return 'high'
  return 'medium'
}

function readOverride(): QualityTier | null {
  if (typeof window === 'undefined') return null
  const forced = new URLSearchParams(window.location.search).get('tier')
  if (isTier(forced)) return forced
  const saved = readPreference()
  return isTier(saved) ? saved : null
}

type QualityState = {
  tier: QualityTier
  /**
   * Where the tier came from, shown in the debug overlay: detected at boot, a
   * visitor's or a URL's override, or stepped down automatically (6.2).
   */
  source: 'detected' | 'override' | 'auto'
  /** The footer toggle's value. */
  preference: GraphicsPreference
  /**
   * Saves the visitor's choice. Turning graphics off or back on reloads the
   * page, since whether the canvas exists at all is decided once at startup.
   */
  setPreference: (preference: GraphicsPreference) => void
  /**
   * One step down, when the frame rate cannot hold (6.2). Never below Low, never
   * persisted, and never over a choice the visitor or the URL made: a forced
   * tier stays forced. Returns whether anything changed.
   */
  downgrade: () => boolean
}

const override = readOverride()

export const useQualityStore = create<QualityState>((set, get) => ({
  tier: override ?? detectTier(),
  source: override ? 'override' : 'detected',
  // The plain view shows as Off, so the toggle tells the truth about the page.
  preference:
    typeof window === 'undefined' ? 'auto' : readPlainView() ? 'static' : readPreference(),
  setPreference: (preference) => {
    const reload = (preference === 'static') !== (get().preference === 'static')
    try {
      // Any explicit choice ends this visit's plain view.
      window.sessionStorage.removeItem(PLAIN_VIEW_KEY)
    } catch {
      // Nothing to clear.
    }
    try {
      if (preference === 'auto') window.localStorage.removeItem(PREFERENCE_KEY)
      else window.localStorage.setItem(PREFERENCE_KEY, preference)
    } catch {
      // Not persisted; the choice still applies for this visit.
    }
    if (reload) {
      window.location.reload()
      return
    }
    set(
      preference === 'auto' || preference === 'static'
        ? { preference, tier: detectTier(), source: 'detected' }
        : { preference, tier: preference, source: 'override' },
    )
  },
  downgrade: () => {
    const { tier, source } = get()
    if (source === 'override' || tier === 'low') return false
    set({ tier: tier === 'high' ? 'medium' : 'low', source: 'auto' })
    return true
  },
}))

/** Picks the value for the current tier: `byTier(tier, { low: 20, medium: 50, high: 90 })`. */
export const byTier = <T>(tier: QualityTier, values: Record<QualityTier, T>): T => values[tier]
