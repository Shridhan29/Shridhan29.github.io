# Shridhan Vidhate — Portfolio

A scroll-driven 3D portfolio. The site is one continuous camera descent through six
layers, each one a domain of the work: orbit, mobile device, web surface, service
core, cloud, and physical hardware. The 3D is the information architecture rather
than decoration.

**Live:** https://shridhan29.github.io

## Stack

React 19 · TypeScript · Vite 8 · Three.js · React Three Fiber · drei ·
postprocessing · GSAP + ScrollTrigger · Lenis · Zustand · Tailwind CSS v4

## Documentation

| File | What it covers |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Concept, tech choices and rejected alternatives, rendering architecture, performance budgets, quality tiers, asset pipeline, deployment |
| [IMPLEMENTATION_TRACKER.md](IMPLEMENTATION_TRACKER.md) | Phased task breakdown, asset register, open decisions, screenshot brief |
| [BUILD_PROMPT.md](BUILD_PROMPT.md) | Self-contained brief for the build |

## Development

```bash
npm install
npm run dev        # dev server
npm run build      # typecheck, build, and enforce bundle budgets
npm run preview    # serve the production build
npm run lint
npm run typecheck
npm run analyze    # bundle treemap at dist/stats.html
node scripts/process-images.mjs       # portrait crops, grade, OG card
node scripts/process-screenshots.mjs  # project screenshots -> AVIF + WebP
```

Node `^20.19.0 || >=22.12.0` (see `.nvmrc`).

No `.env` is required. The Web3Forms contact key is public by design — it ships
in the client bundle either way — so it lives in `src/dom/sections/Contact.tsx`
with `VITE_WEB3FORMS_KEY` available as an override if you ever rotate it.

Raw originals live in `assets-source/` and are deliberately outside `public/`:
anything under `public/` is published verbatim, so unprocessed multi-megabyte
photos would go live alongside the compressed versions.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which lints,
typechecks, builds, enforces the bundle budgets, and publishes `dist/` to GitHub
Pages. This is a user site, so it serves from the domain root and Vite's `base`
stays `/`.

## Licence

MIT — see [LICENSE](LICENSE). Third-party CC0 3D assets are credited in
`public/models/CREDITS.md`.
