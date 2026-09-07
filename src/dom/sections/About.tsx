import { profile } from '@/data/profile'
import { Section } from '@/dom/ui/Section'

export function About() {
  return (
    <Section id="about" label="About" title="Software that has to survive contact with the real world.">
      <div className="grid gap-10 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:gap-16 xl:gap-24">
        <div className="measure space-y-5 text-[0.95rem] leading-relaxed text-mist xl:text-base">
          {profile.about.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-8 self-start lg:hidden">
          {profile.stats.map((s) => (
            <div key={s.label}>
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <span className="font-mono text-2xl text-bone">{s.value}</span>
                <span className="mt-1 block text-xs text-mist">{s.label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  )
}
