import { useGLTF } from '@react-three/drei'

/**
 * The one way scene code loads a model — never call `useGLTF` directly.
 *
 * drei's `useGLTF(path)` defaults to Draco, pointing its decoder at gstatic.com.
 * Every model here is Meshopt-compressed by `scripts/compress-models.mjs`, whose
 * decoder already ships inside the three chunk, so Draco is switched off and no
 * third-party request is ever made.
 *
 *   const { scene } = useModel('kiosk')   // public/models/kiosk.glb
 */
const url = (name: string) => `/models/${name}.glb`

export function useModel(name: string) {
  return useGLTF(url(name), false, true)
}

/** Starts the download ahead of the layer that needs it. */
useModel.preload = (name: string) => useGLTF.preload(url(name), false, true)
