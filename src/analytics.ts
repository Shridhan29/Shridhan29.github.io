/**
 * Visit counts (6.8), via GoatCounter: no cookies, no personal data, no
 * consent banner needed, and the script is about 3 KB.
 *
 * Off unless the build is given a site code (`VITE_GOATCOUNTER`, set from the
 * repository variable `GOATCOUNTER_CODE` in the deploy workflow), so a fork or
 * a local build never reports anywhere. Also off for visitors who send Do Not
 * Track or Global Privacy Control, on localhost, under `?debug`, and for
 * automated browsers — the verification suites and Lighthouse would otherwise
 * count themselves.
 *
 * Loaded after the page is idle, so it never competes with first paint.
 * Clicks on elements carrying `data-goatcounter-click` (the résumé and Play
 * Store links) are counted as events by the script itself.
 */
const CODE = import.meta.env.VITE_GOATCOUNTER as string | undefined

export function startAnalytics() {
  if (!CODE || !/^[a-z0-9-]+$/.test(CODE)) return
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean }
  if (nav.doNotTrack === '1' || nav.globalPrivacyControl || nav.webdriver) return
  if (/^(localhost|127\.|\[::1\])/.test(location.hostname)) return
  if (new URLSearchParams(location.search).has('debug')) return

  const load = () => {
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://gc.zgo.at/count.js'
    script.dataset.goatcounter = `https://${CODE}.goatcounter.com/count`
    document.head.append(script)
  }
  if ('requestIdleCallback' in window) requestIdleCallback(load, { timeout: 4000 })
  else setTimeout(load, 2000)
}
