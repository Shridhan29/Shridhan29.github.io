// Pure layer data. Deliberately free of any `three` import: the Zustand store
// and the DOM layer-nav both read this, and importing three here would pull the
// whole 3D bundle into the entry graph and defeat the lazy Canvas.
/**
 * The six layers of "The Stack". The camera descends through them on a single
 * unbroken curve; each layer contributes one control point plus the camera
 * language used while passing through it.
 *
 * `lookOffset` is added to the layer anchor to build the look target, which is
 * what makes each stop feel shot differently rather than merely lower down.
 */
export type Layer = {
  id: string
  label: string
  /** Anchor the layer's geometry sits at. */
  anchor: [number, number, number]
  /** Camera control point for this layer. */
  camera: [number, number, number]
  lookOffset: [number, number, number]
  fov: number
  color: string
  /** DOM section this layer is paired with. */
  section: string
}

export const LAYERS: Layer[] = [
  {
    id: 'orbit',
    label: 'L0 · Orbit',
    anchor: [0, 0, 0],
    camera: [0.0, 0.91, 5.66],
    lookOffset: [0, 0, 0],
    fov: 42, // wide orbit — establish the space
    color: '#4d7cfe',
    section: 'top',
  },
  {
    id: 'device',
    label: 'L1 · Device',
    anchor: [-2.4, -14, 0],
    camera: [-0.09, -12.35, 6.61],
    lookOffset: [-0.4, 0, 0],
    fov: 34, // tight dolly — the phone fills frame
    color: '#5ee0a0',
    section: 'work',
  },
  {
    id: 'surface',
    label: 'L2 · Surface',
    anchor: [2.6, -28, 0],
    camera: [6.62, -27.33, 4.47],
    lookOffset: [-1.6, 0.2, 0],
    fov: 40, // lateral truck — panes slide past
    color: '#8ab4ff',
    section: 'work',
  },
  {
    id: 'core',
    label: 'L3 · Core',
    anchor: [-1.8, -42, 0],
    camera: [-1.39, -41.18, 8.16],
    lookOffset: [0, 0, -3],
    fov: 30, // forward push — down the pipe
    color: '#c084fc',
    section: 'about',
  },
  {
    id: 'cloud',
    label: 'L4 · Cloud',
    anchor: [2.2, -56, 0],
    camera: [3.22, -52.95, 4.07],
    lookOffset: [-0.8, -1.4, 0],
    fov: 46, // slow crane — looking down over the fleet
    color: '#67e8f9',
    section: 'experience',
  },
  {
    id: 'ground',
    label: 'L5 · Ground',
    anchor: [0, -70, 0],
    camera: [0.76, -69.68, 6.34],
    lookOffset: [-0.3, 0.1, 0],
    fov: 38, // grounded eye level — standing in front of it
    color: '#ff8a3d',
    section: 'contact',
  },
]

