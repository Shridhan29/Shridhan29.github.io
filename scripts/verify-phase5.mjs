/**
 * Phase 5 acceptance checks — polish that has to stay out of the way.
 *
 *   npm run verify:phase5
 *
 * The 404 page, the hero's decode and count-up, the magnetic buttons, the
 * portrait glare, the scene's reveal, and the console note. Each is checked with
 * motion allowed and with reduced motion, because every one of them must fall
 * back to the plain page. Requires a production build in dist/ and Chrome.
 */
import { readFile, stat } from 'node:fs/promises'
import sharp from 'sharp'
import { closeBrowser, createReport, launchBrowser, sleep, startPreview } from './lib/harness.mjs'

const { check, section, finish } = createReport()

// ---------------------------------------------------------------- source --

section('Source invariants')

const motionDir = 'src/dom/motion'
const motionFiles = ['DecodeText.tsx', 'CountUp.tsx', 'useMagnet.ts', 'Glare.tsx']
const sources = await Promise.all(motionFiles.map((f) => readFile(`${motionDir}/${f}`, 'utf8')))
check(
  'micro-interactions import no animation library (no motion, no gsap)',
  sources.every((s) => !/from ['"](motion|framer-motion|gsap)/.test(s)),
)
check(
  'every micro-interaction respects reduced motion',
  sources.every(
    (s, i) =>
      /usePrefersReducedMotion|prefers-reduced-motion/.test(s) ||
      // Glare's guard lives in the stylesheet's media query.
      motionFiles[i] === 'Glare.tsx',
  ),
)
const css = await readFile('src/styles/index.css', 'utf8')
check(
  'the glare only exists where a fine pointer can hover, and not with reduced motion',
  /\(hover: hover\) and \(pointer: fine\) and \(prefers-reduced-motion: no-preference\)[\s\S]*\.glare::after/.test(
    css,
  ),
)

const notFound = await readFile('dist/404.html', 'utf8').catch(() => '')
check('dist/404.html exists (GitHub Pages serves it for unknown paths)', !!notFound)
check(
  'the 404 page loads no scripts or stylesheets from the app',
  !/src=|rel="stylesheet"/.test(notFound),
)
check('the 404 page links back to the site', /href="\/"/.test(notFound))
check(
  'the 404 page writes the path as text, never as markup',
  /textContent = location\.pathname/.test(notFound),
)

section('Launch metadata (6.8)')

const html = await readFile('dist/index.html', 'utf8')
const meta = (attr, name) =>
  new RegExp(`<meta[^>]*${attr}="${name}"[^>]*content="([^"]+)"`).exec(html)?.[1] ?? null
const ogImage = meta('property', 'og:image')
check('og:image is an absolute https URL', /^https:\/\//.test(ogImage ?? ''), ogImage)
check(
  'og:url and canonical agree',
  meta('property', 'og:url') === /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1],
)
check('twitter:card is a large image', meta('name', 'twitter:card') === 'summary_large_image')
const ogFile = ogImage ? `dist${new URL(ogImage).pathname}` : null
const ogMeta = ogFile
  ? await sharp(ogFile)
      .metadata()
      .catch(() => null)
  : null
check(
  'the OG image ships at 1200 × 630, as declared',
  ogMeta?.width === 1200 &&
    ogMeta?.height === 630 &&
    meta('property', 'og:image:width') === '1200' &&
    meta('property', 'og:image:height') === '630',
  ogMeta ? `${ogMeta.width} × ${ogMeta.height}` : 'missing',
)
check(
  'the OG image is under 300 KB (WhatsApp drops larger previews)',
  (ogMeta?.size ??
    (await stat(ogFile)
      .then((s) => s.size)
      .catch(() => Infinity))) < 300_000,
)

// --------------------------------------------------------------- runtime --

const preview = await startPreview(4177)
let browser
try {
  browser = await launchBrowser()

  for (const motion of ['no-preference', 'reduce']) {
    const label = motion === 'reduce' ? 'reduced motion' : 'motion allowed'
    section(`Hero, ${label}`)
    const page = await browser.newPage()
    const errors = []
    const info = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text())
      if (m.type() === 'info') info.push(m.text())
    })
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: motion }])
    // Headless Chrome reports no pointer at all, so hover-only features switch
    // themselves off. Stand in for a desktop mouse; the reduced-motion part of
    // each query is still answered by the real media engine.
    await page.evaluateOnNewDocument(() => {
      const real = window.matchMedia.bind(window)
      window.matchMedia = (query) => {
        if (!/hover: hover|pointer: fine/.test(query)) return real(query)
        const rest = query
          .split(' and ')
          .filter((q) => !/hover: hover|pointer: fine/.test(q))
          .join(' and ')
        const matches = rest ? real(rest).matches : true
        return { ...real(query), matches, media: query }
      }
    })
    await page.setViewport({ width: 1440, height: 900 })
    await page.goto(`${preview.base}/?tier=low`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await sleep(150)

    const read = () =>
      page.evaluate(() => {
        const role = document.querySelector('#top p')
        const visibleRole = role?.querySelector('[data-decode]')?.textContent ?? ''
        const srRole = role?.querySelector('.sr-only')?.textContent ?? ''
        const stats = [...document.querySelectorAll('#top dl dd > span:first-child')].map((s) => ({
          sr: s.querySelector('.sr-only')?.textContent ?? s.textContent,
          shown: s.querySelector('[aria-hidden]')?.textContent ?? s.textContent,
        }))
        return { visibleRole, srRole, stats }
      })

    const early = await read()
    const expectedRole = early.srRole
    check(
      `${label}: the real role line is always there for screen readers`,
      /Software Developer/.test(expectedRole),
      expectedRole,
    )
    check(
      `${label}: stats' real values are always in the DOM`,
      early.stats.map((s) => s.sr).join(',') === '13,20+,2,100%',
      early.stats.map((s) => s.sr).join(', '),
    )
    if (motion === 'reduce') {
      check(
        `${label}: the role line is never scrambled`,
        early.visibleRole === expectedRole,
        early.visibleRole,
      )
      check(
        `${label}: stats show their values at once`,
        early.stats.every((s) => s.shown === s.sr),
        early.stats.map((s) => s.shown).join(', '),
      )
    } else {
      check(
        `${label}: the role line starts scrambled`,
        early.visibleRole !== expectedRole,
        early.visibleRole,
      )
    }

    await sleep(3000)
    const late = await read()
    check(
      `${label}: the role line settles on the real text`,
      late.visibleRole === expectedRole,
      late.visibleRole,
    )
    check(
      `${label}: stats settle on their values`,
      late.stats.every((s) => s.shown === s.sr),
      late.stats.map((s) => s.shown).join(', '),
    )

    // Magnet: hover just beside the primary button and see whether it moves.
    const box = await page.$eval('#top a[href="#work"]', (a) => {
      const r = a.getBoundingClientRect()
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }
    })
    await page.mouse.move(box.x + box.w / 2 + 20, box.y)
    await sleep(600)
    const transform = await page.$eval('#top a[href="#work"]', (a) => a.style.transform)
    if (motion === 'reduce') {
      check(`${label}: buttons stay put`, !transform, transform || 'none')
    } else {
      check(
        `${label}: the primary button leans toward a nearby pointer`,
        /translate/.test(transform),
        transform,
      )
    }

    if (motion === 'no-preference') {
      section('Scene reveal and console')
      await sleep(4000)
      const reveal = await page.evaluate(() => {
        const ready = document.querySelector('[data-scene-ready]')
        return { ready: !!ready, opacity: ready ? getComputedStyle(ready).opacity : null }
      })
      check(
        'the scene fades in once its shaders are compiled',
        reveal.ready && reveal.opacity === '1',
        `opacity ${reveal.opacity}`,
      )
      check('the hero text is readable before the scene is ready (never blocked)', !!early.srRole)
      check(
        'the console carries a note for the curious',
        info.some((t) => /read source/.test(t)),
      )
    }
    check(`${label}: no page or console errors`, !errors.length, errors.slice(0, 2).join(' | '))
    await page.close()
  }

  section('Links, buttons and section reveals (5.3)')
  {
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    // CLS over a full read of the page, reveals included.
    await page.evaluateOnNewDocument(() => {
      window.__cls = 0
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value
      }).observe({ type: 'layout-shift', buffered: true })
    })
    await page.setViewport({ width: 1440, height: 900 })
    await page.goto(`${preview.base}/?tier=low`, { waitUntil: 'networkidle0', timeout: 60_000 })
    await sleep(1500)

    const hiddenAtLoad = await page.evaluate(
      () =>
        [...document.querySelectorAll('.reveal')]
          .filter((el) => el.getBoundingClientRect().top < innerHeight)
          .filter((el) => Number(getComputedStyle(el).opacity) < 0.99).length,
    )
    check('nothing in the first viewport waits for a reveal', hiddenAtLoad === 0, `${hiddenAtLoad}`)

    // Read the page top to bottom, in viewport steps.
    const height = await page.evaluate(() => document.documentElement.scrollHeight)
    for (let y = 0; y < height; y += 700) {
      await page.evaluate((y) => window.scrollTo(0, y), y)
      await sleep(250)
    }
    await page.evaluate(() => window.scrollTo(0, 0))
    await sleep(800)
    const count = await page.$$eval('.reveal', (els) => els.length)
    let settled = 0
    for (let i = 0; i < count; i++) {
      await page.evaluate((i) => {
        const el = document.querySelectorAll('.reveal')[i]
        const r = el.getBoundingClientRect()
        // Its top a third of the way down: well past the reveal's end range.
        window.scrollTo(0, r.top + scrollY - innerHeight / 3)
      }, i)
      // Polled: under software GL a layer mounting as its article arrives can
      // hold the main thread long enough to delay the scroll timeline's update.
      for (let t = 0; t < 25; t++) {
        await sleep(200)
        const opacity = await page.evaluate(
          (i) => Number(getComputedStyle(document.querySelectorAll('.reveal')[i]).opacity),
          i,
        )
        if (opacity > 0.99) {
          settled += 1
          break
        }
      }
    }
    const reveals = { all: count, settled }
    check(
      'every section and article reveals fully once in view',
      reveals.all > 0 && reveals.settled === reveals.all,
      `${reveals.settled}/${reveals.all}`,
    )
    const cls = await page.evaluate(() => window.__cls)
    check('reading the whole page shifts no layout (CLS < 0.05)', cls < 0.05, cls.toFixed(3))

    // Links: an underline at rest, the accent rule drawn in on hover.
    const link = '#contact a.link[href^="mailto:"]'
    await page.$eval(link, (el) => el.scrollIntoView({ block: 'center' }))
    await sleep(300)
    const size = () =>
      page.$eval(link, (el) => getComputedStyle(el).backgroundSize.split(',')[0].trim())
    const rest = await size()
    await page.hover(link)
    await sleep(600)
    const hover = await size()
    check(
      'a text link draws its accent underline in on hover',
      rest.startsWith('0%') && hover.startsWith('100%'),
      `${rest} → ${hover}`,
    )
    const ruled = await page.evaluate(() =>
      [...document.querySelectorAll('main a.link')].every((a) =>
        /linear-gradient/.test(getComputedStyle(a).backgroundImage),
      ),
    )
    check('every text link is underlined at rest, not by colour alone', ruled)

    // The contact form's states, against a stand-in for the form service.
    await page.setRequestInterception(true)
    let respond = null
    page.on('request', (r) => {
      if (!r.url().includes('api.web3forms.com')) return r.continue()
      respond = (ok) =>
        r.respond({
          status: 200,
          contentType: 'application/json',
          // Cross-origin: without this the browser rejects the stand-in response.
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify(
            ok ? { success: true } : { success: false, message: 'Test failure' },
          ),
        })
    })
    const fill = async () => {
      await page.$eval('#contact form', (f) => f.scrollIntoView({ block: 'center' }))
      await page.type('#name', 'Test')
      await page.type('#email', 'test@example.com')
      await page.type('#message', 'Hello')
      await page.click('#contact button[type="submit"]')
      for (let i = 0; i < 40 && !respond; i++) await sleep(100)
    }
    const button = () =>
      page.$eval('#contact button[type="submit"]', (b) => ({
        disabled: b.disabled,
        busy: b.getAttribute('aria-busy'),
        text: b.textContent,
      }))
    const live = () => page.$eval('#contact [aria-live]', (el) => el.textContent ?? '')

    await fill()
    const sending = await button()
    check(
      'submit: disabled and marked busy while sending',
      sending.disabled && sending.busy === 'true' && /Sending/.test(sending.text),
      JSON.stringify(sending),
    )
    respond?.(true)
    respond = null
    await sleep(500)
    check('submit: success is announced', /reached my inbox/.test(await live()))
    check('submit: the button is usable again', !(await button()).disabled)

    await fill()
    respond?.(false)
    respond = null
    await sleep(500)
    check(
      'submit: a failure is announced, with email as the way out',
      /Test failure/.test(await live()) && /Email me instead/.test(await live()),
    )
    check('5.3: no page errors', !errors.length, errors.slice(0, 2).join(' | '))
    await page.close()
  }

  {
    const page = await browser.newPage()
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
    await page.setViewport({ width: 1440, height: 900 })
    await page.goto(`${preview.base}/`, { waitUntil: 'networkidle0', timeout: 60_000 })
    const animated = await page.evaluate(
      () =>
        [...document.querySelectorAll('.reveal')].filter(
          (el) => getComputedStyle(el).animationName !== 'none',
        ).length,
    )
    check('reduced motion: no section reveals', animated === 0, `${animated} animated`)
    await page.close()
  }

  section('404')
  {
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
    await page.goto(`${preview.base}/404.html`, { waitUntil: 'load' })
    const view = await page.evaluate(() => ({
      path: document.getElementById('path')?.textContent,
      width: document.documentElement.scrollWidth,
      back: !!document.querySelector('a[href="/"]'),
    }))
    check('404: shows the path that was asked for', view.path === '/404.html', view.path)
    check('404: a route back to the top', view.back)
    check('404: no horizontal overflow on a phone', view.width <= 390, `page width ${view.width}`)
    check('404: no errors', !errors.length, errors.join(' | '))
    await page.close()
  }
} catch (err) {
  check('runtime suite ran', false, err instanceof Error ? err.message : String(err))
} finally {
  await closeBrowser(browser)
  preview.stop()
}

finish('Phase 5 verified.')
