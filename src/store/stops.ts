import { LAYERS } from '@/canvas/layers'

/**
 * Maps document scroll onto the camera journey, so each layer arrives with its
 * content rather than at an even fraction of the page. Articles are not evenly
 * spaced — at 1440 px TRUUNA starts at 4% of the scroll and About at 62% — so a
 * linear mapping showed the TRUUNA phone while the aashman.in article was on
 * screen.
 *
 * Journey 0..1 has layer i at exactly i / (n - 1), matching the camera curve's
 * control points. Between two stops it is linear in scroll distance.
 */

/** A layer arrives when its content's top is this far down the viewport. */
const ARRIVE_AT = 0.25

/** Scroll offset, in px, at which each layer is fully in view. Non-decreasing. */
export function measureStops(): number[] {
  const max = document.documentElement.scrollHeight - window.innerHeight
  let previous = 0
  return LAYERS.map((layer, i) => {
    if (i === 0) return 0
    const el = document.getElementById(layer.section)
    const top = el ? el.getBoundingClientRect().top + window.scrollY : max
    const stop = Math.min(max, Math.max(previous, top - window.innerHeight * ARRIVE_AT))
    previous = stop
    return stop
  })
}

/** Document scroll in px → journey 0..1. */
export function toJourney(scroll: number, stops: number[]): number {
  const last = stops.length - 1
  if (scroll <= stops[0]) return 0
  if (scroll >= stops[last]) return 1
  for (let i = 0; i < last; i++) {
    const from = stops[i]
    const to = stops[i + 1]
    if (scroll < to) {
      // Two layers on the same stop (the page ran out first): jump, don't divide by zero.
      const local = to > from ? (scroll - from) / (to - from) : 1
      return (i + local) / last
    }
  }
  return 1
}
