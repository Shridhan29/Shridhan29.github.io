// Renames the raw project screenshots to stable slugs and emits AVIF + WebP
// at two widths each. Sources stay untouched under public/img/source/.
import sharp from 'sharp'
import { mkdir, readdir, rename, access } from 'node:fs/promises'
import { join } from 'node:path'

const SRC_ROOT = 'assets-source/img'
const OUT_ROOT = 'public/img'

// Raw filenames sort chronologically; this maps that order onto slugs that
// describe the screen, so the data files never reference a timestamp.
const MAP = {
  truuna: {
    widths: [420, 840],
    // Capture order was not display order.
    files: {
      'playstore_real_phone_3.png': '01-language',
      'playstore_real_phone_4.png': '02-login-otp',
      'playstore_real_phone_1.png': '03-configurator',
      'playstore_real_phone_2.png': '04-booking-summary',
      'playstore_real_phone_5.png': '05-order-timeline',
    },
  },
  'aashman.in': {
    widths: [800, 1600],
    order: ['01-loader', '02-home', '03-about', '04-services', '05-products', '06-help', '07-contact', '08-footer'],
  },
  dms: {
    widths: [800, 1600],
    order: ['01-login', '02-point-of-sale', '03-dashboard', '04-admin'],
  },
  urja: {
    widths: [800, 1600],
    order: ['01-splash', '02-category', '03-language', '04-tour-options', '05-tour-progress'],
  },
}

const exists = (p) => access(p).then(() => true, () => false)

for (const [project, cfg] of Object.entries(MAP)) {
  const srcDir = join(SRC_ROOT, project)
  const outDir = join(OUT_ROOT, project)
  await mkdir(srcDir, { recursive: true })
  await mkdir(outDir, { recursive: true })

  // New raw drops may land in the output directory; move them to the source
  // tree so nothing unprocessed is ever published.
  if (await exists(join(OUT_ROOT, project))) {
    for (const f of await readdir(join(OUT_ROOT, project))) {
      if (/\.(png|jpe?g)$/i.test(f)) await rename(join(OUT_ROOT, project, f), join(srcDir, f))
    }
  }

  const raw = (await readdir(srcDir)).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort()
  const slugFor = (f, i) => cfg.files?.[f] ?? cfg.order?.[i] ?? `${String(i + 1).padStart(2, '0')}`

  for (let i = 0; i < raw.length; i++) {
    const slug = slugFor(raw[i], i)
    for (const w of cfg.widths) {
      const base = sharp(join(srcDir, raw[i])).resize(w, null, { withoutEnlargement: true })
      await base.clone().avif({ quality: 58, effort: 6 }).toFile(join(outDir, `${slug}-${w}.avif`))
      await base.clone().webp({ quality: 78 }).toFile(join(outDir, `${slug}-${w}.webp`))
    }
    const { width, height } = await sharp(join(srcDir, raw[i])).metadata()
    console.log(`  ${project}/${slug}  ${width}x${height}`)
  }
}
console.log('\nScreenshots processed.')
