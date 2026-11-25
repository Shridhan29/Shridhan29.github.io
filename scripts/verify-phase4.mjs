/**
 * Phase 4 acceptance checks — quality tiers and the effects they gate.
 *
 *   npm run verify:phase4
 *
 * Source invariants, then each tier forced in a real browser (`?tier=`) and
 * scrolled through every layer: the right effects run, and only on the tiers
 * that can afford them. Requires a production build in dist/ and Chrome.
 */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import { eagerAssets } from './lib/bundle.mjs'
import {
  PHONE,
  closeBrowser,
  createReport,
  launchBrowser,
  sleep,
  startPreview,
} from './lib/harness.mjs'

const { check, section, finish } = createReport()

const MAX_CALLS = 120
/** What each tier must run. `postfx`: 0 none, 1 bloom only, 2 the full stack. */
const EXPECT = {
  low: { postfx: 0, glass: 0, packets: 8, particles: 8000 },
  medium: { postfx: 1, glass: 0, packets: 14, particles: 25000 },
  high: { postfx: 2, glass: 1, packets: 20, particles: 60000 },
}
/** Every stop on the journey: the hero, then each staged layer's stage. */
const STOPS = [
  { name: 'Orbit', article: 'top', stage: null },
  { name: 'Device', article: 'truuna', stage: 'device' },
  { name: 'Surface', article: 'aashman', stage: 'surface' },
  { name: 'Ground', article: 'dms', stage: 'ground-kiosk' },
  { name: 'Core', article: 'about', stage: 'core' },
  { name: 'Cloud', article: 'experience', stage: 'cloud' },
]

// ---------------------------------------------------------------- source --

section('Source invariants')

