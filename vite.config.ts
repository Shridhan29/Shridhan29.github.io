import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'node:path'

// User-site deployment (Shridhan29.github.io) serves from the domain root,
// so base stays '/'. A project repo would need '/<repo>/' and would break
// every absolute asset path the 3D loaders resolve at runtime.
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    ...(process.env.ANALYZE
      ? [visualizer({ open: true, gzipSize: true, brotliSize: true, filename: 'dist/stats.html' })]
      : []),
  ],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  build: {
    target: 'es2022',
    // Fail loudly well before the 600 KB 3D-chunk budget is at risk.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          // three and its R3F ecosystem are the lazy 3D payload; keeping them
          // in one chunk means the DOM-only Static tier never downloads them.
          if (/[\\/]node_modules[\\/](three|@react-three|postprocessing)[\\/]/.test(id)) return 'three'
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react'
          if (/[\\/]node_modules[\\/](gsap|lenis)[\\/]/.test(id)) return 'motion'
        },
      },
    },
  },
})
