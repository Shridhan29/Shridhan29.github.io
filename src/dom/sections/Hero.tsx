import { profile } from '@/data/profile'
import { useRef } from 'react'
import { Picture } from '@/dom/ui/Picture'
import { CountUp } from '@/dom/motion/CountUp'
import { DecodeText } from '@/dom/motion/DecodeText'
import { Glare } from '@/dom/motion/Glare'
import { useMagnet } from '@/dom/motion/useMagnet'

export function Hero() {
  const primary = useRef<HTMLAnchorElement>(null)
  const store = useRef<HTMLAnchorElement>(null)
  useMagnet(primary)
  useMagnet(store)

  return (
    <section id="top" className="flex min-h-dvh flex-col justify-center gap-16 pt-28 pb-10">
      <div className="grid w-full items-center gap-12 md:grid-cols-[minmax(0,1.5fr)_minmax(0,0.85fr)] md:gap-14 xl:gap-24">
        <div data-hero-copy className="scrim">
          <p className="mb-5 flex items-center gap-2.5 font-mono text-xs tracking-[0.2em] text-mist uppercase">
            <span aria-hidden className="inline-block size-1.5 rounded-full bg-ember" />
            <DecodeText text={`${profile.role} · ${profile.location}`} />
          </p>

          <h1 className="t-hero font-semibold text-balance">{profile.headline}</h1>

          <p className="measure-tight mt-6 text-base leading-relaxed text-mist md:text-lg xl:text-xl">
            {profile.subhead}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a ref={primary} href="#work" className="btn btn-primary">
              See the work <span aria-hidden>↓</span>
            </a>
            <a
              ref={store}
              href={profile.links.playStore}
              data-goatcounter-click="play-store-hero"
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-ghost"
            >
              TRUUNA on Google Play <span className="link-arrow">↗</span>
            </a>
            <a
              href={profile.resume}
              data-goatcounter-click="resume-hero"
              className="link mx-2 my-2.5 text-sm text-mist hover:text-bone"
            >
              Résumé (PDF)
            </a>
          </div>
        </div>

        <div
          data-hero-portrait
          className="order-first max-w-[260px] md:order-none md:max-w-[420px] md:justify-self-end xl:max-w-[520px]"
        >
          <Glare className="rounded-2xl shadow-[0_40px_80px_-40px_rgb(0_0_0/0.9)]">
            <Picture
              base="/img/portrait"
              widths={[480, 960]}
              width={480}
              height={600}
              priority
              sizes="(max-width: 768px) 260px, (max-width: 1280px) 420px, 520px"
              alt={`${profile.fullName}, ${profile.role}`}
              className="w-full rounded-2xl border border-line object-cover"
            />
          </Glare>
        </div>
      </div>

      <dl className="hidden shrink-0 grid-cols-4 gap-4 lg:grid xl:gap-6">
        {profile.stats.map((s) => (
          <div key={s.label} className="card rounded-2xl px-5 py-4 xl:px-6 xl:py-5">
            <dt className="sr-only">{s.label}</dt>
            <dd>
              <span className="font-mono text-2xl text-bone xl:text-3xl">
                <CountUp value={s.value} />
              </span>
              <span className="mt-1 block text-xs text-mist">{s.label}</span>
              <span className="mt-0.5 block text-xs text-mist/80">{s.detail}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
