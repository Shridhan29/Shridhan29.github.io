import { create } from 'zustand'

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

const STORAGE_KEY = 'quality-tier'

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
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return isTier(saved) ? saved : null
  } catch {
    // Storage can be blocked (private windows, cleared site data); detection still works.
    return null
  }
}

type QualityState = {
  tier: QualityTier
  /** Where the tier came from, shown in the debug overlay. */
  source: 'detected' | 'override'
  /** Saves a manual choice; `null` clears it and returns to detection. */
  setTier: (tier: QualityTier | null) => void
}

const override = readOverride()

export const useQualityStore = create<QualityState>((set) => ({
  tier: override ?? detectTier(),
  source: override ? 'override' : 'detected',
  setTier: (tier) => {
    try {
      if (tier) window.localStorage.setItem(STORAGE_KEY, tier)
      else window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Not persisted; the choice still applies for this visit.
    }
    set(tier ? { tier, source: 'override' } : { tier: detectTier(), source: 'detected' })
  },
}))

/** Picks the value for the current tier: `byTier(tier, { low: 20, medium: 50, high: 90 })`. */
export const byTier = <T>(tier: QualityTier, values: Record<QualityTier, T>): T => values[tier]
