// Shared plumbing for the verification suites: PASS/FAIL reporting, finding a
// browser, and serving the production build. Each suite keeps only its checks.
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import puppeteer from 'puppeteer-core'

// ----------------------------------------------------------------- report --

export function createReport() {
  let passed = 0
  const failures = []

  return {
    check(name, ok, detail = '') {
      const label = ok ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'
      if (ok) passed++
      else failures.push(name)
      console.log(`  ${label}  ${name}${detail ? `  ${detail}` : ''}`)
    },

    section(title) {
      console.log(`\n\x1b[1m${title}\x1b[0m`)
    },

    /** Prints the totals and exits non-zero if anything failed. */
    finish(success) {
      console.log(`\n${passed} passed, ${failures.length} failed`)
      if (failures.length) {
        console.log('\nFailed:')
        for (const f of failures) console.log(`  - ${f}`)
        process.exit(1)
      }
      console.log(`\x1b[32m${success}\x1b[0m`)
    },
  }
}

// ---------------------------------------------------------------- browser --

// Checked synchronously: an async predicate passed to .find() returns a Promise,
// which is always truthy, so the first candidate would win whether or not it exists.
export const CHROME_CANDIDATES = [
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  process.env.LOCALAPPDATA &&
    join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe'),
].filter(Boolean)

export const CHROME = process.env.CHROME_PATH ?? CHROME_CANDIDATES.find((p) => existsSync(p))

export function launchBrowser() {
  if (!CHROME) {
    throw new Error(`no Chrome found; set CHROME_PATH (looked in: ${CHROME_CANDIDATES.join(', ')})`)
  }
  return puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: [
      '--no-sandbox',
      // Software WebGL, so this runs the same on a CI box with no GPU.
      '--enable-unsafe-swiftshader',
      '--use-angle=swiftshader',
    ],
  })
}

/** A real phone viewport. A desktop window at 390 px hides mobile-only layout bugs. */
export const PHONE = {
  width: 390,
  height: 844,
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2,
}

// ----------------------------------------------------------------- server --

/**
 * Serves dist/ with `vite preview`. Vite's CLI runs through this Node binary
 * rather than `npx`: spawning `npx` fails with ENOENT on Windows (it is
 * `npx.cmd` there), and a shell wrapper would leave stop() killing the shell
 * instead of the server.
 */
export async function startPreview(port) {
  const base = `http://localhost:${port}`
  const server = spawn(
    process.execPath,
    ['node_modules/vite/bin/vite.js', 'preview', '--port', String(port), '--strictPort'],
    { stdio: 'ignore' },
  )
  const stop = () => server.kill()

  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(base)).ok) return { base, stop }
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  stop()
  throw new Error(`preview server never came up on ${base}`)
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Navigation options for pages that render the 3D scene. Waits for the network
 * to go quiet so the lazy Canvas chunk has arrived. The timeout is doubled from
 * Puppeteer's 30 s: under software GL the first frame can hold the main thread
 * for seconds, and one slow load on a busy machine failed a whole suite.
 */
export const NAV = { waitUntil: 'networkidle0', timeout: 60_000 }
