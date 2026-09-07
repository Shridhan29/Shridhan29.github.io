import { LAYERS } from '@/canvas/layers'
import { useScrollStore } from '@/store/useScrollStore'

/**
 * One dot per layer. Also the keyboard route between stops, so the 3D journey
 * is navigable without a scroll wheel.
 */
export function LayerNav() {
  const active = useScrollStore((s) => s.layer)

  return (
    <nav
      aria-label="Layers"
      className="fixed top-1/2 right-4 z-40 hidden -translate-y-1/2 lg:block xl:right-8"
    >
      <ul className="flex flex-col gap-3">
        {LAYERS.map((layer, i) => (
          <li key={layer.id}>
            <a
              href={`#${layer.section}`}
              aria-current={i === active ? 'true' : undefined}
              className="group flex items-center justify-end gap-2"
            >
              <span className="pointer-events-none font-mono text-[0.65rem] text-mist opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                {layer.label}
              </span>
              <span
                aria-hidden
                className={`block size-2 rounded-full border transition-all ${
                  i === active
                    ? 'scale-125 border-bone bg-bone'
                    : 'border-mist/60 bg-transparent group-hover:border-bone'
                }`}
              />
              <span className="sr-only">{layer.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
