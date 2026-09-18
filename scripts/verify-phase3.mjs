/**
 * Phase 3 acceptance checks — the real layers, as they land.
 *
 *   npm run verify:phase3
 *
 * Covers L0 · Orbit, L1 · Device and L2 · Surface so far. Requires a production build in dist/ and Chrome.
 */
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import {
  PHONE,
  closeBrowser,
  createReport,
  launchBrowser,
  sleep,
  startPreview,
} from './lib/harness.mjs'

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
  // useStagedFrame is useLayerFrame plus stage placement.
  if (!/use(Layer|Staged)Frame\(/.test(src) || /\buseFrame\(/.test(src)) ungated.push(f)
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

// 4.2: the monolith's signature effect is a fresnel rim — lit where its surface
// turns away from the viewer, so the slab's faces stay dark behind the hero copy.
const orbit = await readFile('src/canvas/layers/Orbit.tsx', 'utf8')
check(
  'the monolith has a fresnel rim that leaves its faces dark',
  /1\.0 - facing/.test(orbit) && /AdditiveBlending/.test(orbit),
)

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
    // Stars are one draw call; where the monolith has room it adds two, the slab
    // and its fresnel rim (4.2).
    check(
      `${label}: monolith ${monolith ? 'drawn in the gap' : 'not drawn (no room beside the copy)'}`,
      calls === (monolith ? 3 : 1),
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

  // ------------------------------------------------- staged layers: L1, L2 --

  /**
   * Layers that draw a project's screenshots into a stage the article reserves
   * on desktop, in place of its screenshot row.
   */
  const STAGED = [
    // prettier-ignore
    { title: 'L1 · Device', article: 'truuna', name: 'TRUUNA', dir: 'truuna', stage: 'device', shots: 5, subject: 'the phone is', sequence: true },
    // prettier-ignore
    { title: 'L2 · Surface', article: 'aashman', name: 'aashman.in', dir: 'aashman.in', stage: 'surface', shots: 6, subject: 'the panes are', runs: { effect: 'ribbons', label: 'the ribbons draw themselves as the stack rises', full: 100, atLeast: 85 } },
    // prettier-ignore
    { title: 'L3 · Ground (DMS)', article: 'dms', name: 'DMS', dir: 'dms', stage: 'ground-pos', shots: 4, subject: 'the terminal is' },
    // prettier-ignore
    { title: 'L3 · Ground (Urja)', article: 'urja', name: 'Urja', dir: 'urja', stage: 'ground-kiosk', shots: 4, subject: 'the kiosk is', live: true },
    // No screenshots: draws into the free column beside the About copy, text alongside.
    // prettier-ignore
    { title: 'L4 · Core', article: 'about', name: 'About', stage: 'core', shots: 0, beside: true, subject: 'the diagram is', moves: { effect: 'packets', label: 'packets along the request path' } },
    // No screenshots: draws under the dates in the Experience entry, text alongside.
    // prettier-ignore
    { title: 'L5 · Cloud', article: 'experience', name: 'Experience', stage: 'cloud', shots: 0, beside: true, subject: 'the pipeline is', runs: { effect: 'pipeline', label: 'the pipeline runs stage by stage as the column rises', full: 4 } },
  ]

  // Staged layers load their textures only when they can be shown.
  // If the 3D code never arrives, the page must still be whole: its copy, its
  // screenshots, and no empty stages. Before SceneBoundary this left a blank page.
  section('3D fails to load')
  await closeBrowser(browser)
  browser = await launchBrowser()
  {
    const page = await browser.newPage()
    await page.setViewport({ width: 1440, height: 900 })
    await page.setRequestInterception(true)
    const blocked = []
    page.on('request', (r) => {
      if (/\/assets\/three-/.test(r.url())) {
        blocked.push(r.url())
        r.abort()
      } else r.continue()
    })
    await page.goto(`${preview.base}/`, { waitUntil: 'networkidle0', timeout: 60_000 })
    await sleep(2500)
    const state = await page.evaluate(() => {
      const stages = [...document.querySelectorAll('[data-stage]')]
      const row = [...document.querySelectorAll('#truuna ul')].find((u) => u.querySelector('img'))
      return {
        text: document.body.innerText.length,
        canvas: document.querySelectorAll('canvas').length,
        shownStages: stages.filter((el) => el.getBoundingClientRect().height > 0).length,
        rowHeight: row ? row.getBoundingClientRect().height : 0,
        sceneOff: document.documentElement.hasAttribute('data-scene-off'),
      }
    })
    check(
      'the 3D download was actually blocked',
      blocked.length > 0,
      `${blocked.length} request(s)`,
    )
    check('the page still renders its content', state.text > 2000, `${state.text} characters`)
    check(
      'no empty stages; screenshot rows shown instead',
      state.shownStages === 0 && state.rowHeight > 100 && state.sceneOff,
      `${state.shownStages} stages shown, TRUUNA row ${Math.round(state.rowHeight)} px`,
    )
    await page.close()
  }

  section('Staged layers load on approach')
  await closeBrowser(browser)
  browser = await launchBrowser()
  {
    const textures = (page) => {
      const seen = []
      page.on('request', (r) => {
        if (/\/img\/(truuna|aashman\.in|dms|urja)\/.+\.webp$/.test(r.url()))
          seen.push(r.url().split('/img/')[1])
      })
      return seen
    }

    const top = await browser.newPage()
    const atTop = textures(top)
    await top.setViewport({ width: 1440, height: 900 })
    await top.goto(`${preview.base}/`, { waitUntil: 'networkidle0', timeout: 60_000 })
    await sleep(2500)
    check(
      '1440 px at the top: L2 and L3 textures wait until the camera nears them',
      !atTop.some((u) => /^(aashman\.in|dms|urja)\//.test(u)),
      atTop.join(', ') || 'none requested',
    )
    await top.close()

    // A phone never shows a stage, so it should never fetch a layer texture —
    // even after scrolling the full length of both articles.
    const phone = await browser.newPage()
    const onPhone = textures(phone)
    await phone.setViewport(PHONE)
    await phone.goto(`${preview.base}/`, { waitUntil: 'networkidle0', timeout: 60_000 })
    for (const id of ['truuna', 'aashman', 'dms', 'urja', 'about']) {
      await phone.evaluate((id) => document.getElementById(id).scrollIntoView(), id)
      await sleep(1500)
    }
    check('phone: no layer textures downloaded', !onPhone.length, onPhone.join(', '))
    await phone.close()
  }

  for (const {
    title,
    article,
    name,
    dir,
    stage,
    shots,
    subject,
    beside,
    sequence,
    moves,
    runs,
    live,
  } of STAGED) {
    section(`${title} in a real browser`)
    // A fresh browser per layer. Software-rendered Chrome keeps GPU and image
    // memory across page loads, and on a 4 GB machine a page was killed partway
    // through a full verify ("Target closed", "detached Frame"). When one dies
    // anyway, this layer's checks are retried once on another fresh browser
    // rather than the whole suite ending; a second death is reported as this
    // layer's failure. A retry may repeat the checks it already printed.
    await closeBrowser(browser)
    browser = await launchBrowser()
    const CRASHED = /detached Frame|Target closed|Session closed|crashed|Protocol error/i
    let attempt = 0
    while (true) {
      try {
        await runLayer()
        break
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (attempt++ === 0 && CRASHED.test(message)) {
          console.log(`  ...   browser died; retrying ${title} on a fresh one`)
          await closeBrowser(browser)
          browser = await launchBrowser()
          continue
        }
        check(`${title}: checks ran`, false, message)
        break
      }
    }
    continue

    async function runLayer() {
      /** Opens the page scrolled so the stage (or, without one, the screenshot row) is centred. */
      const open = async (viewport, { webgl = true } = {}) => {
        const page = await browser.newPage()
        const errors = []
        const rowRequests = []
        page.on('pageerror', (e) => errors.push(e.message))
        // The row's own images are AVIF; the layer's textures are WebP.
        page.on('request', (r) => {
          if (
            dir &&
            r.url().includes(`/img/`) &&
            r.url().endsWith('.avif') &&
            r.url().includes(`/${dir}/`)
          )
            rowRequests.push(r.url())
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
        await page.evaluate(
          (article, stage) => {
            const el = document.querySelector(`[data-stage="${stage}"]`)
            const row = [...document.querySelectorAll(`#${article} ul`)].find((u) =>
              u.querySelector('img'),
            )
            const target = el?.getBoundingClientRect().width
              ? el
              : (row ?? document.getElementById(article))
            const r = target.getBoundingClientRect()
            window.scrollTo(0, r.top + scrollY + r.height / 2 - innerHeight / 2)
          },
          article,
          stage,
        )
        await sleep(4000)
        return { page, errors, rowRequests }
      }

      const layout = (page) =>
        page.evaluate(
          (article, stage) => {
            const el = document.querySelector(`[data-stage="${stage}"]`)
            const row = [...document.querySelectorAll(`#${article} ul`)].find((u) =>
              u.querySelector('img'),
            )
            const captions = document.querySelector(`#${article} [data-shot-captions]`)
            const s = el?.getBoundingClientRect()
            const l = row?.getBoundingClientRect() ?? { width: 0, height: 0 }
            return {
              stage:
                s && s.width
                  ? { left: s.left, top: s.top, right: s.right, bottom: s.bottom }
                  : null,
              rowVisible: l.width > 100 && l.height > 100,
              images: row ? row.querySelectorAll('img[alt]').length : 0,
              // Rendered for assistive tech: laid out, even if clipped to 1 px.
              captions:
                captions && getComputedStyle(captions).display !== 'none'
                  ? captions.querySelectorAll('li').length
                  : 0,
            }
          },
          article,
          stage,
        )

      {
        const { page, errors, rowRequests } = await open({ width: 1440, height: 900 })
        const view = await layout(page)
        check('1440 px: no page errors', !errors.length, errors.slice(0, 2).join(' | '))
        if (shots) {
          check(
            `1440 px: ${name} gets a stage in place of its screenshot row`,
            !!view.stage && !view.rowVisible,
          )
          check(
            '1440 px: screen readers get each screenshot described once',
            view.captions === shots,
            `${view.captions} of ${shots} descriptions`,
          )
          check(
            '1440 px: the hidden screenshot row downloads nothing',
            !rowRequests.length,
            rowRequests.slice(0, 2).join(', '),
          )
        } else {
          check(`1440 px: ${name} gets a stage`, !!view.stage)
        }

        const box = await sceneBounds(page, `#${article}`)
        const s = view.stage
        const inside =
          !!s &&
          box.count > 0 &&
          box.left >= s.left - 4 &&
          box.right <= s.right + 4 &&
          box.top >= s.top - 4 &&
          box.bottom <= s.bottom + 4
        check(
          `1440 px: ${subject} drawn, and only inside the stage`,
          inside,
          box.count
            ? `drawn ${Math.round(box.left)}–${Math.round(box.right)} × ${Math.round(box.top)}–${Math.round(box.bottom)}` +
                (s
                  ? `, stage ${Math.round(s.left)}–${Math.round(s.right)} × ${Math.round(s.top)}–${Math.round(s.bottom)}`
                  : '')
            : 'nothing drawn',
        )

        // 4.3: the screen plays the app's flow as the stage crosses the screen.
        // Read from the layer's own published index, not from pixels: between two
        // scroll positions the whole page has moved, so comparing screenshots
        // "passes" even when the screen never changes.
        // 4.6: an effect that animates on its own, read from the value the layer
        // publishes. Pixels cannot answer this: the diagram sways as well, so a
        // screenshot difference stays large even with the packets frozen.
        if (moves) {
          const debug = await browser.newPage()
          await debug.setViewport({ width: 1440, height: 900 })
          await debug.goto(`${preview.base}/?debug=1`, {
            waitUntil: 'networkidle0',
            timeout: 60_000,
          })
          await debug.evaluate((stage) => {
            const r = document.querySelector(`[data-stage="${stage}"]`).getBoundingClientRect()
            window.scrollTo(0, r.top + scrollY + r.height / 2 - innerHeight / 2)
          }, stage)
          await sleep(3000)
          const read = () =>
            debug.evaluate((effect) => {
              const text = document.querySelector('[data-debug]')?.textContent ?? ''
              // Escaped for the template literal: `\s` there would collapse to `s`.
              return Number(new RegExp(`${effect}\\s+(\\d+)`).exec(text)?.[1] ?? -1)
            }, moves.effect)
          const first = await read()
          await sleep(1500)
          const second = await read()
          check(
            `1440 px: ${moves.label} keep moving`,
            first >= 0 && second >= 0 && first !== second,
            `travelled ${first} → ${second} with the page still`,
          )
          await debug.close()
        }

        // 4.7: stages light in order as the column rises, read from the layer's
        // own published count.
        // 4.5: the kiosk screen is the real interface, and answers a click.
        if (live) {
          const kiosk = await page.evaluate(() => {
            const el = document.querySelector('[data-kiosk]')
            if (!el) return null
            const buttons = [...el.querySelectorAll('button')]
            return {
              text: el.innerText.replace(/\s+/g, ' ').trim(),
              buttons: buttons.length,
              // Focusable controls inside the aria-hidden canvas would be a
              // keyboard trap: reachable by Tab, invisible to a screen reader.
              focusable: buttons.filter((b) => b.tabIndex >= 0).length,
            }
          })
          check('1440 px: the kiosk screen runs the real interface', !!kiosk?.buttons, kiosk?.text)
          check(
            '1440 px: nothing in the scene is keyboard-focusable',
            kiosk?.focusable === 0,
            `${kiosk?.focusable ?? '?'} focusable controls`,
          )
          const after = await page.evaluate(async () => {
            const buttons = [...document.querySelectorAll('[data-kiosk] button')]
            buttons[1]?.click()
            await new Promise((r) => setTimeout(r, 500))
            return document.querySelector('[data-kiosk]')?.innerText.replace(/\s+/g, ' ').trim()
          })
          check(
            '1440 px: choosing a language changes the kiosk',
            !!after && !!kiosk?.text && after !== kiosk.text,
            after?.slice(0, 48),
          )
        }

        if (runs) {
          const debug = await browser.newPage()
          await debug.setViewport({ width: 1440, height: 900 })
          await debug.goto(`${preview.base}/?debug=1`, {
            waitUntil: 'networkidle0',
            timeout: 60_000,
          })
          const litAt = async (k) => {
            await debug.evaluate(
              (stage, k) => {
                const r = document.querySelector(`[data-stage="${stage}"]`).getBoundingClientRect()
                window.scrollTo(0, r.top + scrollY + r.height / 2 - innerHeight * (1 - k))
              },
              stage,
              k,
            )
            // Wait for the value rather than sampling blind: on the first stop
            // the layer may still be mounting and loading its textures, and an
            // absent value reads as -1.
            const read = () =>
              debug.evaluate((effect) => {
                const text = document.querySelector('[data-debug]')?.textContent ?? ''
                // Escaped for the template literal: `\s` there would collapse to `s`.
                return Number(new RegExp(`${effect}\\s+(\\d+)`).exec(text)?.[1] ?? -1)
              }, runs.effect)
            const until = Date.now() + 12_000
            let value = await read()
            while (value < 0 && Date.now() < until) {
              await sleep(500)
              value = await read()
            }
            // Settle: the value is still easing toward its place for this stop.
            await sleep(2500)
            return read()
          }
          const early = await litAt(0.1)
          const middle = await litAt(0.5)
          const late = await litAt(0.95)
          check(
            `1440 px: ${runs.label}`,
            early >= 0 && early < middle && middle < late && late >= (runs.atLeast ?? runs.full),
            `${early} → ${middle} → ${late} of ${runs.full}`,
          )
          await debug.close()
        }

        if (sequence) {
          // Its own page: the staged pages run without ?debug=1, and the overlay
          // would otherwise sit over the article while the other checks measure it.
          const debug = await browser.newPage()
          await debug.setViewport({ width: 1440, height: 900 })
          await debug.goto(`${preview.base}/?debug=1`, {
            waitUntil: 'networkidle0',
            timeout: 60_000,
          })
          const screenAt = async (k) => {
            await debug.evaluate(
              (stage, k) => {
                const r = document.querySelector(`[data-stage="${stage}"]`).getBoundingClientRect()
                window.scrollTo(0, r.top + scrollY + r.height / 2 - innerHeight * (1 - k))
              },
              stage,
              k,
            )
            await sleep(2500)
            return debug.evaluate(() => {
              const text = document.querySelector('[data-debug]')?.textContent ?? ''
              return Number(/screen\s+(\d+)/.exec(text)?.[1] ?? -1)
            })
          }
          const early = await screenAt(0.1)
          const middle = await screenAt(0.5)
          const late = await screenAt(0.9)
          check(
            '1440 px: the screen advances through the app flow',
            // Advancing and arriving, not landing on exact indices: smooth scrolling
            // does not stop at a precise offset.
            early >= 0 && early < middle && middle < late && late >= shots - 2,
            `screens ${early} → ${middle} → ${late} of 0–${shots - 1}`,
          )
          await debug.close()
        }

        // Measured where the text and the lit stage share the screen: a stage
        // beside its text already does, centred; one below it is moved to the lower
        // third so the text above is in view.
        if (!beside) {
          await page.evaluate((stage) => {
            const r = document.querySelector(`[data-stage="${stage}"]`).getBoundingClientRect()
            window.scrollTo(0, r.top + scrollY - innerHeight * 0.66)
          }, stage)
          await sleep(2500)
        }
        const worst = await worstContrast(page, [`#${article}`])
        check(
          `1440 px: ${name} text ≥ ${AA_CONTRAST}:1 against the rendered scene`,
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
        const { page } = await open(viewport, { webgl })
        const view = await layout(page)
        check(
          shots ? `${label}: no stage; the screenshot row is shown` : `${label}: no stage`,
          !view.stage &&
            view.captions === 0 &&
            (!shots || (view.rowVisible && view.images === shots)),
        )
        await page.close()
      }
    }
  }
} catch (err) {
  check('runtime suite ran', false, err instanceof Error ? err.message : String(err))
} finally {
  await closeBrowser(browser)
  preview?.stop()
}

finish('Phase 3 verified.')
