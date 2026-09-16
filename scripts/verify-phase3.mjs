/**
 * Phase 3 acceptance checks — the real layers, as they land.
 *
 *   npm run verify:phase3
 *
 * Covers L0 · Orbit so far. Requires a production build in dist/ and Chrome.
 */
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import { PHONE, createReport, launchBrowser, sleep, startPreview } from './lib/harness.mjs'

const { check, section, finish } = createReport()

/** Software GL is slow; this is generous. The environment-map regression it guards took 6–15 s. */
const FIRST_FRAME_MS = 5000
const MAX_ENV_PX = 64
const AA_CONTRAST = 4.5

// ---------------------------------------------------------------- source --

section('Source invariants')

const layerDir = 'src/canvas/layers'
const layerFiles = (await readdir(layerDir)).filter((f) => f.endsWith('.tsx'))
const ungated = []
for (const f of layerFiles) {
  const src = await readFile(join(layerDir, f), 'utf8')
  if (!/useLayerFrame\(/.test(src) || /\buseFrame\(/.test(src)) ungated.push(f)
}
check(
  'every layer is visibility-gated through useLayerFrame (3.7)',
  !ungated.length,
  ungated.join(', '),
)

const walk = async (dir) =>
  (await readdir(dir, { withFileTypes: true })).flatMap((e) =>
    e.isDirectory() ? [] : [join(dir, e.name)],
  )
const sources = [...(await walk('src/canvas')), ...(await walk(layerDir))].filter((f) =>
  /\.tsx?$/.test(f),
)
const loaders = []
for (const f of sources) {
  const src = await readFile(f, 'utf8')
  if (/\b(RGBELoader|HDRLoader|EXRLoader|Environment|useEnvironment)\b/.test(src)) loaders.push(f)
}
check('lighting loads no image files (D9)', !loaders.length, loaders.join(', '))

const lighting = await readFile('src/canvas/Lighting.tsx', 'utf8')
const envSize = Number(/fromScene\([^)]*size:\s*(\d+)/s.exec(lighting)?.[1] ?? NaN)
check(
  `environment map is at most ${MAX_ENV_PX} px (larger stalled the first frame)`,
  envSize <= MAX_ENV_PX,
  `${envSize} px`,
)

// --------------------------------------------------------------- runtime --

section('L0 · Orbit in a real browser')

/** Reads the ?debug=1 overlay. */
const overlay = (page) =>
  page.evaluate(() => {
    const text = document.querySelector('[data-debug]')?.textContent ?? ''
    const num = (label) => Number(new RegExp(`${label}\\s+([0-9.,]+)`).exec(text)?.[1] ?? 0)
    return { fps: num('fps'), calls: num('calls') }
  })

/** Opens the top of the page and waits for the render loop to report frames. */
async function openTop(browser, base, viewport) {
  const page = await browser.newPage()
  const errors = []
  const external = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('request', (r) => !r.url().startsWith(base) && external.push(r.url()))
  await page.setViewport(viewport)
  const started = Date.now()
  await page.goto(`${base}/?p=0&debug=1`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  let firstFrame = null
  while (Date.now() - started < 25_000) {
    if ((await overlay(page)).fps > 0) {
      firstFrame = Date.now() - started
      break
    }
    await sleep(100)
  }
  // Let the monolith ease into its measured place and the stats settle.
  await sleep(2500)
  return { page, errors, external, firstFrame }
}

/** WCAG relative luminance of an sRGB colour, components 0–255. */
const luminance = ([r, g, b]) => {
  const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)

/**
 * Contrast of the hero and header text as rendered over the live canvas. Two screenshots:
 * one as the visitor sees it, one with the text made transparent (its scrim
 * stays). For each line box, the background is the 98th-percentile pixel of the
 * second — so one star behind a glyph does not decide it, anything larger does
 * — and the text colour is the pixel that changed most between the two, the
 * solid core of a glyph. Measuring pixels, not CSS, means translucent colours,
 * oklab() tokens and the canvas beneath are all accounted for.
 */
async function worstHeroContrast(page) {
  // The ?debug=1 stats panel sits over the bottom-left of the hero; measured with
  // it in place, the text beneath it cannot change between the two shots.
  await page.evaluate(() => document.querySelector('[data-debug]')?.remove())
  const lines = await page.evaluate(() => {
    const out = []
    const range = document.createRange()
    // Text is over the canvas unless some element between it and its region has
    // its own background — a filled button does; an outline button, a text link
    // and the unscrolled header do not.
    const onOwnGround = (el, stop) => {
      for (let e = el; e && e !== stop; e = e.parentElement) {
        if (getComputedStyle(e).backgroundColor !== 'rgba(0, 0, 0, 0)') return true
      }
      return false
    }
    for (const region of document.querySelectorAll('#top, header')) {
      const walker = document.createTreeWalker(region, NodeFilter.SHOW_TEXT)
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (!n.textContent.trim() || onOwnGround(n.parentElement, region)) continue
        // Decorative text is not read, and logotypes are exempt from WCAG contrast.
        if (n.parentElement.closest('[aria-hidden="true"]')) continue
        range.selectNodeContents(n)
        for (const r of range.getClientRects()) {
          if (r.width < 4 || r.height < 4) continue
          // Only lines fully on screen: a clipped line would be judged by its empty edge.
          if (r.top < 0 || r.bottom > innerHeight || r.left < 0 || r.right > innerWidth) continue
          out.push({
            text: n.textContent.trim().slice(0, 32),
            x: r.x,
            y: r.y,
            w: r.width,
            h: r.height,
          })
        }
      }
    }
    return out
  })
  const grab = async () =>
    sharp(await page.screenshot())
      .raw()
      .toBuffer({ resolveWithObject: true })
  const withText = await grab()
  await page.addStyleTag({
    content:
      '#top, #top *, header, header * { color: transparent !important; text-decoration-color: transparent !important }' +
      ' #top img { visibility: hidden }',
  })
  await sleep(300)
  const without = await grab()
  const dpr = await page.evaluate(() => devicePixelRatio)
  const { width, height, channels } = without.info
  const pixel = (buf, x, y) => {
    const i = (y * width + x) * channels
    return [buf[i], buf[i + 1], buf[i + 2]]
  }

  let worst = { value: Infinity, text: '' }
  for (const line of lines) {
    const x0 = Math.max(0, Math.floor(line.x * dpr))
    const y0 = Math.max(0, Math.floor(line.y * dpr))
    const x1 = Math.min(width, Math.ceil((line.x + line.w) * dpr))
    const y1 = Math.min(height, Math.ceil((line.y + line.h) * dpr))
    const bgs = []
    let fg = null
    let most = 0
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const bgPx = pixel(without.data, x, y)
        const lb = luminance(bgPx)
        bgs.push(lb)
        const change = Math.abs(luminance(pixel(withText.data, x, y)) - lb)
        if (change > most) {
          most = change
          fg = luminance(pixel(withText.data, x, y))
        }
      }
    }
    if (fg === null || !bgs.length) continue
    bgs.sort((a, b) => a - b)
    const value = ratio(fg, bgs[Math.floor((bgs.length - 1) * 0.98)])
    if (value < worst.value) worst = { value, text: line.text }
  }
  return worst
}

