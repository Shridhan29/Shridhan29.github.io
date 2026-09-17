/**
 * Phase 3 acceptance checks — the real layers, as they land.
 *
 *   npm run verify:phase3
 *
 * Covers L0 · Orbit and L1 · Device so far. Requires a production build in dist/ and Chrome.
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

/** Makes text (and photos) in `regions` transparent, leaving scrims and the canvas. */
const hideText = (page, regions) =>
  page.addStyleTag({
    content: regions
      .map(
        (r) =>
          `${r}, ${r} * { color: transparent !important; text-decoration-color: transparent !important }` +
          ` ${r} img { visibility: hidden }`,
      )
      .join(' '),
  })

/**
 * Bounding box, in CSS px, of the bright pixels the scene draws within `region`
 * once the page's own text and images there are hidden. Bright means brighter
 * than any star or glow, so it finds solid content like a lit screen.
 */
async function sceneBounds(page, region) {
  const injected = [await hideText(page, [region])]
  // Fixed UI over the region is not the scene: the header text and the layer dots.
  injected.push(
    await page.addStyleTag({
      content: 'header, nav[aria-label="Layers"] { visibility: hidden !important }',
    }),
  )
  await sleep(300)
  const dpr = await page.evaluate(() => devicePixelRatio)
  const area = await page.evaluate((region) => {
    const r = document.querySelector(region).getBoundingClientRect()
    return {
      left: Math.max(0, r.left),
      top: Math.max(0, r.top),
      right: Math.min(innerWidth, r.right),
      bottom: Math.min(innerHeight, r.bottom),
    }
  }, region)
  const { data, info } = await sharp(await page.screenshot())
    .raw()
    .toBuffer({ resolveWithObject: true })
  const box = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity, count: 0 }
  for (let y = Math.floor(area.top * dpr); y < Math.min(info.height, area.bottom * dpr); y += 2) {
    for (let x = Math.floor(area.left * dpr); x < Math.min(info.width, area.right * dpr); x += 2) {
      const i = (y * info.width + x) * info.channels
      if (luminance([data[i], data[i + 1], data[i + 2]]) < 0.5) continue
      box.count++
      box.left = Math.min(box.left, x / dpr)
      box.right = Math.max(box.right, x / dpr)
      box.top = Math.min(box.top, y / dpr)
      box.bottom = Math.max(box.bottom, y / dpr)
    }
  }
  // Leave the page as found, so a later measurement sees its text.
  for (const tag of injected) await tag.evaluate((el) => el.remove())
  return box
}

/**
 * Contrast of the text in `regions` as rendered over the live canvas. Two screenshots:
 * with the text made transparent (its scrim stays) gives the real background:
 * for each line box, the 98th-percentile pixel — one star behind a glyph does
 * not decide it, anything larger does.
 *
 * The text colour is the specified one, as WCAG defines contrast, not a glyph
 * pixel: thin 12 px strokes never render at full colour, which under-rates
 * small text. Browsers report Tailwind's colours as oklab() and canvas will not
 * parse them, so each colour is painted as a swatch over black and over white
 * and its sRGB and alpha solved from the two.
 */
