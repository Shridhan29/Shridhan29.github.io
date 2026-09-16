// Budgets from ARCHITECTURE.md §6, shared by every script that enforces one so
// the build check and the asset pipeline can never disagree about a limit.

/** JS + CSS, gzip, KB. "entry" is what index.html pulls on first paint. */
export const BUNDLE_KB = { entry: 180, lazy: 600 }

/** Compressed .glb files, raw bytes, KB. Meshopt output barely gzips further. */
export const MODEL_KB = { each: 500, total: 3500 }

/** Longest texture edge inside a model, px. */
export const MAX_TEXTURE_PX = 1024

/**
 * Mesh simplification: keep at least `ratio` of the triangles, and stop sooner
 * if the next collapse would move the surface by more than `error` (relative
 * to the mesh's size), so silhouettes survive. Open borders stay locked, so
 * modular kit pieces still meet their neighbours without cracks.
 */
export const SIMPLIFY = { ratio: 0.75, error: 0.001, lockBorder: true }
