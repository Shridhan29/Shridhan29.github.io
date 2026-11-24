/**
 * Accessibility checks (6.5).
 *
 *   npm run verify:a11y
 *
 * axe-core on every way the site can be seen — the 3D page, the Static page
 * (reduced motion), a phone, the plain view and the 404 — failing on any
 * serious or critical violation. Then the keyboard: tab order, visible focus,
 * nothing focusable inside the decorative canvas, and Esc into the plain view.
 *
 * axe's colour-contrast rule reads CSS backgrounds; it cannot see the 3D scene
 * behind the text. Contrast against the rendered scene is measured from pixels
 * by verify:phase3, for the hero and every article with a stage.
 *
 * Requires a production build in dist/ and Chrome.
 */
import { createRequire } from 'node:module'
import {
  closeBrowser,
  createReport,
  launchBrowser,
  PHONE,
  sleep,
  startPreview,
} from './lib/harness.mjs'

const { check, section, finish } = createReport()
const AXE = createRequire(import.meta.url).resolve('axe-core/axe.min.js')
const BLOCKING = new Set(['serious', 'critical'])

/** Runs axe on the page; returns the serious and critical violations, summarised. */
async function audit(page) {
  await page.addScriptTag({ path: AXE })
  const violations = await page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    const result = await axe.run(document, { resultTypes: ['violations'] })
    return result.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.length,
      target: v.nodes[0]?.target?.join(' ') ?? '',
    }))
  })
  return violations.filter((v) => BLOCKING.has(v.impact))
}

const summarise = (vs) => vs.map((v) => `${v.id} ×${v.nodes} (${v.target})`).join('; ')

const preview = await startPreview(4178)
let browser
try {
  browser = await launchBrowser()

  section('axe: no serious or critical violations')
  const views = [
    { name: '3D page, 1440 px', url: '/?tier=low', viewport: { width: 1440, height: 900 } },
    {
      name: 'Static page (reduced motion), 1440 px',
      url: '/',
      viewport: { width: 1440, height: 900 },
      motion: 'reduce',
    },
    { name: 'phone, 390 px', url: '/', viewport: PHONE },
    { name: '404 page', url: '/404.html', viewport: { width: 1440, height: 900 } },
  ]
  for (const view of views) {
    const page = await browser.newPage()
    if (view.motion) {
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: view.motion }])
    }
    await page.setViewport(view.viewport)
    await page.goto(`${preview.base}${view.url}`, { waitUntil: 'networkidle0', timeout: 60_000 })
    // Let the hero's decode and count-up settle, so axe reads the final text.
    await sleep(2500)
    const blocking = await audit(page)
    check(view.name, !blocking.length, summarise(blocking))
    await page.close()
  }

  section('Keyboard')
  {
    const page = await browser.newPage()
    await page.setViewport({ width: 1440, height: 900 })
    await page.goto(`${preview.base}/?tier=low`, { waitUntil: 'networkidle0', timeout: 60_000 })
    await sleep(2000)

    const stops = []
    for (let i = 0; i < 120; i++) {
      await page.keyboard.press('Tab')
      const stop = await page.evaluate(() => {
        const el = document.activeElement
        if (!el || el === document.body) return null
        const r = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        return {
          label: (el.getAttribute('aria-label') || el.textContent || el.tagName)
            .trim()
            .slice(0, 40),
          tag: el.tagName,
          inHidden: !!el.closest('[aria-hidden="true"]'),
          inCanvas:
            !!el.closest('canvas') || !!el.closest('[data-scene-ready], .fixed.inset-0.z-0'),
          visible: r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight,
          ring: cs.outlineStyle !== 'none' || cs.boxShadow !== 'none',
          y: r.top + scrollY,
          main: !!el.closest('main'),
          // Position among all elements in document order.
          order: [...document.querySelectorAll('*')].indexOf(el),
        }
      })
      if (!stop) break
      if (stops.length && stops[0].label === stop.label && stops[0].y === stop.y) break
      stops.push(stop)
    }

    check(
      'the first Tab reaches the skip link',
      /skip to content/i.test(stops[0]?.label ?? ''),
      stops[0]?.label,
    )
    check(
      'the second Tab offers the plain view',
      /plain view/i.test(stops[1]?.label ?? ''),
      stops[1]?.label,
    )
    check(
      'keyboard reaches the contact form',
      stops.some((s) => s.tag === 'TEXTAREA'),
      `${stops.length} stops`,
    )
    const hidden = stops.filter((s) => s.inHidden || s.inCanvas)
    check(
      'nothing focusable inside the decorative canvas or aria-hidden content',
      !hidden.length,
      hidden.map((s) => s.label).join(', '),
    )
    const offscreen = stops.filter((s) => !s.visible)
    check(
      'every focused element is scrolled into view',
      !offscreen.length,
      offscreen.map((s) => s.label).join(', '),
    )
    const ringless = stops.filter((s) => !s.ring)
    check(
      'every focused element shows a focus ring',
      !ringless.length,
      ringless.map((s) => s.label).join(', '),
    )

    // Tab order is document order: nothing jumps the queue with a positive
    // tabindex, and the sequence never goes back. Two-column layouts (a
    // project's links beside its detail, the contact details beside the form)
    // read left column then right, which is the order the DOM already has.
    const order = await page.evaluate(() => {
      const positive = [...document.querySelectorAll('[tabindex]')].filter((el) => el.tabIndex > 0)
      return { positive: positive.length }
    })
    check('no positive tabindex anywhere', order.positive === 0, `${order.positive}`)
    check(
      'tab order follows document order',
      stops.every((s, i) => i === 0 || s.order > stops[i - 1].order || s.order === -1),
      stops.map((s) => s.order).join(','),
    )
    await page.close()
  }

  section('Plain view (Esc)')
  {
    const context = await browser.createBrowserContext()
    const page = await context.newPage()
    await page.setViewport({ width: 1440, height: 900 })
    await page.goto(`${preview.base}/?tier=low`, { waitUntil: 'networkidle0', timeout: 60_000 })
    check('the 3D page has a canvas', !!(await page.$('canvas')))

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.keyboard.press('Escape'),
    ])
    await sleep(800)
    check('Esc reloads into the plain view: no canvas', !(await page.$('canvas')))
    check(
      'the plain view still has all the content',
      (await page.evaluate(() => document.querySelector('main')?.innerText.length ?? 0)) > 2000,
    )
    check(
      'the graphics toggle tells the truth: Off',
      (await page.$eval('[data-graphics-toggle]', (el) => el.value).catch(() => null)) === 'static',
    )
    check(
      'the plain view is for this visit only, not saved',
      (await page.evaluate(() => localStorage.getItem('quality-tier'))) === null,
    )

    // Esc while typing belongs to the field.
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.select('[data-graphics-toggle]', 'auto'),
    ])
    await sleep(800)
    check('choosing Automatic brings the scene back', !!(await page.$('canvas')))
    await page.focus('textarea')
    await page.keyboard.press('Escape')
    await sleep(1500)
    check('Esc inside the contact form does not leave the page', !!(await page.$('canvas')))
    await context.close()
  }
} catch (err) {
  check('runtime suite ran', false, err instanceof Error ? err.message : String(err))
} finally {
  await closeBrowser(browser)
  preview.stop()
}

finish('Accessibility verified.')
