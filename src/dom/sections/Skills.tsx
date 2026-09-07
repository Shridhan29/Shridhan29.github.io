import { skills } from '@/data/skills'
import { Section } from '@/dom/ui/Section'

export function Skills() {
  return (
    <Section id="skills" label="Toolkit" title="What I reach for.">
      <div className="divide-y divide-slate/60 border-y border-slate/60">
        {skills.map((s) => (
          <div key={s.group} className="grid gap-2 py-5 md:grid-cols-[190px_1fr] md:gap-8">
            <h3 className="font-mono text-xs tracking-[0.16em] text-mist uppercase">{s.group}</h3>
            <ul className="flex flex-wrap gap-x-2 gap-y-2">
              {s.items.map((i) => (
                <li key={i} className="rounded border border-slate/70 px-2.5 py-1 text-[0.8rem] text-bone/90">
                  {i}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  )
}