const read = (f) => readFile(f, 'utf8')
const store = await read('src/store/useQualityStore.ts')
check(
  'the quality store is three-free, so the DOM can read it without the 3D chunk',
  !/from ['"]three['"]|@react-three/.test(store),
)

const effects = await read('src/canvas/Effects.tsx')
check('Low tier mounts no composer', /if \(tier === 'low'\) return null/.test(effects))
const thresholds = [...effects.matchAll(/luminanceThreshold=\{([0-9.]+)\}/g)].map((m) => +m[1])
check(
  'bloom is selective by brightness: threshold ≥ 1, so no screenshot can bloom',
  thresholds.length > 0 && thresholds.every((t) => t >= 1),
  thresholds.join(', '),
)
check(
  'tone mapping is re-applied after the composer, and with a colour-preserving curve',
  /ToneMappingMode\.NEUTRAL/.test(effects),
)

const surface = await read('src/canvas/layers/Surface.tsx')
check(
  'glass (transmission) is gated to the High tier',
  /transmission=/.test(surface) && /s\.tier === 'high'/.test(surface),
)
const layerSources = await Promise.all(
  ['Orbit', 'Device', 'Ground', 'Core', 'Cloud'].map((n) => read(`src/canvas/layers/${n}.tsx`)),
)
check(
  'no other layer uses transmission',
  layerSources.every((s) => !/transmission/.test(s)),
)

const name = await read('src/canvas/shared/NameField.tsx')
check(
  'the particle name is one Points buffer, morphed on the GPU',
  (name.match(/<points\b/g) ?? []).length === 1 &&
    /uMorph/.test(name) &&
    /mix\(position, aScatter/.test(name),
)
const sequence = await read('src/canvas/shared/ScreenSequence.tsx')
const device = await read('src/canvas/layers/Device.tsx')
check(
  'L1: the phone screen spills light onto its glass',
  /spill=\{/.test(device) && /uReach/.test(sequence),
)
const ground = await read('src/canvas/layers/Ground.tsx')
check(
  'L3: warm practicals, faked — two light pools and no real-time light',
  (ground.match(/rotation=\{\[-Math\.PI \/ 2, 0, 0\]\}/g) ?? []).length === 2 &&
    !/(Point|Spot|RectArea|Directional)Light|<(point|spot|rectArea|directional)Light/.test(ground),
)

const eager = await eagerAssets()
const eagerCode = (
  await Promise.all(
    [...eager].filter((f) => f.endsWith('.js')).map((f) => read(join('dist', 'assets', f))),
  )
).join('\n')
check(
  'post-processing stays out of the first-visit bundle',
  !/BloomEffect|EffectComposer|KawaseBlur/.test(eagerCode),
)

const lighting = await read('src/canvas/Lighting.tsx')
const moods = await read('src/canvas/moods.ts')
const layerData = await read('src/canvas/layers.ts')
check(
  '4.9: one mood per layer',
  (moods.match(/\{ sky: '#/g) ?? []).length === (layerData.match(/^ {4}id: '/gm) ?? []).length,
)
check(
  '4.9: the sky is a clear colour, not a background mesh (no draw call)',
  /scene\.background = sky/.test(lighting) && /const sky = new Color\(\)/.test(lighting),
)
check(
  '4.9: every studio is baked at 64 px, so swapping one never recompiles a shader',
  /fromScene\(studio, 0, 0\.1, 20, \{ size: 64 \}\)/.test(lighting) &&
    (lighting.match(/fromScene\(/g) ?? []).length === 1,
)

// --------------------------------------------------------------- runtime --

/** Reads the ?debug=1 overlay as name → value. */
const overlay = (page) =>
  page.evaluate(() => {
    const el = document.querySelector('[data-debug]')
    const out = { tier: el?.querySelector('[data-debug-tier]')?.getAttribute('data-debug-tier') }
    out.source = /tier \w+ \((\w+)\)/.exec(el?.textContent ?? '')?.[1]
    for (const line of el?.innerText.split('\n') ?? []) {
      const m = /^(\w+) ([0-9.,]+)$/.exec(line.trim())
      if (m) out[m[1]] = Number(m[2].replace(/,/g, ''))
    }
    return out
  })

const scrollTo = (page, { article, stage }) =>
  page.evaluate(
    (article, stage) => {
      if (article === 'top') return window.scrollTo(0, 0)
      const el =
        (stage && document.querySelector(`[data-stage="${stage}"]`)) ||
        document.getElementById(article)
      const r = el.getBoundingClientRect()
      window.scrollTo(0, r.top + scrollY + r.height / 2 - innerHeight / 2)
    },
    article,
    stage,
  )

/** CIE L*a*b* of an sRGB colour. */
function lab([r, g, b]) {
  const lin = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const [R, G, B] = [lin(r), lin(g), lin(b)]
  const f = (v) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116)
  const X = f((R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047)
  const Y = f(R * 0.2126 + G * 0.7152 + B * 0.0722)
  const Z = f((R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883)
  return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)]
}
const deltaE = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

/** Mean colour of what the scene draws, with the page's text and chrome hidden. */
async function sceneColour(page) {
  const style = await page.addStyleTag({
    content: 'main, header, footer, nav, [data-debug] { visibility: hidden !important }',
  })
  await sleep(400)
  const shot = await page.screenshot()
  await style.evaluate((el) => el.remove())
  const { channels } = await sharp(shot).stats()
  return lab(channels.slice(0, 3).map((c) => c.mean))
}

const preview = await startPreview(4176)
let browser
try {
  for (const tier of ['low', 'medium', 'high']) {
    section(`Tier: ${tier}`)
    // A fresh browser per tier: software GL holds GPU memory across loads.
    await closeBrowser(browser)
    browser = await launchBrowser()
    const page = await browser.newPage()
    const errors = []
    const failed = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    page.on('requestfailed', (r) => failed.push(r.url()))
    await page.setViewport({ width: 1440, height: 900 })
    await page.goto(`${preview.base}/?debug=1&tier=${tier}`, {
      waitUntil: 'networkidle0',
      timeout: 60_000,
    })
    const want = EXPECT[tier]

    // The name forms at the top of the page and disperses as the hero scrolls out.
    const morphs = []
    for (const y of [0, 200, 900]) {
      await page.evaluate((y) => window.scrollTo(0, y), y)
      await sleep(tier === 'high' ? 4000 : 2500)
      const o = await overlay(page)
      morphs.push(o.nameMorph)
      if (y === 0) {
        check(
          `${tier}: the name holds ${want.particles} particles`,
          o.nameParticles === want.particles,
          `${o.nameParticles}`,
        )
      }
    }
    check(
      `${tier}: the name is formed at the top and dispersed past the hero`,
      morphs[0] === 0 && morphs[1] > 0 && morphs[1] < 100 && morphs[2] === 100,
      morphs.join(' → '),
    )

    const seen = {}
    let maxCalls = 0
    let frames = true
    let slowest = 0
    for (const stop of STOPS) {
      await scrollTo(page, stop)
      // Long enough for a staged layer to mount and compile under software GL.
      await sleep(tier === 'high' ? 7000 : 5000)
      const o = await overlay(page)
      Object.assign(seen, o)
      maxCalls = Math.max(maxCalls, o.calls ?? 0)
      // Frame time, not fps: software GL on High renders a frame in over a second,
      // and the rounded fps then reads 0 although frames are arriving.
      if (!(o.ms > 0)) frames = false
      slowest = Math.max(slowest, o.ms ?? 0)
    }

    check(`${tier}: the forced tier is applied`, seen.tier === tier && seen.source === 'override')
    check(
      `${tier}: post-processing matches the tier`,
      seen.postfx === want.postfx,
      `postfx ${seen.postfx}`,
    )
    check(
      `${tier}: glass only where the tier allows it`,
      seen.glass === want.glass,
      `glass ${seen.glass}`,
    )
    check(
      `${tier}: packet count scales with the tier`,
      seen.packetCount === want.packets,
      `${seen.packetCount} packets`,
    )
    check(`${tier}: the render loop runs at every stop`, frames, `slowest frame ${slowest} ms`)
    check(
      `${tier}: draw calls within budget at every stop`,
      maxCalls > 0 && maxCalls <= MAX_CALLS,
      `max ${maxCalls}`,
    )
    check(`${tier}: no page or console errors`, !errors.length, errors.slice(0, 2).join(' | '))
    check(`${tier}: no failed requests`, !failed.length, failed.slice(0, 2).join(', '))
    await page.close()
  }

  section('Palette (4.9)')
  {
    // Low tier: no bloom or vignette, so the colour measured is the mood's own.
    await closeBrowser(browser)
    browser = await launchBrowser()
    const page = await browser.newPage()
    await page.setViewport({ width: 1440, height: 900 })
    await page.goto(`${preview.base}/?debug=1&tier=low`, {
      waitUntil: 'networkidle0',
      timeout: 60_000,
    })
    // Ground is measured at its first stage: the kiosk sits low in the DMS
    // article, where the camera has already handed over to Core.
    const stops = STOPS.map((s) => (s.name === 'Ground' ? { ...s, stage: 'ground-pos' } : s))
    const colours = []
    const settled = []
    for (const [i, stop] of stops.entries()) {
      await scrollTo(page, stop)
      await sleep(6000)
      const o = await overlay(page)
      settled.push(o.palette)
      if (Math.abs((o.palette ?? -1) - i) > 0.05) continue
      colours.push({ name: stop.name, lab: await sceneColour(page) })
    }
    check(
      'the mood settles on each layer while its article is read',
      settled.every((v, i) => Math.abs((v ?? -1) - i) <= 0.05),
      settled.join(', '),
    )
    const gaps = colours.slice(1).map((c, i) => ({
      pair: `${colours[i].name}→${c.name}`,
      d: deltaE(colours[i].lab, c.lab),
    }))
    check(
      'neighbouring layers look different: scene colour ΔE ≥ 8',
      colours.length === stops.length && gaps.every((g) => g.d >= 8),
      gaps.map((g) => `${g.pair} ${g.d.toFixed(1)}`).join(', '),
    )

    // The hand-over is a blend, never a cut: going from Device to Surface the
    // mood passes through the values in between, in order.
    await scrollTo(page, stops[1])
    await sleep(5000)
    await scrollTo(page, stops[2])
    const path = []
    for (let i = 0; i < 24; i++) {
      await sleep(150)
      path.push((await overlay(page)).palette)
    }
    const between = path.filter((v) => v > 1.02 && v < 1.98)
    check(
      'between layers the mood blends, with no jump',
      between.length >= 2 && path.every((v, i) => i === 0 || v >= path[i - 1] - 0.001),
      path.join(' → '),
    )
    await page.close()
  }

  section('Tier selection')
  {
    await closeBrowser(browser)
    browser = await launchBrowser()
    const open = async (query, viewport = { width: 1440, height: 900 }, setup) => {
      const page = await browser.newPage()
      await page.setViewport(viewport)
      if (setup) await page.evaluateOnNewDocument(setup)
      await page.goto(`${preview.base}/?debug=1${query}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      })
      await page.waitForSelector('[data-debug-tier]', { timeout: 30_000 })
      const o = await overlay(page)
      await page.close()
      return o
    }

    const detected = await open('')
    check('with no override the tier is detected', detected.source === 'detected', detected.tier)

    const bogus = await open('&tier=ultra')
    check('an unknown ?tier= falls back to detection', bogus.source === 'detected', bogus.tier)

    const saved = await open('', undefined, () => {
      try {
        localStorage.setItem('quality-tier', 'low')
      } catch {}
    })
    check('a saved choice is honoured', saved.tier === 'low' && saved.source === 'override')

    const blocked = await open('', undefined, () => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('blocked', 'SecurityError')
        },
      })
    })
    check('blocked storage does not break detection', blocked.source === 'detected', blocked.tier)
  }

  section('Phones get the Static tier (D12)')
  {
    /** Loads the page and reports whether 3D ran: a canvas, and the three.js chunk fetched. */
    const probe = async (viewport) => {
      const page = await browser.newPage()
      const scripts = []
      page.on('request', (r) => r.resourceType() === 'script' && scripts.push(r.url()))
      await page.setViewport(viewport)
      await page.goto(`${preview.base}/`, { waitUntil: 'networkidle0', timeout: 60_000 })
      await sleep(1500)
      const canvas = await page.evaluate(() => !!document.querySelector('canvas'))
      await page.close()
      return { canvas, three: scripts.some((u) => /\/three-[^/]+\.js$/.test(u)) }
    }

    const phone = await probe(PHONE)
    check('phone: no canvas', !phone.canvas)
    check('phone: three.js is never downloaded', !phone.three)

    // A touch tablet wide enough for the stages keeps the scene.
    const tablet = await probe({ width: 1180, height: 820, isMobile: true, hasTouch: true })
    check('touch tablet at ≥ 1024 px: the scene still runs', tablet.canvas && tablet.three)

    const phonePage = await browser.newPage()
    await phonePage.setViewport(PHONE)
    await phonePage.goto(`${preview.base}/`, { waitUntil: 'networkidle0', timeout: 60_000 })
    check(
      'phone: no graphics toggle (there is nothing to choose)',
      !(await phonePage.$('[data-graphics-toggle]')),
    )
    await phonePage.close()
  }

  section('No WebGL: the Static page (6.3)')
  {
    await closeBrowser(browser)
    browser = await launchBrowser(['--disable-webgl', '--disable-3d-apis'])
    const page = await browser.newPage()
    const errors = []
    const scripts = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    page.on('request', (r) => r.resourceType() === 'script' && scripts.push(r.url()))
    await page.setViewport({ width: 1440, height: 900 })
    await page.goto(`${preview.base}/`, { waitUntil: 'networkidle0', timeout: 60_000 })
    await sleep(1500)
    const view = await page.evaluate(() => ({
      webgl: !!document.createElement('canvas').getContext('webgl2'),
      canvas: !!document.querySelector('canvas'),
      toggle: !!document.querySelector('[data-graphics-toggle]'),
      text: document.querySelector('main')?.innerText.length ?? 0,
    }))
    check('the browser really has no WebGL', !view.webgl)
    check('no WebGL: no canvas', !view.canvas)
    check(
      'no WebGL: three.js is never downloaded',
      !scripts.some((u) => /\/three-[^/]+\.js$/.test(u)),
    )
    check('no WebGL: no graphics toggle', !view.toggle)
    check('no WebGL: all the content is there', view.text > 2000, `${view.text} characters`)
    check('no WebGL: no page or console errors', !errors.length, errors.slice(0, 2).join(' | '))
    await page.close()
  }

  section('Graphics toggle (6.1)')
  {
    await closeBrowser(browser)
    browser = await launchBrowser()
    const page = await browser.newPage()
    await page.setViewport({ width: 1440, height: 900 })
    await page.goto(`${preview.base}/?debug=1`, { waitUntil: 'networkidle0', timeout: 60_000 })
    const select = '[data-graphics-toggle]'
    check(
      'the footer offers a graphics toggle, on Automatic',
      (await page.$eval(select, (el) => el.value).catch(() => null)) === 'auto',
    )

    await page.select(select, 'low')
    await sleep(500)
    const low = await overlay(page)
    const saved = await page.evaluate(() => localStorage.getItem('quality-tier'))
    check(
      'choosing Low applies it at once and saves it',
      low.tier === 'low' && low.source === 'override' && saved === 'low',
      `${low.tier} (${low.source}), saved ${saved}`,
    )

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.select(select, 'static'),
    ])
    await sleep(1000)
    check(
      'choosing Off reloads into the 2D page: no canvas',
      !(await page.$('canvas')) && (await page.$eval(select, (el) => el.value)) === 'static',
    )

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.select(select, 'auto'),
    ])
    await sleep(1500)
    check(
      'choosing Automatic again brings the scene back',
      !!(await page.$('canvas')) &&
        (await page.evaluate(() => localStorage.getItem('quality-tier'))) === null,
    )
    await page.close()
  }

  section('Auto-downgrade (6.2)')
  {
    // Software GL renders a few frames a second, far below any bound, so a
    // detected tier must step down; a forced one must not.
    await closeBrowser(browser)
    browser = await launchBrowser()
    const watch = async (query) => {
      const page = await browser.newPage()
      await page.setViewport({ width: 1440, height: 900 })
      await page.goto(`${preview.base}/?debug=1${query}`, {
        waitUntil: 'networkidle0',
        timeout: 60_000,
      })
      const start = await overlay(page)
      await sleep(20_000)
      const end = await overlay(page)
      await page.close()
      return { start, end }
    }

    const detected = await watch('')
    check(
      'a detected tier steps down when the frame rate cannot hold',
      detected.end.source === 'auto' && (detected.end.downgrades ?? 0) >= 1,
      `${detected.start.tier} → ${detected.end.tier} (${detected.end.source}), ${detected.end.downgrades ?? 0} step(s)`,
    )
    const forced = await watch('&tier=high')
    check(
      'a forced tier is never stepped down',
      forced.end.tier === 'high' && forced.end.source === 'override' && !forced.end.downgrades,
      `${forced.end.tier} (${forced.end.source})`,
    )
  }
} catch (err) {
  check('runtime suite ran', false, err instanceof Error ? err.message : String(err))
} finally {
  await closeBrowser(browser)
  preview.stop()
}

finish('Phase 4 verified.')
