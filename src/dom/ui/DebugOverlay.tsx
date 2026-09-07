import { useScrollStore } from '@/store/useScrollStore'
import { LAYERS } from '@/canvas/layers'

/** Shown only with ?debug=1. Tree-shaken out of the DOM, not the bundle. */
export function DebugOverlay() {
  const { progress, layer, direction, stats } = useScrollStore()

  return (
    // data-debug gives the verification script a stable hook; the layer-nav
    // renders every label as screen-reader text, so scraping body text picks up
    // the wrong one.
    <div
      data-debug
      className="fixed bottom-3 left-3 z-50 rounded border border-slate bg-void/90 p-3 font-mono text-[0.7rem] text-mist backdrop-blur"
    >
      <div data-debug-layer className="text-bone">
        {LAYERS[layer].label}
      </div>
      <div>progress {progress.toFixed(3)}</div>
      <div>dir {direction > 0 ? 'down' : 'up'}</div>
      <div>fps {stats.fps}</div>
      <div>calls {stats.calls}</div>
      <div>tris {stats.tris.toLocaleString()}</div>
    </div>
  )
}
