// Fails the build when a bundle or a model exceeds the budgets in ARCHITECTURE.md §6.
// Runs in CI after `vite build`, against the gzipped size of each emitted chunk.
import { readdir, readFile, stat } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'
import { BUNDLE_KB as BUDGETS, MODEL_KB } from './budgets.mjs'
import { eagerAssets } from './lib/bundle.mjs'

const DIST = 'dist/assets'

// "entry" is what a first visit downloads before any lazy import: index.html's
// assets and everything they statically import. Classifying by filename hid a
// `three` modulepreload; reading only index.html hid a static import of the
// three chunk from the entry.
const eager = await eagerAssets()

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
if (lazyTotal > BUDGETS.lazy)
  fails.push(`lazy chunks ${lazyTotal.toFixed(1)} KB > ${BUDGETS.lazy} KB`)
if (entryTotal > BUDGETS.entry)
  fails.push(`entry bundle ${entryTotal.toFixed(1)} KB > ${BUDGETS.entry} KB`)

// three must never be eager: it is the whole point of the lazy Canvas.
const eagerThree = rows.find(([n, , g]) => n.startsWith('three-') && g === 'entry')
if (eagerThree)
  fails.push(`three is in the entry graph (${eagerThree[0]}) — something imports it eagerly`)

// Models ship from public/models/ verbatim, so measure what landed in dist/.
const models = (await readdir('dist/models').catch(() => [])).filter((f) => f.endsWith('.glb'))
let modelTotal = 0
for (const f of models) {
  const kb = (await stat(join('dist/models', f))).size / 1024
  modelTotal += kb
  console.log(`  ${kb.toFixed(1).padStart(7)} KB     model  ${f}`)
  if (kb > MODEL_KB.each) fails.push(`model ${f} ${kb.toFixed(0)} KB > ${MODEL_KB.each} KB`)
}
if (modelTotal > MODEL_KB.total)
  fails.push(`models ${modelTotal.toFixed(0)} KB > ${MODEL_KB.total} KB total`)

console.log(
  `\n  entry ${entryTotal.toFixed(1)}/${BUDGETS.entry} KB gz` +
    `   lazy ${lazyTotal.toFixed(1)}/${BUDGETS.lazy} KB gz` +
    `   models ${modelTotal.toFixed(0)}/${MODEL_KB.total} KB (${models.length})`,
)

if (fails.length) {
  console.error('\nBudget exceeded:\n  ' + fails.join('\n  '))
  process.exit(1)
}
console.log('\nBudgets OK.')
