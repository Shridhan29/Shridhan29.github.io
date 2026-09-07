import { skills } from '@/data/skills'
import { Section } from '@/dom/ui/Section'

export function Skills() {
  return (
    <Section id="skills" label="Toolkit" title="What I reach for.">
      <div className="divide-y divide-slate/60 border-y border-slate/60">
        {skills.map((s) => (
          <div key={s.group} className="grid gap-2 py-5 md:grid-cols-[220px_1fr] md:gap-10 xl:grid-cols-[280px_1fr]">
            <h3 className="font-mono text-xs tracking-[0.16em] text-mist uppercase">{s.group}</h3>
            <ul className="flex flex-wrap gap-x-2 gap-y-2">
              {s.items.map((i) => (
                <li key={i} className="rounded border border-slate/70 px-2.5 py-1 text-[0.8rem] text-bone/90 xl:text-[0.85rem]">
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
