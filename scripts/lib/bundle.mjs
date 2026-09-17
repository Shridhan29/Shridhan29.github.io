// What a first visit actually downloads before any lazy import runs.
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * The eager asset set: everything index.html references, plus every chunk those
 * files statically import, recursively. Dynamic `import("./x.js")` is excluded —
 * that is the lazy boundary.
 *
 * Reading only index.html was not enough. The bundler moved zustand, shared by
 * the page and by react-three-fiber, into the three chunk, and the entry
 * statically imported it from there: three.js downloaded on every first visit,
 * including the Static tier, while the budget reported a 75 KB entry.
 */
export async function eagerAssets(dist = 'dist') {
  const html = await readFile(join(dist, 'index.html'), 'utf8')
  const queue = [...html.matchAll(/\/assets\/([^"']+)/g)].map((m) => m[1])
  const eager = new Set()

  while (queue.length) {
    const file = queue.pop()
    if (eager.has(file)) continue
    eager.add(file)
    if (!file.endsWith('.js')) continue
    const code = await readFile(join(dist, 'assets', file), 'utf8')
    // `from"./x.js"` and bare `import"./x.js"`; never `import("./x.js")`.
    for (const m of code.matchAll(/(?:\bfrom|\bimport)\s*["']\.\/([^"']+\.js)["']/g)) {
      queue.push(m[1])
    }
  }
  return eager
}
