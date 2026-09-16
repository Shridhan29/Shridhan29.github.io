/**
 * One command to confirm the whole project is in a good state.
 *
 *   npm run verify              everything local
 *   npm run verify -- --live    also confirm the live site serves this build
 *   npm run verify -- --verbose stream every step's output, not just failures
 *
 * Steps run in order. A step that depends on an earlier one (the browser suite
 * needs the build) is skipped, not run against stale output, when that step
 * fails. Exits non-zero if anything failed or was skipped.
 *
 * The browser suite needs Chrome or Chromium. If it is not installed in a
 * standard location, set CHROME_PATH to its executable.
 */
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const args = new Set(process.argv.slice(2))
const VERBOSE = args.has('--verbose')
const LIVE = args.has('--live')
const LIVE_URL = 'https://shridhan29.github.io/'

const c = (code) => (s) => (process.stdout.isTTY ? `\x1b[${code}m${s}\x1b[0m` : s)
const green = c(32)
const red = c(31)
const yellow = c(33)
const dim = c(2)
const bold = c(1)

/** Runs a fixed command through the platform shell, so `npm` resolves on Windows. */
function run(command) {
  return new Promise((resolve) => {
    const child = spawn(command, { shell: true, stdio: VERBOSE ? 'inherit' : 'pipe' })
    let output = ''
    child.stdout?.on('data', (d) => (output += d))
    child.stderr?.on('data', (d) => (output += d))
    child.on('close', (code) => resolve({ ok: code === 0, output }))
  })
}

const results = []

async function step(name, fn, { needs } = {}) {
  const blocker = needs && results.find((r) => r.name === needs && r.status !== 'pass')
  if (blocker) {
    results.push({ name, status: 'skip', detail: `needs "${needs}"` })
    console.log(`${yellow('SKIP')}  ${name}  ${dim(`needs "${needs}"`)}`)
    return
  }
  // The in-progress line is rewritten in place, which only works on a terminal.
  const live = process.stdout.isTTY && !VERBOSE
  if (live) process.stdout.write(`${dim('....')}  ${name}`)
  else if (VERBOSE) console.log(`${dim('....')}  ${name}`)
  const started = Date.now()
  let res
  try {
    res = await fn()
  } catch (err) {
    res = { ok: false, output: err instanceof Error ? err.message : String(err) }
  }
  const secs = ((Date.now() - started) / 1000).toFixed(1)
  const status = res.ok ? 'pass' : 'fail'
  results.push({ name, status, detail: res.detail ?? '' })
  const label = res.ok ? green('PASS') : red('FAIL')
  const line = `${label}  ${name}  ${dim(`${secs}s`)}${res.detail ? `  ${res.detail}` : ''}`
  console.log(live ? `\r${line}` : line)
  if (!res.ok && !VERBOSE && res.output) {
    const tail = res.output.trim().split('\n').slice(-40).join('\n')
    console.log(dim(tail.replace(/^/gm, '      ')))
  }
}

console.log(bold('\nProject verification\n'))

// ------------------------------------------------------------ environment --

await step('environment', async () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
  const [major, minor] = process.versions.node.split('.').map(Number)
  // engines: ^20.19.0 || >=22.12.0
  const nodeOk = (major === 20 && minor >= 19) || major > 22 || (major === 22 && minor >= 12)
  if (!nodeOk) {
    return {
      ok: false,
      output: `Node ${process.versions.node} does not satisfy ${pkg.engines.node}`,
    }
  }
  if (!existsSync('node_modules/.package-lock.json')) {
    return { ok: false, output: 'Dependencies are not installed. Run: npm ci' }
  }
  return { ok: true, detail: `Node ${process.versions.node}` }
})

// ------------------------------------------------------------------ source --

await step('format (Prettier)', () => run('npm run format:check'), { needs: 'environment' })
await step('lint (oxlint)', () => run('npm run lint'), { needs: 'environment' })
await step('typecheck (tsc)', () => run('npm run typecheck'), { needs: 'environment' })

// ------------------------------------------------------------------- build --

await step(
  'build + bundle and model budgets',
  async () => {
    const res = await run('npm run build')
    const summary = /entry [\d.]+\/\d+ KB gz.*$/m.exec(res.output)?.[0]
    return { ...res, detail: summary ? dim(summary.replace(/\s+/g, ' ')) : '' }
  },
  { needs: 'environment' },
)

// ------------------------------------------------------------------ suites --

const suite = (script) => async () => {
  const res = await run(`npm run ${script}`)
  const counts = /(\d+) passed, (\d+) failed/.exec(res.output)
  return { ...res, detail: counts ? dim(`${counts[1]} passed, ${counts[2]} failed`) : '' }
}

await step('model pipeline (verify:models)', suite('verify:models'), { needs: 'environment' })
await step('Phase 2 camera + browser (verify:phase2)', suite('verify:phase2'), {
  needs: 'build + bundle and model budgets',
})

// -------------------------------------------------------------------- live --

if (LIVE) {
  await step(
    'live site serves this build',
    async () => {
      const assets = (html) =>
        [...html.matchAll(/assets\/[^"']+\.(?:js|css)/g)].map((m) => m[0]).sort()
      const local = assets(readFileSync('dist/index.html', 'utf8'))
      const res = await fetch(LIVE_URL, { cache: 'no-store' })
      if (!res.ok) return { ok: false, output: `${LIVE_URL} returned HTTP ${res.status}` }
      const live = assets(await res.text())
      const same = JSON.stringify(local) === JSON.stringify(live)
      const git = await run('git status --porcelain')
      const dirty = git.output.trim() !== ''
      return {
        ok: same,
        detail: dim(`HTTP ${res.status}`),
        output: same
          ? ''
          : `Asset hashes differ.\n  local: ${local.join(', ')}\n  live:  ${live.join(', ')}\n` +
            (dirty
              ? 'The working tree has uncommitted changes, so this is expected until they are pushed.'
              : 'Nothing is uncommitted: push main, or wait for the deploy workflow to finish.'),
      }
    },
    { needs: 'build + bundle and model budgets' },
  )
}

// ----------------------------------------------------------------- summary --

const failed = results.filter((r) => r.status === 'fail')
const skipped = results.filter((r) => r.status === 'skip')
const passed = results.length - failed.length - skipped.length

console.log(
  `\n${bold('Summary')}  ${green(`${passed} passed`)}, ` +
    `${failed.length ? red(`${failed.length} failed`) : '0 failed'}, ` +
    `${skipped.length ? yellow(`${skipped.length} skipped`) : '0 skipped'}`,
)
if (failed.length || skipped.length) {
  for (const r of [...failed, ...skipped]) console.log(`  - ${r.status}: ${r.name}`)
  process.exit(1)
}
console.log(green('Everything verified.'))
