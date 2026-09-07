// Fails the build when a bundle exceeds the budgets in ARCHITECTURE.md §6.
// Runs in CI after `vite build`, against the gzipped size of each emitted chunk.
import { readdir, readFile, stat } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'

const DIST = 'dist/assets'

// Budgets in KB (gzip). `three` is the lazy 3D payload; everything else is the
// initial download and must stay under the 180 KB entry budget combined.
const BUDGETS = { three: 600, entry: 180 }

const files = await readdir(DIST)
let entryTotal = 0
let threeTotal = 0
const rows = []

for (const f of files) {
  if (!f.endsWith('.js') && !f.endsWith('.css')) continue
  const buf = await readFile(join(DIST, f))
  const kb = gzipSync(buf).length / 1024
  const isThree = f.startsWith('three-')
  if (isThree) threeTotal += kb
  else entryTotal += kb
  rows.push([f, kb, isThree ? 'three' : 'entry'])
}

rows.sort((a, b) => b[1] - a[1])
for (const [name, kb, group] of rows) {
  console.log(`  ${kb.toFixed(1).padStart(7)} KB gz  ${group.padEnd(5)}  ${name}`)
}

const fails = []
if (threeTotal > BUDGETS.three) fails.push(`three chunk ${threeTotal.toFixed(1)} KB > ${BUDGETS.three} KB`)
if (entryTotal > BUDGETS.entry) fails.push(`entry bundle ${entryTotal.toFixed(1)} KB > ${BUDGETS.entry} KB`)

console.log(
  `\n  entry ${entryTotal.toFixed(1)}/${BUDGETS.entry} KB gz` +
    `   three ${threeTotal.toFixed(1)}/${BUDGETS.three} KB gz`,
)

if (fails.length) {
  console.error('\nBudget exceeded:\n  ' + fails.join('\n  '))
  process.exit(1)
}
console.log('\nBudgets OK.')