async function worstContrast(page, regions) {
  // The ?debug=1 stats panel sits over the bottom-left of the hero; measured with
  // it in place, the text beneath it cannot change between the two shots.
  await page.evaluate(() => document.querySelector('[data-debug]')?.remove())
  const lines = await page.evaluate((regions) => {
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
    for (const region of document.querySelectorAll(regions.join(', '))) {
      const walker = document.createTreeWalker(region, NodeFilter.SHOW_TEXT)
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (!n.textContent.trim() || onOwnGround(n.parentElement, region)) continue
        // Decorative text is not read, and logotypes are exempt from WCAG contrast.
        if (n.parentElement.closest('[aria-hidden="true"]')) continue
        // Screen-reader-only text is clipped to a 1 px box and never painted.
        const srOnly = (() => {
          for (let e = n.parentElement; e && e !== region; e = e.parentElement) {
            const b = e.getBoundingClientRect()
            if (b.width <= 1 || b.height <= 1) return true
          }
          return false
        })()
        if (srOnly) continue
        // Laid out but not painted — a closed <details> keeps its boxes in Chrome.
        if (
          !n.parentElement.checkVisibility({
            contentVisibilityAuto: true,
            visibilityProperty: true,
          })
        )
          continue
        range.selectNodeContents(n)
        for (const r of range.getClientRects()) {
          if (r.width < 4 || r.height < 4) continue
          // Only lines fully on screen: a clipped line would be judged by its empty edge.
          if (r.top < 0 || r.bottom > innerHeight || r.left < 0 || r.right > innerWidth) continue
          // Covered by something else — the solid header once scrolled — is not visible.
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
          if (hit && !n.parentElement.contains(hit) && !hit.contains(n.parentElement)) continue
          out.push({
            text: n.textContent.trim().slice(0, 32),
            color: getComputedStyle(n.parentElement).color,
            x: r.x,
            y: r.y,
            w: r.width,
            h: r.height,
          })
        }
      }
    }
    return out
  }, regions)
  const grab = async () =>
    sharp(await page.screenshot())
      .raw()
      .toBuffer({ resolveWithObject: true })
  const dpr = await page.evaluate(() => devicePixelRatio)

  // Swatches: each distinct colour over a black and a white square, top-left.
  const colors = [...new Set(lines.map((l) => l.color))]
  await page.evaluate((colors) => {
    const box = Object.assign(document.createElement('div'), { id: '__swatches' })
    box.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;display:flex'
    colors.forEach((c) => {
      for (const ground of ['#000', '#fff']) {
        const cell = document.createElement('div')
        cell.style.cssText = `width:12px;height:12px;background:${ground}`
        cell.innerHTML = `<div style="width:12px;height:12px;background:${c}"></div>`
        box.append(cell)
      }
    })
    document.body.append(box)
  }, colors)
  const swatches = await grab()
  await page.evaluate(() => document.getElementById('__swatches').remove())
  const rgbAt = (img, x, y) => {
    const i = (y * img.info.width + x) * img.info.channels
    return [img.data[i], img.data[i + 1], img.data[i + 2]]
  }
  const resolved = new Map(
    colors.map((c, k) => {
      const onBlack = rgbAt(swatches, Math.floor((k * 24 + 6) * dpr), Math.floor(6 * dpr))
      const onWhite = rgbAt(swatches, Math.floor((k * 24 + 18) * dpr), Math.floor(6 * dpr))
      const alpha =
        1 - (onWhite[0] - onBlack[0] + onWhite[1] - onBlack[1] + onWhite[2] - onBlack[2]) / 765
      const rgb = onBlack.map((v) => (alpha > 0 ? Math.min(255, v / alpha) : 0))
      return [c, { rgb, alpha }]
    }),
  )

  const hidden = await hideText(page, regions)
  await sleep(300)
  const without = await grab()
  const { width, height } = without.info

  let worst = { value: Infinity, text: '', lines: lines.length }
  for (const line of lines) {
    const x0 = Math.max(0, Math.floor(line.x * dpr))
    const y0 = Math.max(0, Math.floor(line.y * dpr))
    const x1 = Math.min(width, Math.ceil((line.x + line.w) * dpr))
    const y1 = Math.min(height, Math.ceil((line.y + line.h) * dpr))
    const bgs = []
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const px = rgbAt(without, x, y)
        bgs.push([luminance(px), px])
      }
    }
    if (!bgs.length) continue
    bgs.sort((a, b) => a[0] - b[0])
    const bg = bgs[Math.floor((bgs.length - 1) * 0.98)][1]
    const { rgb, alpha } = resolved.get(line.color)
    const fg = rgb.map((c, k) => c * alpha + bg[k] * (1 - alpha))
    const value = ratio(luminance(fg), luminance(bg))
    if (value < worst.value) worst = { value, text: line.text, lines: lines.length }
  }
  await hidden.evaluate((el) => el.remove())
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

    const worst = await worstContrast(page, ['#top', 'header'])
    check(
      `${label}: hero and header text ≥ ${AA_CONTRAST}:1 against the rendered scene`,
      worst.lines > 0 && worst.value >= AA_CONTRAST,
      worst.lines
        ? `worst ${worst.value.toFixed(2)}:1 on “${worst.text}” (${worst.lines} lines)`
        : 'no text measured',
    )
    await page.close()
  }

  // ------------------------------------------------------------ L1 · Device --

  section('L1 · Device in a real browser')

  /** Opens the page scrolled so the device stage (or, without one, the TRUUNA shot row) is centred. */
  const openDevice = async (viewport, { webgl = true } = {}) => {
    const page = await browser.newPage()
    const errors = []
    const shotRequests = []
    page.on('pageerror', (e) => errors.push(e.message))
    // The row's images; the phone's own screen texture is a separate -840.webp.
    page.on('request', (r) => {
      if (/\/img\/truuna\/.+-(420|840)\.avif/.test(r.url())) shotRequests.push(r.url())
    })
    if (!webgl) {
      await page.evaluateOnNewDocument(() => {
        const original = HTMLCanvasElement.prototype.getContext
        HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
          return String(type).startsWith('webgl') ? null : original.call(this, type, ...rest)
        }
      })
    }
    await page.setViewport(viewport)
    await page.goto(`${preview.base}/`, { waitUntil: 'networkidle0', timeout: 60_000 })
    await page.evaluate(() => {
      const stage = document.querySelector('[data-stage="device"]')
      const row = [...document.querySelectorAll('#truuna ul')].find((u) => u.querySelector('img'))
      const target = stage?.getBoundingClientRect().width ? stage : row
      const r = target.getBoundingClientRect()
      window.scrollTo(0, r.top + scrollY + r.height / 2 - innerHeight / 2)
    })
    await sleep(3500)
    return { page, errors, shotRequests }
  }

  const layout = (page) =>
    page.evaluate(() => {
      const stage = document.querySelector('[data-stage="device"]')
      const row = [...document.querySelectorAll('#truuna ul')].find((u) => u.querySelector('img'))
      const captions = document.querySelector('[data-shot-captions]')
      const s = stage?.getBoundingClientRect()
      const l = row.getBoundingClientRect()
      return {
        stage: s && s.width ? { left: s.left, top: s.top, right: s.right, bottom: s.bottom } : null,
        rowVisible: l.width > 100 && l.height > 100,
        images: row.querySelectorAll('img[alt]').length,
        // Rendered for assistive tech: laid out, even if clipped to 1 px.
        captions:
          captions && getComputedStyle(captions).display !== 'none'
            ? captions.querySelectorAll('li').length
            : 0,
      }
    })

  {
    const { page, errors, shotRequests } = await openDevice({ width: 1440, height: 900 })
    const view = await layout(page)
    check('1440 px: no page errors', !errors.length, errors.slice(0, 2).join(' | '))
    check(
      '1440 px: TRUUNA gets a device stage in place of the screenshot row',
      !!view.stage && !view.rowVisible,
    )
    check(
      '1440 px: screen readers get each screen described once',
      view.captions === 5,
      `${view.captions} descriptions`,
    )
    check(
      '1440 px: the hidden screenshot row downloads nothing',
      !shotRequests.length,
      shotRequests.slice(0, 2).join(', '),
    )

    const box = await sceneBounds(page, '#truuna')
    const s = view.stage
    const inside =
      !!s &&
      box.count > 0 &&
      box.left >= s.left - 4 &&
      box.right <= s.right + 4 &&
      box.top >= s.top - 4 &&
      box.bottom <= s.bottom + 4
    check(
      '1440 px: the phone is drawn, and only inside its stage',
      inside,
      box.count
        ? `drawn ${Math.round(box.left)}–${Math.round(box.right)} × ${Math.round(box.top)}–${Math.round(box.bottom)}` +
            (s
              ? `, stage ${Math.round(s.left)}–${Math.round(s.right)} × ${Math.round(s.top)}–${Math.round(s.bottom)}`
              : '')
        : 'nothing drawn',
    )

    // Measured where the article's text and the lit phone share the screen: the
    // stage's top two-thirds of the way down, so the glow reaches the text above.
    await page.evaluate(() => {
      const r = document.querySelector('[data-stage="device"]').getBoundingClientRect()
      window.scrollTo(0, r.top + scrollY - innerHeight * 0.66)
    })
    await sleep(2500)
    const worst = await worstContrast(page, ['#truuna'])
    check(
      `1440 px: TRUUNA text ≥ ${AA_CONTRAST}:1 against the rendered scene`,
      worst.lines > 0 && worst.value >= AA_CONTRAST,
      worst.lines
        ? `worst ${worst.value.toFixed(2)}:1 on “${worst.text}” (${worst.lines} lines)`
        : 'no text measured',
    )
    await page.close()
  }

  for (const [label, viewport, webgl] of [
    ['phone', PHONE, true],
    ['no WebGL, 1440 px', { width: 1440, height: 900 }, false],
  ]) {
    const { page } = await openDevice(viewport, { webgl })
    const view = await layout(page)
    check(
      `${label}: no device stage; the screenshot row is shown`,
      !view.stage && view.rowVisible && view.images === 5 && view.captions === 0,
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
