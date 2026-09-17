/**
 * Phase 2 acceptance checks.
 *
 * Two halves. The static half reads the build output and the source, and catches
 * the class of bug that hid twice already: something importing `three` into the
 * eager graph so the lazily-loaded Canvas is downloaded on first paint anyway.
 * The runtime half drives a real browser, because every interesting claim here —
 * the camera moves, distant layers stop rendering, the loop actually runs — is
 * only true at runtime and cannot be read off the source.
 *
 *   npm run verify:phase2
 *
 * Requires a production build in dist/ and Chrome or Chromium on the system.
 * Set CHROME_PATH to use a browser outside the usual install locations.
 */
import { readFile, readdir } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'
import { NAV, PHONE, createReport, launchBrowser, startPreview } from './lib/harness.mjs'

const { check, section, finish } = createReport()

// ---------------------------------------------------------------- static ----

section('Bundle graph')

const html = await readFile('dist/index.html', 'utf8')
const eager = new Set([...html.matchAll(/\/assets\/([^"']+)/g)].map((m) => m[1]))
const assets = await readdir('dist/assets')

const gz = async (f) => gzipSync(await readFile(join('dist/assets', f))).length / 1024
let entryKb = 0
let lazyKb = 0
for (const f of assets) {
  if (!f.endsWith('.js') && !f.endsWith('.css')) continue
  const kb = await gz(f)
  if (eager.has(f)) entryKb += kb
  else lazyKb += kb
}

const threeChunk = assets.find((f) => f.startsWith('three-') && f.endsWith('.js'))
check('a three chunk exists', !!threeChunk, threeChunk ?? '')
check(
  'three is NOT loaded on first paint',
  !!threeChunk && !eager.has(threeChunk),
  threeChunk && eager.has(threeChunk) ? 'it is in index.html — the lazy Canvas is defeated' : '',
)
check('entry bundle within 180 KB gzip', entryKb <= 180, `${entryKb.toFixed(1)} KB`)
check('lazy chunks within 600 KB gzip', lazyKb <= 600, `${lazyKb.toFixed(1)} KB`)

section('Source invariants')

const layers = await readFile('src/canvas/layers.ts', 'utf8')
check(
  'layer data imports no three (keeps it out of the entry graph)',
  !/from ['"]three['"]/.test(layers),
)

const store = await readFile('src/store/useScrollStore.ts', 'utf8')
check('store reads layer data, not the curve module', !/canvas\/curve/.test(store))

const scene = await readFile('src/canvas/Scene.tsx', 'utf8')
check('exactly one <Canvas> in the scene', (scene.match(/<Canvas/g) ?? []).length === 1)
check('canvas is aria-hidden', /aria-hidden="true"/.test(scene))
check('DPR is clamped', /dpr=\{\[1, 2\]\}/.test(scene))

const app = await readFile('src/App.tsx', 'utf8')
// The tier decision moved out of App so sections can read it too.
const tier = await readFile('src/tier.ts', 'utf8')
check('Scene is lazily imported', /lazy\(\(\) => import\('@\/canvas\/Scene'\)\)/.test(app))
check(
  'render is guarded on WebGL2',
  /getContext\('webgl2'\)/.test(tier) && /CAN_RENDER_3D/.test(app),
)
check('render is guarded on prefers-reduced-motion', /prefers-reduced-motion: reduce/.test(tier))

const rig = await readFile('src/canvas/CameraRig.tsx', 'utf8')
check('camera progress is damped, not snapped', /MathUtils\.damp/.test(rig))

// --------------------------------------------------------------- runtime ----

section('Runtime (real browser)')

let browser
let preview
try {
  preview = await startPreview(4199)
  const BASE = preview.base
  browser = await launchBrowser()

  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 800 })
  await page.goto(`${BASE}/?debug=1`, NAV)

  const hasWebGL = await page.evaluate(
    () => !!document.createElement('canvas').getContext('webgl2'),
  )
  check('browser reports WebGL2', hasWebGL)

  await page.waitForSelector('canvas', { timeout: 10_000 }).catch(() => {})
  check('canvas mounted', (await page.$$('canvas')).length === 1)
  check('exactly one canvas element', (await page.$$('canvas')).length === 1)
  check('layer nav rendered', !!(await page.$('nav[aria-label="Layers"]')))

  // Give the render loop real wall-clock time to produce frames.
  await new Promise((r) => setTimeout(r, 1500))

  const readOverlay = () =>
    page.evaluate(() => {
      // Scoped to the overlay: the layer-nav renders every label as sr-only
      // text, so reading document.body would always match the first layer.
      const text = document.querySelector('[data-debug]')?.textContent ?? ''
      const num = (label) => {
        const m = new RegExp(`${label}\\s+([0-9.,]+)`).exec(text)
        return m ? Number(m[1].replace(/,/g, '')) : null
      }
      return { fps: num('fps'), calls: num('calls'), tris: num('tris'), progress: num('progress') }
    })

  const idle = await readOverlay()
  check('render loop is producing frames', (idle.fps ?? 0) > 0, `fps ${idle.fps}`)
  check('geometry is being drawn', (idle.calls ?? 0) > 0, `calls ${idle.calls}`)
  check('triangles are being submitted', (idle.tris ?? 0) > 0, `tris ${idle.tris}`)

  // Scroll changes progress, and progress moves the camera.
  const cameraAt = async (p) => {
    await page.goto(`${BASE}/?debug=1&p=${p}`, NAV)
    await new Promise((r) => setTimeout(r, 1200))
    return page.evaluate(() => ({
      label: document.querySelector('[data-debug-layer]')?.textContent ?? null,
      el: !!document.querySelector('canvas'),
    }))
  }

  const top = await cameraAt(0)
  const mid = await cameraAt(0.5)
  const bottom = await cameraAt(1)
  check('progress 0 selects the first layer', top.label === 'L0 · Orbit', top.label ?? 'none')
  check('progress 1 selects the last layer', bottom.label === 'L5 · Cloud', bottom.label ?? 'none')
  check(
    'mid progress selects an interior layer',
    mid.label !== top.label && mid.label !== bottom.label,
    mid.label ?? 'none',
  )

  // Draw calls per frame stay within budget along the real journey. Sampled at
  // real scroll positions — the top, then each article centred — because staged
  // layers draw into their article's stage: pinning the camera with ?p= while
  // the page sits at the top shows a layer whose stage is off screen, which
  // correctly draws nothing. A zero reading counts as not measured.
  await page.goto(`${BASE}/?debug=1`, NAV)
  const samples = []
  for (const id of ['top', 'truuna', 'aashman', 'dms', 'urja', 'about', 'experience']) {
    await page.evaluate((id) => {
      const el = document.getElementById(id)
      const r = el.getBoundingClientRect()
      window.scrollTo(0, Math.max(0, r.top + scrollY + r.height / 2 - innerHeight / 2))
    }, id)
    await new Promise((r) => setTimeout(r, 1800))
    samples.push([id, (await readOverlay()).calls])
  }
  check(
    'draw calls per frame stay within budget along the journey',
    samples.every(([, calls]) => (calls ?? 0) > 0 && calls <= 120),
    samples.map(([id, calls]) => `${id} ${calls}`).join(', '),
  )

  // Real scrolling must drive progress, not just the ?p= override.
  await page.goto(`${BASE}/?debug=1`, NAV)
  await new Promise((r) => setTimeout(r, 800))
  const before = (await readOverlay()).progress
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.6))
  await new Promise((r) => setTimeout(r, 1500))
  const after = (await readOverlay()).progress
  check('scrolling advances progress', (after ?? 0) > (before ?? 0) + 0.05, `${before} → ${after}`)

  // Each layer arrives with its content: scrolled to an article, the camera is
  // at that article's layer. Pairs come from layers.ts, so this follows the data.
  const layerSrc = await readFile('src/canvas/layers.ts', 'utf8')
  const pairs = [...layerSrc.matchAll(/label: '([^']+)'[\s\S]*?section: '([^']+)'/g)].map((m) => ({
    label: m[1],
    section: m[2],
  }))
  for (const [name, viewport] of [
    ['1440 px', { width: 1440, height: 900 }],
    ['phone', PHONE],
  ]) {
    const synced = await browser.newPage()
    await synced.setViewport(viewport)
    await synced.goto(`${BASE}/?debug=1`, NAV)
    const misses = []
    for (const { label, section: id } of pairs) {
      await synced.evaluate((id) => {
        const el = document.getElementById(id)
        const top = el.getBoundingClientRect().top + scrollY
        // Where stops.ts places the arrival, a little past it to be inside the range.
        window.scrollTo(0, Math.max(0, top - innerHeight * 0.25 + 2))
      }, id)
      await new Promise((r) => setTimeout(r, 900))
      const shown = await synced.evaluate(
        () => document.querySelector('[data-debug-layer]')?.textContent ?? '',
      )
      if (shown !== label) misses.push(`#${id} showed ${shown || 'nothing'}, expected ${label}`)
    }
    check(`${name}: each layer arrives with its content`, !misses.length, misses.join('; '))
    await synced.close()
  }

  // The Static tier: no WebGL means no canvas, and the content is still there.
  const plain = await browser.newPage()
  await plain.evaluateOnNewDocument(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      if (String(type).startsWith('webgl')) return null
      return original.call(this, type, ...rest)
    }
  })
  await plain.goto(BASE, NAV)
  await new Promise((r) => setTimeout(r, 600))
  check('no WebGL: canvas is not mounted', (await plain.$$('canvas')).length === 0)
  const staticText = await plain.evaluate(() => document.body.innerText)
  check('no WebGL: hero copy still present', staticText.includes('I ship software'))
  check(
    'no WebGL: every project still listed',
    ['TRUUNA', 'Aashman Technicals', 'DMS', 'Urja'].every((n) => staticText.includes(n)),
  )
  check('no WebGL: contact form still present', !!(await plain.$('form')))

  // Phones: the page must not be wider than the screen. Emulated as a real
  // mobile viewport, because a desktop window at 390 px hides this — body's
  // overflow-x clips it there, while a phone widens the layout and zooms out.
  for (const [tier, motion] of [
    ['3D', 'no-preference'],
    ['static', 'reduce'],
  ]) {
    const phone = await browser.newPage()
    await phone.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: motion }])
    await phone.setViewport(PHONE)
    await phone.goto(BASE, NAV)
    await new Promise((r) => setTimeout(r, 600))
    const width = await phone.evaluate(() => document.documentElement.scrollWidth)
    check(`phone (390 px, ${tier}): no horizontal overflow`, width <= 390, `page width ${width}`)
    await phone.close()
  }
} catch (err) {
  check('runtime suite ran', false, err instanceof Error ? err.message : String(err))
} finally {
  await browser?.close()
  preview?.stop()
}

finish('Phase 2 verified.')
