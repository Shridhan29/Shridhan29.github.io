/**
 * Performance report for the built site (tracker 3.8).
 *
 *   npm run build && npm run perf
 *
 * Walks the real journey — the top, then each section with a 3D layer centred —
 * at desktop, wide and phone sizes, and prints what each stop costs: frame time,
 * draw calls, triangles, live GPU resources and JS heap, plus what the visit
 * downloads. A measurement, not a pass/fail gate: the budgets are enforced by
 * `npm run verify`.
 *
 * Frame rate and frame time here come from software rendering (no GPU), so they
 * say nothing about a real device — see DEVICE_TESTING.md. Everything else
 * (draw calls, triangles, resources, bytes) is the same on any machine.
 */
import { closeBrowser, launchBrowser, PHONE, sleep, startPreview } from './lib/harness.mjs'

const STOPS = ['top', 'truuna', 'aashman', 'dms', 'urja', 'about', 'experience']
const VIEWPORTS = [
  ['desktop 1440×900', { width: 1440, height: 900 }],
  ['wide 1920×1080', { width: 1920, height: 1080 }],
  ['phone 390×844', PHONE],
]

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`

const overlay = (page) =>
  page.evaluate(() => {
    const text = document.querySelector('[data-debug]')?.textContent ?? ''
    const num = (label) =>
      Number(new RegExp(`${label}\\s+([0-9.,]+)`).exec(text)?.[1]?.replace(/,/g, '') ?? 0)
    return {
      fps: num('fps'),
      ms: num('ms'),
      calls: num('calls'),
      tris: num('tris'),
      geometries: num('geometries'),
      textures: num('textures'),
      programs: num('programs'),
    }
  })

const preview = await startPreview(4177)
try {
  for (const [label, viewport] of VIEWPORTS) {
    // A fresh browser per size, so memory and caches from one do not colour the next.
    const browser = await launchBrowser()
    try {
      const page = await browser.newPage()
      await page.setViewport(viewport)
      await page.setCacheEnabled(false)

      // Transfer sizes as sent over the wire, by kind.
      const cdp = await page.createCDPSession()
      await cdp.send('Network.enable')
      const urls = new Map()
      const bytes = []
      cdp.on('Network.responseReceived', (e) => urls.set(e.requestId, e.response.url))
      cdp.on('Network.loadingFinished', (e) => {
        const url = urls.get(e.requestId) ?? ''
        bytes.push({ url, size: e.encodedDataLength })
      })
      const sum = (test) => bytes.filter((b) => test(b.url)).reduce((n, b) => n + b.size, 0)
      const snapshot = () => ({
        total: sum(() => true),
        js: sum((u) => u.endsWith('.js')),
        three: sum((u) => /\/assets\/three-/.test(u)),
        css: sum((u) => u.endsWith('.css')),
        images: sum((u) => /\.(avif|webp|png|jpe?g|svg)$/.test(u)),
      })

      const started = Date.now()
      await page.goto(`${preview.base}/?debug=1`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      })
      let firstFrame = null
      while (Date.now() - started < 30_000) {
        if ((await overlay(page)).fps > 0) {
          firstFrame = Date.now() - started
          break
        }
        await sleep(100)
      }
      await page.waitForNetworkIdle({ idleTime: 1000, timeout: 60_000 }).catch(() => {})
      const initial = snapshot()

      const rows = []
      for (const id of STOPS) {
        await page.evaluate((id) => {
          const r = document.getElementById(id).getBoundingClientRect()
          window.scrollTo(0, Math.max(0, r.top + scrollY + r.height / 2 - innerHeight / 2))
        }, id)
        await sleep(3000)
        const stats = await overlay(page)
        const heap = await page.evaluate(() => performance.memory?.usedJSHeapSize ?? 0)
        const layer = await page.evaluate(
          () => document.querySelector('[data-debug-layer]')?.textContent ?? '',
        )
        rows.push({ id, layer, ...stats, heap })
      }
      const journey = snapshot()

      console.log(`\n## ${label}\n`)
      console.log(`First frame: ${firstFrame === null ? 'none within 30 s' : `${firstFrame} ms`}`)
      console.log(
        `Downloaded on load: ${kb(initial.total)} (JS ${kb(initial.js)}, of which three.js ${kb(initial.three)}; CSS ${kb(initial.css)}; images ${kb(initial.images)})`,
      )
      console.log(
        `Downloaded after the whole journey: ${kb(journey.total)} (images ${kb(journey.images)})\n`,
      )
      console.log(
        '| Stop | Layer | Draw calls | Triangles | Geometries | Textures | Programs | JS heap | Frame ms* |',
      )
      console.log('|---|---|---|---|---|---|---|---|---|')
      for (const r of rows) {
        console.log(
          `| ${r.id} | ${r.layer} | ${r.calls} | ${r.tris.toLocaleString('en')} | ${r.geometries} | ${r.textures} | ${r.programs} | ${(r.heap / 1048576).toFixed(0)} MB | ${r.ms} |`,
        )
      }
    } finally {
      await closeBrowser(browser)
    }
  }
  console.log('\n\\* Software rendering: frame time is not representative of a real device.')
} finally {
  preview.stop()
}
