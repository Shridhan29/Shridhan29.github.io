import type { CSSProperties } from 'react'
import { skills } from '@/data/skills'
import { Section } from '@/dom/ui/Section'

export function Skills() {
  return (
    <Section id="skills" label="Toolkit" title="What I reach for." accent="reach for.">
      {/* Seven groups: two columns, then four, where the odd last card spans
          two columns rather than stretching across a whole row. */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
        {skills.map((s, i) => (
          <div
            key={s.group}
            style={{ '--d': i % 4 } as CSSProperties}
            className="card card-lift rise rounded-2xl p-5 sm:last:odd:col-span-2 md:p-6"
          >
            <h3 className="mb-4 font-mono text-xs tracking-[0.16em] text-accent-soft uppercase">
              {s.group}
            </h3>
            <ul className="flex flex-wrap gap-2">
              {s.items.map((item) => (
                <li key={item} className="chip">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  )
}
