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
import { readdir, readFile, stat } from 'node:fs/promises'
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

section('Analytics (6.8)')

const analytics = await readFile('src/analytics.ts', 'utf8')
check('analytics are off unless the build is given a site code', /if \(!CODE \|\|/.test(analytics))
check(
  'Do Not Track, Global Privacy Control and automated browsers are never counted',
  /doNotTrack === '1'/.test(analytics) &&
    /globalPrivacyControl/.test(analytics) &&
    /webdriver/.test(analytics),
)
const builtJs = (
  await Promise.all(
    (await readdir('dist/assets'))
      .filter((f) => f.endsWith('.js'))
      .map((f) => readFile(`dist/assets/${f}`, 'utf8')),
  )
).join('\n')
check(
  process.env.VITE_GOATCOUNTER
    ? 'this build carries the site code it was given'
    : 'a build without a site code never mentions a counting endpoint',
  process.env.VITE_GOATCOUNTER
    ? builtJs.includes(process.env.VITE_GOATCOUNTER) && /\.goatcounter\.com\/count/.test(builtJs)
    : !/\.goatcounter\.com\/count/.test(builtJs),
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

    // The role line decodes and the stats count up once in view (1.2 s); a busy
    // machine gets up to 8 s for both to settle rather than one fixed pause.
    let late = await read()
    for (
      let t = 0;
      t < 32 && !(late.visibleRole === expectedRole && late.stats.every((s) => s.shown === s.sr));
      t++
    ) {
      await sleep(250)
      late = await read()
    }
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
      // The largest shift and what moved, so a failure names its cause.
      window.__worst = { value: 0, what: '' }
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (e.hadRecentInput) continue
          window.__cls += e.value
          if (e.value > window.__worst.value) {
            const s = e.sources?.[0]
            const n = s?.node
            const name =
              n?.nodeType === 1
                ? `${n.tagName.toLowerCase()}.${String(n.className).slice(0, 50)}`
                : String(n?.nodeName)
            window.__worst = {
              value: e.value,
              what: s
                ? `${name} y ${Math.round(s.previousRect.y)}→${Math.round(s.currentRect.y)} at scrollY ${Math.round(scrollY)}`
                : '',
            }
          }
        }
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
    const { cls, worst } = await page.evaluate(() => ({ cls: window.__cls, worst: window.__worst }))
    check(
      'reading the whole page shifts no layout (CLS < 0.05)',
      cls < 0.05,
      cls < 0.05
        ? cls.toFixed(3)
        : `${cls.toFixed(3)}; largest ${worst.value.toFixed(3)}: ${worst.what}`,
    )

    // Links: an underline at rest, the accent rule drawn in on hover.
    const link = '#contact a.link[href^="mailto:"]'
    await page.$eval(link, (el) => el.scrollIntoView({ block: 'center' }))
    await sleep(300)
    const size = () =>
      page.$eval(link, (el) => getComputedStyle(el).backgroundSize.split(',')[0].trim())
    const rest = await size()
    await page.hover(link)
    // The rule draws in over 0.35 s; a busy machine gets up to 3 s to finish it.
    let hover = await size()
    for (let t = 0; t < 30 && !hover.startsWith('100%'); t++) {
      await sleep(100)
      hover = await size()
    }
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

    // The scroll redesign's finished state: no pin adds height, and every
    // word of a scrubbed sentence is fully drawn.
    const still = await page.evaluate(() => ({
      pins: [...document.querySelectorAll('.pin-track')].map((t) => {
        const sticky = t.querySelector('.pin-sticky')
        return Math.round(t.getBoundingClientRect().height - (sticky?.offsetHeight ?? 0))
      }),
      dim: [...document.querySelectorAll('.scrub-word')].filter(
        (w) => getComputedStyle(w).opacity !== '1',
      ).length,
    }))
    check(
      'reduced motion: pinned sections add no scroll height',
      still.pins.length > 0 && still.pins.every((extra) => extra <= 2),
      `extra px per pin: ${still.pins.join(', ')}`,
    )
    check(
      'reduced motion: every scrubbed word is fully drawn',
      still.dim === 0,
      `${still.dim} dimmed`,
    )
    await page.mouse.move(700, 450)
    await page.mouse.move(720, 470, { steps: 4 })
    await sleep(400)
    const ringShown = await page.evaluate(() => {
      const el = document.querySelector('.cursor-ring')
      return !!el && Number(getComputedStyle(el).opacity) > 0
    })
    check('reduced motion: no cursor ring', !ringShown)
    await page.close()
  }

  section('Scroll redesign')
  {
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.setViewport({ width: 1440, height: 900 })
    await page.goto(`${preview.base}/`, { waitUntil: 'networkidle0', timeout: 60_000 })

    const scrub = await page.evaluate(() =>
      [...document.querySelectorAll('.scrub-word')]
        .map((w) => w.closest('[aria-hidden]'))
        .filter((h, i, all) => h && all.indexOf(h) === i)
        .map((hidden) => ({
          drawn: hidden.textContent,
          // WordScrub's visually hidden copy sits right before the drawn words.
          read: hidden.previousElementSibling?.matches('.sr-only')
            ? hidden.previousElementSibling.textContent
            : null,
        })),
    )
    check(
      'scrubbed sentences are read once, whole, from a hidden copy',
      scrub.length > 0 && scrub.every((s) => s.read === s.drawn),
      `${scrub.length} sentences`,
    )

    const pin = await page.evaluate(() => {
      const t = document.querySelector('#statement')
      return t ? t.getBoundingClientRect().height / innerHeight : 0
    })
    check('the statement is pinned for its scroll', pin > 1.5, `${pin.toFixed(2)} viewports tall`)

    // A screenshot strip: focusable, and its arrows page through it and stop at the ends.
    const strip = async () =>
      page.evaluate(() => {
        const u = document.querySelector('#truuna ul[tabindex="0"]')
        const back = document.querySelector('#truuna [aria-label="Scroll screens back"]')
        const next = document.querySelector('#truuna [aria-label="Scroll screens forward"]')
        return {
          found: !!u && !!back && !!next,
          left: u?.scrollLeft ?? 0,
          back: back?.disabled,
          next: next?.disabled,
        }
      })
    await page.evaluate(() =>
      document.querySelector('#truuna ul[tabindex="0"]')?.scrollIntoView({ block: 'center' }),
    )
    await sleep(600)
    const start = await strip()
    check('strip: focusable, with back and forward buttons', start.found)
    check(
      'strip: back is disabled at the start',
      start.back === true && start.left <= 4,
      `back ${start.back ? 'disabled' : 'enabled'} at ${Math.round(start.left)} px`,
    )
    // Page forward until the button disables. Each smooth scroll is allowed to
    // settle first, so a slow machine needs more time, never more luck.
    for (let i = 0; i < 20 && !(await strip()).next; i++) {
      await page.evaluate(() =>
        document.querySelector('#truuna [aria-label="Scroll screens forward"]')?.click(),
      )
      let prev = -1
      for (let t = 0; t < 30; t++) {
        await sleep(150)
        const { left } = await strip()
        if (Math.abs(left - prev) < 1) break
        prev = left
      }
    }
    const end = await strip()
    check(
      'strip: forward pages it, and is disabled at the end',
      end.left > start.left && end.next === true && end.back === false,
      `scrolled ${Math.round(end.left)} px; forward ${end.next ? 'disabled' : 'enabled'}, back ${end.back ? 'disabled' : 'enabled'}`,
    )

    // The cursor ring: absent until the mouse moves, then trailing it, wider
    // over a link, and never in the way of a click.
    const ring = () =>
      page.evaluate(() => {
        const el = document.querySelector('.cursor-ring')
        const cs = el && getComputedStyle(el)
        return {
          found: !!el,
          opacity: cs ? Number(cs.opacity) : 0,
          hot: !!el?.hasAttribute('data-hot'),
          inert: cs?.pointerEvents === 'none',
        }
      })
    const before = await ring()
    check(
      'cursor ring: present, inert, and hidden before the mouse moves',
      before.found && before.inert && before.opacity === 0,
      JSON.stringify(before),
    )
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.mouse.move(700, 450)
    await page.mouse.move(720, 470, { steps: 4 })
    await sleep(400)
    const moved = await ring()
    check('cursor ring: shown once the mouse moves', moved.opacity > 0.3, JSON.stringify(moved))
    const link = await page.$('header a[href="#work"], nav a[href="#work"]')
    if (link) {
      await link.hover()
      await sleep(400)
    }
    const over = await ring()
    check('cursor ring: widens over a link', !!link && over.hot, JSON.stringify(over))
    check('scroll redesign: no page errors', !errors.length, errors.slice(0, 2).join(' | '))
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
