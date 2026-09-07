import { profile } from '@/data/profile'
import { Picture } from '@/dom/ui/Picture'

export function Hero() {
  return (
    <section id="top" className="flex min-h-dvh flex-col justify-center gap-16 pt-28 pb-10">
      <div className="grid w-full items-center gap-12 md:grid-cols-[1.35fr_1fr] md:gap-16">
        <div>
          <p className="mb-5 flex items-center gap-2.5 font-mono text-xs tracking-[0.2em] text-mist uppercase">
            <span aria-hidden className="inline-block size-1.5 rounded-full bg-ember" />
            {profile.role} · {profile.location}
          </p>

          <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {profile.headline}
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-mist md:text-lg">{profile.subhead}</p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="#work"
              className="rounded-full bg-bone px-5 py-2.5 text-sm font-medium text-void transition-opacity hover:opacity-85"
            >
              See the work
            </a>
            <a
              href={profile.links.playStore}
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-full border border-slate px-5 py-2.5 text-sm text-bone transition-colors hover:border-accent hover:text-accent"
            >
              TRUUNA on Google Play ↗
            </a>
            <a href={profile.resume} className="px-2 py-2.5 text-sm text-mist underline underline-offset-4 transition-colors hover:text-bone">
              Résumé (PDF)
            </a>
          </div>
        </div>

        <div className="order-first max-w-[260px] md:order-none md:max-w-none md:justify-self-end">
          <Picture
            base="/img/portrait"
            widths={[480, 960]}
            width={480}
            height={600}
            priority
            sizes="(max-width: 768px) 260px, 340px"
            alt={`${profile.fullName}, ${profile.role}`}
            className="w-full rounded-lg border border-slate/80 object-cover"
          />
        </div>
      </div>

      <dl className="hidden shrink-0 grid-cols-4 gap-6 border-t border-slate/60 pt-6 lg:grid">
        {profile.stats.map((s) => (
          <div key={s.label}>
            <dt className="sr-only">{s.label}</dt>
            <dd>
              <span className="font-mono text-2xl text-bone">{s.value}</span>
              <span className="mt-1 block text-xs text-mist">{s.label}</span>
              <span className="mt-0.5 block text-xs text-mist/60">{s.detail}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
