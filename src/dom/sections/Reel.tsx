/**
 * The opening of Work: a tilted wall of real screenshots from all four
 * projects. Pinned, it grows from a framed card to nearly the full viewport
 * while its rows drift in opposite directions (`.reel-*` in index.css); without
 * scroll-timeline support, or with reduced motion, it is a still banner.
 *
 * Decorative — every screenshot here is also in its project's gallery, with a
 * description — so it is hidden from assistive tech. Shown from `md` up only,
 * so phones download none of it. AVIF only: the WebP files of these folders
 * are the 3D layers' textures, which the phase3 checks expect to wait.
 */

type Tile = { src: string; phone?: boolean }

const web = (dir: string, slug: string): Tile => ({ src: `/img/${dir}/${slug}-800.avif` })
const phone = (slug: string): Tile => ({ src: `/img/truuna/${slug}-420.avif`, phone: true })

const ROWS: Tile[][] = [
  [
    web('aashman.in', '02-home'),
    web('dms', '02-point-of-sale'),
    web('urja', '02-category'),
    web('aashman.in', '05-products'),
    web('dms', '03-dashboard'),
  ],
  [
    phone('01-language'),
    web('urja', '03-language'),
    phone('02-login-otp'),
    phone('03-configurator'),
    web('aashman.in', '04-services'),
    phone('04-booking-summary'),
    phone('05-order-timeline'),
  ],
  [
    web('dms', '04-admin'),
    web('urja', '04-tour-options'),
    web('aashman.in', '03-about'),
    web('urja', '05-tour-progress'),
    web('dms', '01-login'),
  ],
]

export function Reel() {
  return (
    <div aria-hidden className="pin-track mb-16 hidden md:block [--pin-height:240vh]">
      <div className="pin-sticky flex items-center justify-center">
        {/* Full-bleed: out of the shell's padding to the viewport edges. */}
        <div className="relative mx-[calc(50%-50vw)] flex w-screen justify-center">
          <div className="reel-frame relative h-[min(78vh,760px)] w-[calc(100vw-48px)] overflow-hidden rounded-2xl border border-line bg-ink shadow-[0_40px_120px_-40px_rgb(77_124_254/0.35)]">
            <div className="absolute inset-[-20%] flex flex-col justify-center gap-5 [transform:rotate(-8deg)]">
              {ROWS.map((row, r) => (
                <div
                  key={r}
                  className={`flex h-[24%] shrink-0 gap-5 ${r % 2 ? 'reel-row-b' : 'reel-row-a'}`}
                >
                  {[...row, ...row].map((t, i) => (
                    <img
                      key={i}
                      src={t.src}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      width={t.phone ? 420 : 800}
                      height={t.phone ? 747 : 414}
                      className="h-full w-auto shrink-0 rounded-xl border border-white/10 object-cover"
                    />
                  ))}
                </div>
              ))}
            </div>
            {/* Edges fade into the page, so the wall reads as a window, not a grid. */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgb(5_6_10/0.85)_100%)]" />
          </div>
        </div>
      </div>
    </div>
  )
}