let browser
let preview
try {
  preview = await startPreview(4198)
  browser = await launchBrowser()

  // Software GL timing is noisy — the same build has measured 3 s and 9 s. Noise
  // only ever adds time, while a real regression slows every load, so take the
  // best of three.
  const times = []
  for (let i = 0; i < 3; i++) {
    const { page, firstFrame } = await openTop(browser, preview.base, { width: 1440, height: 900 })
    times.push(firstFrame ?? Infinity)
    await page.close()
  }
  const best = Math.min(...times)
  check(
    `first frame within ${FIRST_FRAME_MS / 1000} s (best of 3 loads)`,
    best <= FIRST_FRAME_MS,
    times.map((t) => (Number.isFinite(t) ? `${t} ms` : 'never')).join(', '),
  )

  for (const [label, viewport, monolith] of [
    ['1440 px', { width: 1440, height: 900 }, true],
    ['1024 px', { width: 1024, height: 768 }, false],
    ['phone', PHONE, false],
  ]) {
    const { page, errors, external } = await openTop(browser, preview.base, viewport)
    const { calls } = await overlay(page)

    check(`${label}: no page or console errors`, !errors.length, errors.slice(0, 2).join(' | '))
    check(
      `${label}: no requests to other origins`,
      !external.length,
      external.slice(0, 2).join(', '),
    )
    // Stars are one draw call; the monolith is one more, only where it has room.
    check(
      `${label}: monolith ${monolith ? 'drawn in the gap' : 'not drawn (no room beside the copy)'}`,
      calls === (monolith ? 2 : 1),
      `${calls} draw calls`,
    )

    const worst = await worstHeroContrast(page)
    check(
      `${label}: hero and header text ≥ ${AA_CONTRAST}:1 against the rendered scene`,
      worst.value >= AA_CONTRAST,
      `worst ${worst.value.toFixed(2)}:1 on “${worst.text}”`,
    )
    await page.close()
  }
} catch (err) {
  check('runtime suite ran', false, err instanceof Error ? err.message : String(err))
} finally {
  await browser?.close()
  preview?.stop()
}

finish('Phase 3 verified.')
