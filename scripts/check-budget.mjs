// Fails the build when a bundle exceeds the budgets in ARCHITECTURE.md §6.
// Runs in CI after `vite build`, against the gzipped size of each emitted chunk.
import { readdir, readFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'

const DIST = 'dist/assets'

// Budgets in KB (gzip). "entry" is what index.html actually pulls on first
// paint; everything else is lazy. Classifying by filename was wrong — it hid a
// `three` modulepreload in the entry graph and miscounted lazy chunks as eager.
const BUDGETS = { lazy: 600, entry: 180 }

const html = await readFile('dist/index.html', 'utf8')
const eager = new Set([...html.matchAll(/\/assets\/([^"']+)/g)].map((m) => m[1]))

const files = await readdir(DIST)
let entryTotal = 0
let lazyTotal = 0
const rows = []

for (const f of files) {
  if (!f.endsWith('.js') && !f.endsWith('.css')) continue
  const buf = await readFile(join(DIST, f))
  const kb = gzipSync(buf).length / 1024
  const isEager = eager.has(f)
  if (isEager) entryTotal += kb
  else lazyTotal += kb
  rows.push([f, kb, isEager ? 'entry' : 'lazy'])
}

rows.sort((a, b) => b[1] - a[1])
for (const [name, kb, group] of rows) {
  console.log(`  ${kb.toFixed(1).padStart(7)} KB gz  ${group.padEnd(5)}  ${name}`)
}

const fails = []
if (lazyTotal > BUDGETS.lazy) fails.push(`lazy chunks ${lazyTotal.toFixed(1)} KB > ${BUDGETS.lazy} KB`)
if (entryTotal > BUDGETS.entry) fails.push(`entry bundle ${entryTotal.toFixed(1)} KB > ${BUDGETS.entry} KB`)

// three must never be eager: it is the whole point of the lazy Canvas.
const eagerThree = rows.find(([n, , g]) => n.startsWith('three-') && g === 'entry')
if (eagerThree) fails.push(`three is in the entry graph (${eagerThree[0]}) — something imports it eagerly`)

console.log(
  `\n  entry ${entryTotal.toFixed(1)}/${BUDGETS.entry} KB gz` +
    `   lazy ${lazyTotal.toFixed(1)}/${BUDGETS.lazy} KB gz`,
)

if (fails.length) {
  console.error('\nBudget exceeded:\n  ' + fails.join('\n  '))
  process.exit(1)
}
console.log('\nBudgets OK.')
