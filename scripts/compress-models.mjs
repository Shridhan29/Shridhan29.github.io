// Compresses source glTF models into what the scene ships.
//
//   npm run models                      every model in assets-source/models/
//   npm run models -- kiosk.glb         just the named sources
//
// assets-source/models/*.{glb,gltf} → public/models/<name>.glb
//
// Pipeline: dedup → prune → weld → simplify (borders locked) → textures to WebP
// ≤ 1024 px, lossless for normal maps → meshopt (quantize + reorder + compress).
//
// Meshopt rather than Draco: its decoder is a few KB of JS already inside the
// three chunk, while Draco needs a separate ~300 KB decoder that drei fetches
// from gstatic.com unless told otherwise. WebP rather than KTX2: KTX2 encoding
// needs the `toktx` binary, which npm cannot install, on every machine and in
// CI. Revisit if a texture-heavy asset makes GPU memory the constraint.
//
// Every source must be credited in public/models/CREDITS.md, by filename, even
// where its licence (CC0) does not require it.
import { Logger, NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, meshopt, prune, simplify, textureCompress, weld } from '@gltf-transform/functions'
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer'
import sharp from 'sharp'
import { mkdir, readdir, readFile, stat } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { parseArgs } from 'node:util'
import { MAX_TEXTURE_PX, MODEL_KB, SIMPLIFY } from './budgets.mjs'

const { values: opts, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    // Overridable so verify-models.mjs can run the real pipeline on a fixture.
    src: { type: 'string', default: 'assets-source/models' },
    out: { type: 'string', default: 'public/models' },
    credits: { type: 'string', default: 'public/models/CREDITS.md' },
  },
})

// Per-model exceptions, keyed by output name. Simplification is on by default
// and bounded by `error`, so it stops before it visibly changes a silhouette;
// switch it off for anything whose low-poly facets are the look.
const OVERRIDES = {
  // kiosk: { simplify: false },
}

const DEFAULTS = { simplify: true, ...SIMPLIFY }

await MeshoptDecoder.ready
await MeshoptEncoder.ready
await MeshoptSimplifier.ready

const io = new NodeIO()
  .setLogger(new Logger(Logger.Verbosity.WARN))
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    'meshopt.decoder': MeshoptDecoder,
    'meshopt.encoder': MeshoptEncoder,
  })

const sources = positionals.length
  ? positionals
  : (await readdir(opts.src).catch(() => [])).filter((f) => /\.(glb|gltf)$/i.test(f))

if (!sources.length) {
  console.log(`No models in ${opts.src}/ — nothing to do.`)
  process.exit(0)
}

// Whole filenames only, so crediting `data.glb` does not also credit `a.glb`.
const credits = new Set(
  (await readFile(opts.credits, 'utf8').catch(() => '')).split(/[\s|`/]+/).filter(Boolean),
)
const uncredited = sources.filter((f) => !credits.has(f))
if (uncredited.length) {
  console.error(`Not credited in ${opts.credits}:\n  ${uncredited.join('\n  ')}`)
  console.error('Add each source with its author, URL and licence before compressing.')
  process.exit(1)
}

await mkdir(opts.out, { recursive: true })

const triangles = (doc) =>
  doc
    .getRoot()
    .listMeshes()
    .flatMap((m) => m.listPrimitives())
    .reduce(
      (n, p) => n + (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3,
      0,
    )

const fails = []

for (const file of sources) {
  const name = basename(file, extname(file))
  const cfg = { ...DEFAULTS, ...OVERRIDES[name] }
  const input = join(opts.src, file)
  const output = join(opts.out, `${name}.glb`)

  const doc = await io.read(input)
  const before = { kb: (await stat(input)).size / 1024, tris: triangles(doc) }

  await doc.transform(
    dedup(),
    prune(),
    weld(),
    ...(cfg.simplify
      ? [
          simplify({
            simplifier: MeshoptSimplifier,
            ratio: cfg.ratio,
            error: cfg.error,
            lockBorder: cfg.lockBorder,
          }),
        ]
      : []),
    // Colour and packed-data maps tolerate lossy WebP. Normal maps do not:
    // block artefacts in a normal map become visible faceting under light.
    textureCompress({
      encoder: sharp,
      targetFormat: 'webp',
      resize: [MAX_TEXTURE_PX, MAX_TEXTURE_PX],
      slots: /^(?!normalTexture$)/,
    }),
    textureCompress({
      encoder: sharp,
      targetFormat: 'webp',
      resize: [MAX_TEXTURE_PX, MAX_TEXTURE_PX],
      slots: /^normalTexture$/,
      lossless: true,
    }),
    // Pruning again drops anything simplification or dedup orphaned.
    prune(),
    meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
  )

  await io.write(output, doc)
  const after = { kb: (await stat(output)).size / 1024, tris: triangles(doc) }

  console.log(
    `  ${name.padEnd(24)} ${before.kb.toFixed(0).padStart(6)} → ${after.kb.toFixed(0).padStart(4)} KB` +
      `   ${before.tris.toLocaleString()} → ${after.tris.toLocaleString()} tris`,
  )
  if (after.kb > MODEL_KB.each) {
    fails.push(`${name}.glb is ${after.kb.toFixed(0)} KB > ${MODEL_KB.each} KB`)
  }
}

if (fails.length) {
  console.error(`\nOver budget:\n  ${fails.join('\n  ')}`)
  process.exit(1)
}
