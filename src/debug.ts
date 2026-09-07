/**
 * Development affordances, read once from the URL.
 *
 * `?debug=1` shows the stats overlay. `?p=0.42` pins scroll progress so a
 * specific point on the camera path can be inspected — or screenshotted in a
 * headless browser — without having to scroll there.
 */
const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search)

export const DEBUG = params.has('debug')

export const FORCED_PROGRESS = params.has('p')
  ? Math.min(1, Math.max(0, Number(params.get('p')) || 0))
  : null
