// Turns source imagery into the AVIF/WebP variants the site ships.
//
// The portrait is a full-length photo taken against a bright floral backdrop,
// which fights the site's dark cinematic palette. Rather than a fake cut-out,
// it gets an editorial grade: tight crop, desaturation, a cool shadow lift and
// a heavy vignette, so the backdrop reads as intentional texture and the
// subject stays the only lit thing in frame.
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

const SRC = 'public/img/source/shridhanImage.jpeg'
const OUT = 'public/img'

await mkdir(OUT, { recursive: true })

// Crops measured against the 1000x1500 source.
const CROPS = {
  portrait: { left: 220, top: 300, width: 560, height: 700 }, // 4:5, head to chest
  square: { left: 265, top: 330, width: 480, height: 480 }, // avatar
}

/** Radial vignette that collapses the busy backdrop toward the page ground. */
const vignette = (w, h) => Buffer.from(`
  <svg width="${w}" height="${h}">
    <defs>
      <radialGradient id="v" cx="50%" cy="38%" r="72%">
        <stop offset="0%"   stop-color="#05060a" stop-opacity="0"/>
        <stop offset="55%"  stop-color="#05060a" stop-opacity="0.28"/>
        <stop offset="100%" stop-color="#05060a" stop-opacity="0.92"/>
      </radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#v)"/>
  </svg>`)

const graded = (crop) =>
  sharp(SRC)
    .extract(crop)
    .modulate({ saturation: 0.35, brightness: 0.94 })
    .linear(1.12, -14) // contrast, shadows down
    .tint({ r: 226, g: 232, b: 245 }) // cool the neutrals toward the palette

async function emit(name, crop, widths) {
  for (const w of widths) {
    const h = Math.round((crop.height / crop.width) * w)
    const base = graded(crop).resize(w, h, { fit: 'cover' })
    const withVignette = sharp(await base.png().toBuffer()).composite([
      { input: vignette(w, h), blend: 'over' },
    ])
    await withVignette.clone().avif({ quality: 62, effort: 6 }).toFile(`${OUT}/${name}-${w}.avif`)
    await withVignette.clone().webp({ quality: 80 }).toFile(`${OUT}/${name}-${w}.webp`)
    console.log(`  ${name}-${w}  ${w}x${h}`)
  }
}

await emit('portrait', CROPS.portrait, [480, 960])
await emit('avatar', CROPS.square, [200, 400])

// Open Graph card: 1200x630, portrait bled to the right, text baked in so link
// previews stay readable without a rendering service.
const ogPortraitW = 430
const ogPortrait = await sharp(await graded(CROPS.portrait).png().toBuffer())
  .resize(ogPortraitW, 630, { fit: 'cover', position: 'top' })
  .composite([{ input: vignette(ogPortraitW, 630), blend: 'over' }])
  .png()
  .toBuffer()

const ogText = Buffer.from(`
  <svg width="1200" height="630">
    <rect width="1200" height="630" fill="#05060a"/>
    <text x="80" y="250" fill="#e8eaf0" font-family="system-ui, sans-serif"
          font-size="70" font-weight="700" letter-spacing="-2">Shridhan Vidhate</text>
    <text x="80" y="315" fill="#4d7cfe" font-family="system-ui, sans-serif"
          font-size="31" font-weight="600">Software Developer &#183; Pune</text>
    <text x="80" y="392" fill="#8b93a7" font-family="system-ui, sans-serif" font-size="25">
      Flutter &#183; FastAPI &#183; React &#183; Azure &#183; Raspberry Pi
    </text>
    <text x="80" y="437" fill="#8b93a7" font-family="system-ui, sans-serif" font-size="25">
      TRUUNA shipped to the Google Play Store
    </text>
    <rect x="80" y="480" width="86" height="3" fill="#ff8a3d"/>
  </svg>`)

await sharp(ogText)
  .composite([{ input: ogPortrait, left: 1200 - ogPortraitW, top: 0 }])
  .png()
  .toFile(`${OUT}/og.png`)
console.log('  og  1200x630')

console.log('\nImages written to public/img/')
