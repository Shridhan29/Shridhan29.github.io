import { Component, type ReactNode } from 'react'

/**
 * Contains a failure of the 3D scene to the scene.
 *
 * The scene is lazy-loaded. Without this boundary, one failed download of its
 * chunk — flaky mobile data, a blocker, a deploy mid-visit — threw out of
 * Suspense and unmounted the whole app: a blank page with no text at all. Now
 * the scene alone is dropped and the document is marked `html[data-scene-off]`,
 * which hides every stage and brings back the screenshots and copy they were
 * standing in for — the page as the Static tier shows it.
 */
export class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    document.documentElement.dataset.sceneOff = ''
    console.warn('3D scene unavailable; showing the page without it.', error)
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
