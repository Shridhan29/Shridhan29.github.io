/**
 * Phase 3.0 acceptance checks for the model pipeline.
 *
 * There are no real models yet, so this builds a fixture that has every
 * problem the pipeline exists to fix — a dense mesh, a duplicated mesh, a
 * texture far over the size limit — runs the real compress-models.mjs on it,
 * and reads the result back through the Meshopt decoder the site uses.
 *
 *   npm run verify:models
 */
import { Document, NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { MeshoptDecoder } from 'meshoptimizer'
import sharp from 'sharp'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { MAX_TEXTURE_PX, MODEL_KB, SIMPLIFY } from './budgets.mjs'
import { createReport } from './lib/harness.mjs'

const { check, section, finish } = createReport()

const tmp = await mkdtemp(join(tmpdir(), 'verify-models-'))
const src = join(tmp, 'src')
const out = join(tmp, 'out')
const credits = join(tmp, 'CREDITS.md')

try {
  // --------------------------------------------------------------- fixture --

  await MeshoptDecoder.ready
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.decoder': MeshoptDecoder })

  const doc = new Document()
  const buffer = doc.createBuffer()

  // A 200×200 grid: 80k triangles of flat plane. Every collapse is free here, so
  // simplification runs all the way down to its ratio floor.
  const N = 200
  const positions = new Float32Array((N + 1) * (N + 1) * 3)
  const uvs = new Float32Array((N + 1) * (N + 1) * 2)
  for (let y = 0, i = 0; y <= N; y++) {
    for (let x = 0; x <= N; x++, i++) {
      positions.set([x / N - 0.5, 0, y / N - 0.5], i * 3)
      uvs.set([x / N, y / N], i * 2)
    }
  }
  const indices = new Uint32Array(N * N * 6)
  for (let y = 0, i = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const a = y * (N + 1) + x
      const b = a + N + 1
      indices.set([a, b, a + 1, a + 1, b, b + 1], i)
      i += 6
    }
  }

  // Patterned, not solid: prune() replaces a single-colour texture with a
  // plain colour factor, which would leave no texture to check.
  const SIZE = 2048
  const pixels = Buffer.alloc(SIZE * SIZE * 3)
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 3
      pixels[i] = (x / SIZE) * 255
      pixels[i + 1] = (y / SIZE) * 255
      pixels[i + 2] = ((x >> 6) + (y >> 6)) % 2 ? 220 : 60
    }
  }
  const png = await sharp(pixels, { raw: { width: SIZE, height: SIZE, channels: 3 } })
    .png()
    .toBuffer()
  const albedo = doc.createTexture('albedo').setImage(png).setMimeType('image/png')
  // A different image, or dedup would fold it into the albedo texture.
  const normalPng = await sharp(png).negate().png().toBuffer()
  const normal = doc.createTexture('normal').setImage(normalPng).setMimeType('image/png')
  const material = doc.createMaterial('panel').setBaseColorTexture(albedo).setNormalTexture(normal)

  // The same geometry built twice, as a kit export often does.
  const scene = doc.createScene()
  for (const label of ['panel-a', 'panel-b']) {
    const prim = doc
      .createPrimitive()
      .setAttribute(
        'POSITION',
        doc.createAccessor().setType('VEC3').setArray(positions.slice()).setBuffer(buffer),
      )
      .setAttribute(
        'TEXCOORD_0',
        doc.createAccessor().setType('VEC2').setArray(uvs.slice()).setBuffer(buffer),
      )
      .setIndices(
        doc.createAccessor().setType('SCALAR').setArray(indices.slice()).setBuffer(buffer),
      )
      .setMaterial(material)
    scene.addChild(doc.createNode(label).setMesh(doc.createMesh(label).addPrimitive(prim)))
  }

  await mkdir(src, { recursive: true })
  await io.write(join(src, 'fixture.glb'), doc)
  const inKb = (await stat(join(src, 'fixture.glb'))).size / 1024

  const run = (...args) =>
    spawnSync(
      process.execPath,
      ['scripts/compress-models.mjs', '--src', src, '--out', out, '--credits', credits, ...args],
      { encoding: 'utf8' },
    )

  // --------------------------------------------------------------- credits --

  section('Credits gate')

  // `not-fixture.glb` contains `fixture.glb`; a substring match would wave it through.
  await writeFile(credits, '| not-fixture.glb | other asset | — | — | CC0 |\n')
  const refused = run()
  check(
    'an uncredited source is refused, even when its name is inside another credit',
    refused.status !== 0,
    `exit ${refused.status}`,
  )
  check('nothing is written for it', !existsSync(join(out, 'fixture.glb')))

  // -------------------------------------------------------------- pipeline --

  section('Compression')

  await writeFile(credits, '| fixture.glb | test fixture | — | — | CC0 |\n')
  const ran = run()
  check('pipeline exits cleanly', ran.status === 0, ran.status === 0 ? '' : ran.stderr.trim())
  if (ran.status !== 0) throw new Error('pipeline failed; skipping output checks')
  process.stdout.write(ran.stdout)

  const outFile = join(out, 'fixture.glb')
  const outKb = (await stat(outFile)).size / 1024
  check(
    'output is smaller than the source',
    outKb < inKb,
    `${inKb.toFixed(0)} → ${outKb.toFixed(0)} KB`,
  )
  check(`output is within the ${MODEL_KB.each} KB model budget`, outKb <= MODEL_KB.each)

  // The JSON chunk of a .glb starts at byte 20; its length is at byte 12.
  const glb = await readFile(outFile)
  const json = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString('utf8'))
  const used = json.extensionsUsed ?? []
  check('geometry is Meshopt-compressed', used.includes('EXT_meshopt_compression'))
  check(
    'no Draco (its decoder would be fetched from a CDN)',
    !used.includes('KHR_draco_mesh_compression'),
  )
  check('textures are WebP', used.includes('EXT_texture_webp'))

  // --------------------------------------------------------------- decoded --

  section('Decoded with the site decoder')

  const back = await io.read(outFile)
  const root = back.getRoot()
  // Dedup may fold the two meshes into one, so judge the densest mesh left.
  const trisPerMesh = root
    .listMeshes()
    .map((m) => m.listPrimitives().reduce((n, p) => n + p.getIndices().getCount() / 3, 0))
  const densest = Math.max(...trisPerMesh)
  check('it decodes', trisPerMesh.length > 0 && densest > 0)
  check(
    'duplicate geometry was merged',
    root.listAccessors().length < 6,
    `${root.listAccessors().length} accessors`,
  )
  check(
    `dense mesh was simplified to the ${SIMPLIFY.ratio} ratio floor`,
    densest <= Math.ceil(2 * N * N * SIMPLIFY.ratio),
    `${(2 * N * N).toLocaleString()} → ${densest.toLocaleString()} tris`,
  )

  const mat = root.listMaterials()[0]
  // A WebP file names its codec at byte 12: `VP8 ` is lossy, `VP8L` lossless.
  for (const [slot, tex, codec] of [
    ['colour', mat?.getBaseColorTexture(), 'VP8 '],
    ['normal', mat?.getNormalTexture(), 'VP8L'],
  ]) {
    if (!tex) {
      check(`${slot} texture survives`, false)
      continue
    }
    const bytes = Buffer.from(tex.getImage())
    const meta = await sharp(bytes).metadata()
    const got = bytes.subarray(12, 16).toString('latin1')
    check(
      `${slot} texture is WebP ≤ ${MAX_TEXTURE_PX} px, ${codec === 'VP8L' ? 'lossless' : 'lossy'}`,
      meta.format === 'webp' &&
        Math.max(meta.width, meta.height) <= MAX_TEXTURE_PX &&
        got === codec,
      `${meta.width}×${meta.height} ${meta.format} ${got.trim()}`,
    )
  }

  // ------------------------------------------------------------ app source --

  section('App source')

  const offenders = []
  const walk = async (dir) => {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const p = join(dir, e.name)
      if (e.isDirectory()) await walk(p)
      else if (/\.tsx?$/.test(e.name) && !p.replaceAll('\\', '/').endsWith('canvas/useModel.ts')) {
        if (/\buseGLTF\b/.test(await readFile(p, 'utf8'))) offenders.push(p)
      }
    }
  }
  await walk('src')
  check(
    'models load only through useModel (Draco stays off)',
    !offenders.length,
    offenders.join(', '),
  )
} catch (err) {
  check('verification ran', false, err instanceof Error ? err.message : String(err))
} finally {
  await rm(tmp, { recursive: true, force: true })
}

finish('Model pipeline verified.')
