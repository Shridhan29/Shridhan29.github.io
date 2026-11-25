import { skills } from '@/data/skills'
import { Section } from '@/dom/ui/Section'

export function Skills() {
  return (
    <Section id="skills" label="Toolkit" title="What I reach for.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-5">
        {skills.map((s) => (
          <div
            key={s.group}
            // An odd last card spans the row rather than sitting alone.
            className="card rounded-2xl p-5 sm:last:odd:col-span-2 md:p-6 xl:last:odd:col-span-3"
          >
            <h3 className="mb-4 font-mono text-xs tracking-[0.16em] text-accent-soft uppercase">
              {s.group}
            </h3>
            <ul className="flex flex-wrap gap-2">
              {s.items.map((i) => (
                <li key={i} className="chip">
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
