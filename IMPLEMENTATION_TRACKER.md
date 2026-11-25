# Implementation Tracker — 3D Portfolio

Companion to `ARCHITECTURE.md` (the design) and `BUILD_PROMPT.md` (the brief).
This file is the single source of truth for *what is done*. Update it in the same commit as the work.

**Legend:** `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked · `[-]` cut from scope

---

## Confirmed Facts

| Item | Value | Status |
|---|---|---|
| Name | Shridhan Satish Vidhate | confirmed |
| Location | Pune, Maharashtra | confirmed |
| Email (public) | vidhateshridhan117@gmail.com | confirmed |
| Phone | +91 9503860517 | confirmed — *see decision D5 before publishing* |
| GitHub | https://github.com/Shridhan29 | confirmed |
| LinkedIn | https://www.linkedin.com/in/shridhan-vidhate-36a401303 | confirmed — tracking params stripped |
| Play Store | https://play.google.com/store/apps/details?id=in.aashman.truuna | confirmed |
| Company site | https://aashman.in/ | confirmed |
| Resume | `shridhan_resume1_updated.pdf` | confirmed latest |
| Web3Forms form | "Portfolio Contact" | created |
| Web3Forms access key | `fa34bbbf-a4f2-420b-9060-66827ccf859c` | inlined in `Contact.tsx` with a `VITE_WEB3FORMS_KEY` env override. Public by design — it ships in the client bundle regardless, so a CI secret added no security while giving the deployed form a way to silently break |
| Target repo | `Shridhan29/Shridhan29.github.io` | **available** — 404 on the domain, 0 public repos on the account |

---

## Blockers

Nothing here blocks Phase 0. Items marked **[!]** block the phase named beside them.

| # | Blocker | Blocks | Owner |
|---|---|---|---|
| B1 | ~~Professional photo~~ | — | **cleared 2026-09-07** |
| B2 | ~~Project screenshots~~ | — | **cleared 2026-09-07 — 22 files received and processed** |
| B3 | ~~Web3Forms access key~~ | — | **cleared 2026-09-07** |
| B4 | ~~Open decisions D1–D7~~ | — | **cleared — D1, D2, D5, D7 decided; D3, D4, D6 deferred with safe defaults** |

---

## Phase 0 — Foundation ✅ COMPLETE
*Goal: an empty but deployed site with green CI.*

- [x] **0.1 Repo**
  - [x] Create `Shridhan29.github.io` on GitHub (public)
  - [x] `origin` repointed and `main` pushed. Old private `shridhan_web` remote kept as `private`
  - [x] Add `.gitignore` (node_modules, dist, .env, .DS_Store, Blender `.blend1`)
  - [x] Add `LICENSE` (MIT) and rewrite `README.md`
- [x] **0.2 Toolchain**
  - [x] Scaffolded — Vite 8.2, React 19.2, TypeScript 6.0
  - [x] `.nvmrc` 22; `engines` `^20.19.0 || >=22.12.0` (local Node is 20.20.2, which Vite 8 supports)
  - [x] **oxlint** (create-vite's default now, and far faster than ESLint) + Prettier; `lint`, `typecheck`, `format` scripts
  - [x] Tailwind v4 via `@tailwindcss/vite`; palette tokens in `src/styles/index.css`
  - [x] `vite.config.ts` with `base: '/'`, `@` alias, and manual chunks isolating three/R3F
- [x] **0.3 3D dependencies**
  - [x] `three` 0.181, `@react-three/fiber` 9.7, `drei` 10.7, `postprocessing` 3.1
  - [x] `gsap` 3.15, `lenis` 1.3, `zustand` 5.0
  - [x] Cube renders; kept as the Phase 0 placeholder page, removed in Phase 1
- [x] **0.4 CI/CD**
  - [x] `.github/workflows/deploy.yml` written — lint, typecheck, build, budget check, deploy
  - [x] Pages switched from `legacy` (branch-serving) to `workflow` build type via the API
  - [x] **Live at https://shridhan29.github.io** — HTTP 200, hashed assets served, full pipeline green
- [x] **0.5 Bundle guardrail**
  - [x] `rollup-plugin-visualizer` wired to `npm run analyze`
  - [x] `scripts/check-budget.mjs` fails the build above the §6 gzip budgets; wired into `npm run build`. At Phase 0: entry 61.2/180 KB, three 225.5/600 KB

**Done when:** a pushed commit auto-deploys and the live URL serves a page.

---

## Phase 1 — Static Portfolio ✅ COMPLETE
*A complete, genuinely good 2D portfolio. Also the Static fallback tier.*

- [x] **1.1 Content model** — `profile`, `projects`, `experience`, `skills`, `education` in `src/data/*.ts`; no copy hardcoded in components
- [x] **1.2 Copy pass** — rewritten in web voice, outcome-first. Reading the screenshots reframed the work: TRUUNA is an agricultural robotics platform (configure a modular field robot, book a demo, track it through production), not the generic catalogue app the résumé bullets implied
- [x] **1.3 Layout & sections** — hero, work, about, toolkit, experience, education, contact, footer; semantic landmarks, one `h1`, skip link, palette tokens, responsive 360–2560 px
- [x] **1.4 Media** — portrait graded (crop, desaturate, vignette) so the floral backdrop reads as texture; 22 screenshots to AVIF + WebP at two widths, renamed to stable slugs; every image has intrinsic dimensions and real alt text
- [x] **1.5 Résumé download** — `public/resume.pdf`, linked from nav, hero and contact
- [x] **1.6 Contact form** — Web3Forms via `fetch` (visitor stays on the page), honeypot, validation, live-region status, `mailto:` fallback
- [x] **1.7 SEO & metadata** — OG/Twitter cards with a generated 1200×630 image, Person JSON-LD, canonical, sitemap, robots, manifest, SVG favicon
- [x] **1.8 Quality gate** — lint, typecheck and budgets green; entry bundle 72.2/180 KB gzip; verified in headless Chrome at 1440×900 and full-page
- [ ] Lighthouse run and a pass on a real Android device — **outstanding, needs your hardware**

## Phase 2 — Camera System ✅ COMPLETE
*The scroll-to-camera engine, running against placeholder geometry.*

- [x] **2.1 Scroll infrastructure** — `useLenis` drives `ScrollTrigger.update` and is stepped from the GSAP ticker so both share one clock (no `scrollerProxy` needed, since Lenis scrolls the window). `useScrollStore` publishes `progress`, `layer`, `direction`, and renderer stats. `prefers-reduced-motion` skips Lenis entirely and falls back to native scroll with identical progress values, so nothing downstream special-cases it
- [x] **2.2 Canvas shell** — one `<Canvas>`, fixed, `inset-0`, `z-0`, `aria-hidden`, DPR clamped `[1, 2]`, never remounted. DOM overlay sits above at `z-10`. Lazy-loaded via `React.lazy` behind a WebGL2 + reduced-motion guard
- [x] **2.3 Camera rig** — `CatmullRomCurve3` through six control points, progress damped with `MathUtils.damp` (the frame-rate-independent equivalent of `scrub: 1`), look target sampled from a parallel curve
- [x] **2.4 Camera language per layer** — fov blends between layers (42° wide orbit → 34° tight dolly → 40° lateral truck → 30° forward push → 46° slow crane → 38° eye level), with each camera placed at the distance that keeps the subject a constant share of frame, so the variation reads as intent rather than drift
- [x] **2.5 Dev tooling** — `?debug=1` overlay (layer, progress, direction, fps, draw calls, triangles) and `?p=0.42` to pin progress for inspection or headless capture. Six labelled placeholder layers stand in for the real geometry
- [x] **2.6 Section sync** — layer-dot nav down the right edge, `aria-current` on the active layer, each dot linking to its paired section. Section reveal runs on a CSS `view()` timeline: no bundle weight, no fight with Lenis, and content simply shows where the timeline is unsupported
- [x] **2.7 Automated verification** — `npm run verify:phase2` runs 29 checks: bundle-graph invariants, source invariants, and a driven Chrome that measures the render loop, layer selection, draw-call bounds, real scrolling, and the no-WebGL Static path. All green
  - The earlier zeroed fps / draw-call readings were a headless virtual-time artifact, not a defect. Driven properly the loop runs. The draw-call and triangle figures first recorded here (60–78 calls, ~1,700–2,200 triangles) were totals over a half-second sample window, not per frame — corrected 2026-09-16; per frame the placeholders cost 3 draw calls and 84 triangles for each layer in view

**Verify everything:** `npm run verify` runs format, lint, typecheck, build with budgets, `verify:models` and `verify:phase2` in order, with a pass/fail summary; add `-- --live` to confirm the live site serves the local build.

**Verify with:** `npm run verify:phase2` (needs `npm run build` first, and Chrome on the system — found automatically on Linux, macOS and Windows, or set `CHROME_PATH`).

**Not built here, deliberately:** Leva. A `?debug=1` overlay plus `?p=` covers path authoring without adding a dependency that would then need tree-shaking out of production.

## Phase 3 — The Six Layers
*Goal: real geometry, textured, baked, compressed, placed. Est. 5–7 days. Unblocked — B2 cleared 2026-09-07.*

- [x] **3.0 Asset pipeline**
  - [x] `scripts/compress-models.mjs` (`npm run models`) — gltf-transform: dedup → prune → weld → simplify (borders locked) → WebP ≤ 1024 px (normal maps lossless) → meshopt. `assets-source/models/` → `public/models/`; refuses any source not credited by filename in `public/models/CREDITS.md`
    - **Meshopt, not Draco:** its decoder is a few KB already inside the three chunk; Draco needs a separate ~300 KB decoder that drei pulls from gstatic.com by default
    - **WebP, not KTX2 (for now):** KTX2 encoding needs the `toktx` binary, which npm cannot install locally or in CI. Revisit if a texture-heavy asset makes GPU memory the constraint
  - [x] Screenshots and portrait → AVIF + WebP — built in Phase 1.4 as `scripts/process-screenshots.mjs` and `scripts/process-images.mjs`
  - [x] Shared loader `src/canvas/useModel.ts` — Meshopt on, Draco explicitly off; scene code never calls `useGLTF` directly (enforced by `verify:models`)
  - [x] Per-model size assertion in CI (≤ 500 KB each, ≤ 3.5 MB total) — `check-budget.mjs` over `dist/models/`, limits shared from `scripts/budgets.mjs`
  - [x] `npm run verify:models` (in CI) — 14 checks: builds a fixture with a dense mesh, a duplicate mesh, and 2048 px colour and normal textures, runs the real pipeline, decodes the output. A one-off browser run also loaded it through drei's `three-stdlib` loader: 1024 px WebP texture, 2 draw calls, zero third-party requests
- [x] **3.1 L0 Orbit** — `src/canvas/layers/Orbit.tsx`. A black-glass monolith (1:4:9) that reads through edge highlights, and 1,400 stars in one draw call from a seeded buffer. The monolith is placed by measuring the hero: it stands in the real gap between headline and portrait, sized to the copy block, and is not drawn where the gap is under 140 px (tablets, phones), since anywhere else it would sit behind text. Hero copy now sits on a `.scrim`. Cost: +2.4 KB gzip, 2 draw calls, 716 triangles
  - Lighting per D9 (a): `src/canvas/Lighting.tsx` renders emissive panels into a 64 px environment map. At the default 256 px with a blur pass the first frame took 6–15 s under software GL (1.2 s without lighting); at 64 px it is ~1.5 s
  - Metal was wrong for a near-black slab — a metal tints its reflections by its base colour, so it rendered as a flat black cut-out. Black glass (dielectric + clearcoat) gives dark faces and bright edges
  - `npm run verify:phase3` (16 checks): gating and lighting source rules; best-of-3 first frame ≤ 5 s; no errors or third-party requests; monolith drawn at 1440 px and not at 1024 px or on a phone; and contrast ≥ 4.5:1 for all hero and header text that sits over the canvas — outline buttons and text links included, filled buttons and the aria-hidden logo dot (a logotype, exempt under WCAG) excluded — measured from rendered pixels at all three sizes. Worst case 4.52:1 — exactly the documented `mist/80` floor, so the scene costs no contrast. Reintroducing the old placeholder behind the hero fails it at 1024 px and on phones
- [x] **3.2 L1 Device** — `src/canvas/layers/Device.tsx`. On desktop with 3D the TRUUNA article reserves a stage in place of its screenshot row, and one large phone is drawn into it: black glass, slim bezels, a rounded screen showing the app's first screen, and a soft glow in the layer's green. `src/canvas/stage.ts` places content on the camera ray through a DOM element's centre every frame, so the phone stays locked to its stage while the page scrolls and the camera moves. Cost: +1.9 KB gzip, 3 draw calls, one 42 KB texture
  - Below 1024 px and in the Static tier the screenshot row is unchanged. On desktop the row is `display: none` (its lazy images are never fetched, and the featured shot is no longer eager-loaded there) and screen readers get the five descriptions once, as a plain list
  - `verify:phase3` (24 checks) adds: stage present and row hidden at 1440 px; each screen described once; no row images downloaded; the phone's bright pixels fall inside the stage; TRUUNA text ≥ 4.5:1 with phone and glow on screen; phone and no-WebGL layouts keep the row. Oversizing the phone fails the placement and contrast checks
  - Contrast now uses each text's specified colour (resolved by painting swatches, since browsers report Tailwind colours as oklab()) over the measured background, as WCAG defines it. The first method took the brightest glyph pixel and under-rated thin 12 px text — it reported 3.12:1 for text specified at 4.53:1. The checks also skip text that is not painted: screen-reader-only, inside a closed `<details>`, or under the scrolled header
- [x] **3.3 L2 Surface** — `src/canvas/layers/Surface.tsx`. On desktop with 3D the aashman.in article's screenshot grid becomes a stage holding six pages of the site as layered panes, cascading back in depth like browser windows, each with a thin dark frame and dimmed with distance. Lateral-truck camera language: as the stage scrolls, deeper panes slide further. The front page is a 1600 px texture, the rest 800 px (~110 KB). Cost: +0.5 KB gzip, 12 draw calls, 24 triangles
  - Staging generalised: `STAGES` in `Projects.tsx` maps a project to its stage; each stage has its own proportions (a phone is tall, a stack of windows wide); `fitToStage` now also returns the stage's world width
  - Replaces the L2 placeholder, which had been drawing its wireframe over the aashman.in article text
  - `verify:phase3` (32 checks) runs the stage checks for L1 and L2 alike. Oversizing the panes fails the placement and contrast checks
  - Ribbons, glass transmission and the rest of the signature effect are 4.4
- [x] **3.4 L3 Ground** — `src/canvas/layers/Ground.tsx`. Two stages, both built from primitives (no models, no hardware photos — A7): in the DMS article a countertop POS terminal showing the real point-of-sale screen with a Raspberry Pi 4 beside it (board, SoC, USB and Ethernet blocks, 40-pin header as one instanced draw call); in the Urja article a free-standing kiosk showing the real language chooser. The one warm layer (D1): an amber glow, not a real-time light, which would recompile every lit material as the layer mounts. Cost: +1 KB gzip, 16 draw calls across both, two ~40 KB textures
  - Shared pieces extracted before a third copy: `useStagedFrame` (gating + stage placement), `shared/ScreenPlane` (rounded screenshot display), `shared/Glow`; Device and Surface now use them, with all their checks unchanged
  - `verify:phase3` (50 checks) runs the stage checks for DMS and Urja, and confirms L3 textures also wait until the camera nears them and never load on a phone
  - **Moved to 4.5:** the working miniature React UI on the kiosk screen (`<Html transform>`). Phase 3 shows the real screenshot
- [x] **3.5 L4 Core** — `src/canvas/layers/Core.tsx`. A request's path as a diagram: an incoming line, an API block with lit endpoint slots, a line on to a PostgreSQL stack of discs, and packets along both lines as one instanced draw call. No 3D labels (drei's text fetches a font from a CDN, and words belong in the page). Drawn into the About section's right column on desktop — free there because the hero already shows the stats that fill it on smaller screens — so no content is replaced. Layer colour changed from the placeholder purple to bone: a purple glow reads as a generic template, and warmth is reserved for Ground. Cost: +0.6 KB gzip, 13 draw calls, no textures
  - `verify:phase3` (56 checks) adds the Core stage: present at 1440 px, diagram inside the column, About text ≥ 4.5:1 beside it (6.59:1), absent on a phone and without WebGL. Oversizing the diagram fails placement and contrast
  - Packets are static here; 4.6 sets them flowing
  - Test hardening: a full verify crashed once ("Target closed", then EBUSY while deleting Chrome's temp profile) on this 4 GB machine; standalone reruns passed. `verify:phase3` now starts a fresh browser per layer block, and both suites close browsers through `closeBrowser`, which tolerates only Windows' EBUSY
- [x] **3.6 L5 Cloud** — `src/canvas/layers/Cloud.tsx`. A delivery pipeline read bottom to top: a rail through four stage markers (commit, build and test, container registry, deploy) up to a rising cluster of wireframe containers, the running service. Drawn into the Experience entry's left column on desktop, empty below the dates for the length of the entry; nothing replaced. Slow-crane camera language: seen from above, turning gently. All six containers are one merged line set; markers and their indicator lights are instanced. Cost: 5 draw calls, no textures
  - Every layer is now built, so the placeholder component is deleted — which also removes drei's `Edges` from the 3D chunk (lazy 287.4 → 282.2 KB gzip) and the last wireframe drawn over live text
  - `verify:phase3` (62 checks) adds the Cloud stage: present at 1440 px, pipeline inside the column, Experience text ≥ 4.5:1 beside it, absent on a phone and without WebGL
  - Fog and stage-by-stage lighting are 4.7
- [x] **3.7 Visibility gating** — `src/canvas/useLayerFrame.ts`: every layer, placeholders included, hides and skips its frame work when more than one layer from the camera; `verify:phase3` fails any layer that bypasses it
- [~] **3.8 Perf checkpoint** — machine-measurable part done 2026-09-18 with `npm run perf` (`scripts/perf-report.mjs`); device part waits on `DEVICE_TESTING.md`
  - [x] ≤ 120 draw calls: peak **13** per frame (About, L4), 7,300 triangles; phone peak 1 draw call
  - [x] Downloads: desktop **428 KB** on load (three.js 227 KB of it) and 572 KB after the whole journey; phone 386 KB on load. JS heap 9–13 MB. First frame 1.9–2.6 s under software GL
  - [x] GPU resources grow as staged layers mount and stay mounted: geometries 15 → 64, textures 4 → 12, shader programs 5 → 14
  - [x] `?debug=1` overlay now also shows frame time (`ms`), geometries, textures and shader programs, so device tests read the same numbers
  - [ ] 60 fps desktop — needs a real GPU (software GL frame times of 34–360 ms here are meaningless)
  - [ ] First mobile profile on a mid-range Android phone
  - [ ] Lighthouse desktop ≥ 85, mobile ≥ 70 (also open since 1.8)
  - **Finding — shader compile on mount:** programs are compiled the first time a staged layer draws (a 360 ms frame at TRUUNA under software GL). On a GPU that is far shorter but can still show as a stutter when a layer first appears. Fix with pre-compilation (`gl.compileAsync`) when a layer mounts, before it is on screen — belongs with 5.1 warming
  - **Finding — phones download three.js for a starfield:** see D12

**Done when:** all six layers render in place, budgets hold, no effects yet.

---

## Phase 4 — Signature Effects ✅ COMPLETE
*Goal: the "insane" pass. One memorable effect per layer, and nothing more. Est. 4 days.*

- [x] **4.1 Particle system** — `src/canvas/shared/NameField.tsx`: one persistent `Points` buffer, 8k / 25k / 60k particles on Low / Medium / High, one draw call on every tier. Each particle carries a target (in the formed name) and a scatter position (in the starfield's shell); the vertex shader morphs between them on `uMorph`, staggered per particle, so the morph costs no CPU work per frame
  - **Not baked to a file, deliberately.** The plan had `scripts/bake-particles.mjs` writing positions to `public/data/*.bin`. The only formation is text, so it is sampled at runtime from a 2D canvas in the page's own heading font: 0 KB downloaded, where 60k baked positions would be ~240 KB even quantised to 16 bits. It also follows any change to the font or to `profile.name`
  - Opacity scales with `√(8000 / count)`, so every tier lands at the same brightness; at full opacity 60k particles out-shone the headline
- [x] **4.2 L0** — iridescent fresnel rim, and the name dispersing into the stars
  - [x] The monolith is outlined by a fresnel rim: an additive shell lit only where its surface turns from the viewer, with a hue that walks with the angle and drifts with time. Faces stay black, so hero contrast is unchanged (4.53:1, as before). One extra draw call: the hero now costs 3
  - [x] Three's own iridescence on the glass as well, for the colour it lends the few reflections it catches. On its own it was invisible in a scene this dim — the rim is what reads
  - [x] The name forms in particles in the empty band between the header and the hero copy, and frays into the starfield as the hero scrolls out (fully gone at 55% of a viewport). Placed from measured layout like the monolith, never under text, never larger than the headline, and not drawn where the band is under 56 px. Positions are projected through the camera as it stands at the top of the page: a flat px-to-world scale ignored the camera's tilt and put the name ~15% too large and off the copy's left edge
- [x] **4.3 L1** — the phone's screen plays TRUUNA's real flow as the stage crosses the screen: language, phone-OTP login, configurator, booking summary, order timeline. `shared/ScreenSequence` cross-fades two samplers in one material (one draw call whatever the number of screens), holding each screen and flipping in the middle third of each step; `shared/roundedScreen` is the rounded display geometry, now shared with `ScreenPlane`. Five 840 px textures (~160 KB), still loaded only on approach and only on desktop
  - [x] Glow spill: a ring of additive light just behind the display falls on the glass around it, coloured by the average colour of the screen in view (read once from each decoded image) and following the cross-fade. One draw call, no real-time light
  - The layer publishes which screen is showing (`useScrollStore.screen`, in the `?debug=1` overlay), and `verify:phase3` (66 checks) reads that. A first version compared screenshots from two scroll positions and "passed" with the effect frozen — the whole page had moved between the shots, so everything differed. Frozen now reads `screens 0 → 0 → 0` and fails
- [x] **4.4 L2** — three ribbons weave front to back through the stack of pages and draw themselves as the stage rises, by moving the end of each tube's drawn range (no per-frame geometry work, 3 draw calls). Their paths arc clear of the pane silhouettes — routed inside them they were simply hidden behind opaque panes — and the layer's extent is now measured from the real geometry, panes plus ribbons plus the truck's reach, so the stack still fits its stage
  - **Deferred to 6.1:** real glass (transmission) on the front pane. It renders the scene a second time per frame and the plan marks it High tier only, so it belongs with the quality tiers
  - Published as `ribbons` (percent drawn) and checked by `verify:phase3` (69 checks); frozen at full length it reads `100 → 100 → 100` and fails
- [x] **4.5 L3 Ground** — the kiosk screen is the Urja interface itself, running: three languages, and the tour list answers the choice (`src/canvas/shared/KioskScreen.tsx`, drei `Html transform`). The POS terminal keeps its screenshot — a till is not something to try. Replacing the kiosk screenshot also drops its texture
  - **Mouse-only, deliberately.** The canvas is `aria-hidden` scenery, so focusable controls inside it would be a keyboard trap: reachable by Tab, invisible to a screen reader. Everything the kiosk says is in the article's text, and phones and the Static tier show the screenshot row. Revisit in the 6.5 accessibility audit
  - `Html transform` lays out at 40 CSS px to the world unit; sized without that the interface rendered as a 2 px speck
  - `verify:phase3` (72 checks): the interface is present, nothing in the scene is keyboard-focusable, and a click changes the screen. Breaking it on purpose reports `3 focusable controls` and an unchanged screen
  - [x] Warm practicals: a pool of amber light on the counter under the POS terminal and on the floor in front of the kiosk, as horizontal additive quads. No real-time light, which would recompile every lit material as the layer mounts
- [x] **4.6 L4 Core** — packets travel the request path: in from the edge, into the API, on to the database, fading in and out at the ends rather than popping. Still one instanced draw call, its matrices updated in the layer's existing frame callback
- [x] **4.7 L5 Cloud** — the pipeline runs as the column rises: commit, build and test, container registry, deploy light in order, through per-instance colours on the indicator mesh (no extra draw call). Volumetric fog stays for the post-processing pass
- [x] **4.8 Post-processing** — `src/canvas/Effects.tsx`, gated by quality tier: High runs bloom, a vignette and a trace of chromatic aberration; Medium runs bloom only; Low mounts no composer at all. Lazy bundle 286.5 → 311.5 KB gzip; entry unchanged at 77.2 KB
  - **Bloom is selective by brightness, not by object.** The threshold sits at 1.0, which no screenshot or page colour can exceed, so the product screens never bloom. Only accents pushed past 1 by `GLOW_GAIN` (2.2 where bloom runs, 1 on Low) glow: the monolith's rim, the API slots, DB seams and packets, the ribbons and the lit pipeline stages. No `SelectiveBloom`, which would cost an extra render of the selected objects
  - **Neutral tone mapping, not ACES.** The composer turns the renderer's tone mapping off, so it is re-applied as the last effect. With ACES the TRUUNA and aashman.in screenshots came out grey and washed out (ACES maps 1.0 to about 0.8 and desaturates highlights); Khronos PBR Neutral leaves colours below about 0.76 untouched. A slight lift on near-white screens remains on Medium and High
  - **No depth of field.** Content sits on stages beside the copy and is meant to be read; a focus blur over a product screen works against that
- [x] **4.4 follow-up: glass on L2 (High only)** — a transmission sheet over the front aashman.in page catches the studio light as the stack turns. Clear (roughness 0, no tint): a first pass with roughness 0.06 and a blue tint frosted the page grey. Transmission re-renders the opaque scene, so draw calls on that stop go 15 → 45 on High, within the 120 budget
- [x] **4.7 follow-up: fog on L5 Cloud** — `shared/Fog.tsx`: depth-staggered sheets of rising fbm noise, one additive quad each, no raymarching. 1 / 2 / 4 sheets on Low / Medium / High; each sheet is fainter the more there are, so tiers buy depth rather than density
- [x] **4.6 follow-up: packets by tier** — 4 / 7 / 10 per line (8 / 14 / 20 in all). Still one instanced draw call; the mesh is keyed by count, since an `InstancedMesh` cannot grow
- [x] **4.9 Palette** *(D3's default: derived from D1)* — distinct lighting mood + colour grade per layer, coherent as one journey
  - `src/canvas/moods.ts`: per layer, the sky (the renderer's clear colour) and the four studio panels' colours. Orbit cold blue-violet; Device screen-lit teal; Surface clean, slightly warm studio on a cool-neutral sky; Ground sodium amber; Core neutral steel, the darkest (the warm accent stays with Ground, per `layers.ts`); Cloud grey-blue dawn
  - Each layer is lit by its own studio: the D9 panels recoloured and baked to a 64 px PMREM map the first time the layer draws, then kept. `useLayerFrame` points the layer's standard materials at it, so a layer keeps its light while the next is in view. Same size for every map, so a swap is a uniform change, never a recompile. Panel intensities unchanged: a mood changes the colour of the light, not the amount
  - The sky is a `Color` background — a clear, not a draw call — eased toward the active layer's (about a second, through the layers between), so it holds while an article is read and never cuts. Published as `palette` in the debug overlay
  - Measured at Low: scene colour differs between neighbours by ΔE 9.3–21.6. First pass broke `verify:phase3` contrast on Urja (4.42:1) and Experience (4.47:1); Ground's and Cloud's skies were darkened and the separation regained through hue rather than lightness
  - Studios are baked ahead of the camera, up to two layers away, one per frame and only after the first scroll (page load stays as it was), not when a layer mounts: baking on mount stacked onto the layer's shader compile and froze Core for 2.5 s under software GL
  - Contrast held by raising the project meta labels (Period, Role) from `mist/80` to `mist`: the tinted skies took them to 4.38–4.46:1. The moods were not dimmed to suit the floor colour
  - `verify:phase3` hardened, measuring the same things: colour transitions are finished before text colours are read and are off while text is hidden (the new link transition otherwise read as 1.00:1), and the packets check is pinned to Low and reads up to four times (auto-downgrade's recompile could freeze the one 1.5 s window)
  - `verify:phase4`: one mood per layer, the sky costs no draw call, mood settles per layer, neighbours ΔE ≥ 8, hand-over blends in order with no jump

**Done when:** each layer has exactly one effect you would screenshot. Resist adding a second.

---

## Phase 5 — Polish ✅ COMPLETE
*Goal: the details that get it nominated. Est. 3 days.*

- [x] **5.1 Preloader** — deliberately not a blocking screen: the page is readable the moment it paints, which is what Lighthouse and a recruiter both measure. The canvas fades in behind it once `Warmup` has compiled every shader and two real frames have drawn, so the reveal never shows programs compiling. A 1 px accent line at the top follows drei's `useProgress` — real texture downloads as staged layers load, never a timer. Both live in the lazy chunk
- [~] **5.2 Custom cursor** — magnetic on interactive elements; disabled on touch
  - [x] Magnetic pull on the hero's two buttons: `src/dom/motion/useMagnet.ts`, written after React Bits' `Magnet` rather than copied. Writes `transform` directly (no re-renders); only for a fine pointer that can hover, never with reduced motion
  - [-] A replacement cursor: cut. D11 already rejected cursor gimmicks, and hiding the system cursor costs precision and accessibility for a portfolio whose content is text
- [x] **5.3 Micro-interactions** — link hovers, button states, scroll hint, layer-entry text reveals
  - [x] One-time decode of the hero role line — `src/dom/motion/DecodeText.tsx`. Screen readers get the real text from a visually hidden copy (`aria-label` on a plain span is not reliably announced); reduced motion shows it plain
  - [x] Hero stats count up once when in view — `src/dom/motion/CountUp.tsx`, no `motion`. The final value is always in the DOM for screen readers and crawlers
  - [x] Pointer-following light on the portrait — `src/dom/motion/Glare.tsx` plus one CSS gradient. Project articles have no card edges, so the portrait is the only surface it suits
  - [x] Nothing was copied, so no Commons Clause code is in the repo and `LICENSE` needs no carve-out. All four pieces were written here after the React Bits originals, respect `prefers-reduced-motion`, and import no animation library: the entry bundle grew 1.5 KB gzip, GSAP stays lazy
  - [x] Text links (`.link`): always underlined, so never colour alone (WCAG 1.4.1); a slate rule at rest and an accent rule drawn in from the left on hover or keyboard focus. Backgrounds only, no reflow. External `↗` nudges 2 px toward where it goes
  - [x] Buttons (`.btn`): one set of states — pressed sits 1 px down, focus uses the global ring, disabled is dimmed. The contact submit is disabled and `aria-busy` while sending; success and failure are announced in the existing live region, failure with email as the way out. Checked against a stubbed form service
  - [x] Section-entry reveals: already in place since Phase 1 as a CSS scroll-driven animation (no JS; browsers without view timelines show the content). Fixed its range: it was measured over `cover`, which scales with height, so the 5300 px Work section reached full opacity only 1600 px in and dimmed the first project inside it. Now `entry 5%–45%`, at most a viewport long
  - `verify:phase5`: hover draws the underline, every link ruled at rest, every section reveals fully, nothing in the first viewport waits, CLS over a full read < 0.05, the form's three states, no reveals under reduced motion
  - [-] Scroll hint: cut. At 1440 × 900 the hero already fills the viewport to its stats row, so a hint pushes the stats below the fold; the layer dots on the right already say there is more below
- [-] **5.4 Sound design** *(cut by D4)* — ambient bed per layer + UI ticks via Howler.js; muted by default, persistent toggle, respects `prefers-reduced-motion`
- [-] **5.5 Collectibles** *(cut by D8)* — 5 hidden objects, one per layer; `useDiscoveryStore` persisted to `localStorage`; all five unlock the resume download with a small celebration
- [x] **5.6 404 page** — `public/404.html`, which GitHub Pages serves for any unknown path. Self-contained: inline styles in the site's palette, a CSS starfield, no app bundle. Shows the path asked for (as text, never markup) and routes back to the top and to the work
- [x] **5.7 Easter egg** — a styled note in the console for whoever opens it: the repo link and the `?debug=1` / `?tier=` switches. A few hundred bytes

---

## Phase 6 — Hardening
*Goal: it works for everyone, everywhere. Est. 2 days.*

- [x] **6.1 Quality tiers** — `useDeviceTier` detection; High / Medium / Low; manual override in UI, persisted
  - [x] Pulled forward for 4.8: `src/store/useQualityStore.ts` (three-free). Detected once at boot: coarse pointer, ≤ 2 GB or ≤ 2 cores is Low; ≥ 8 cores with ≥ 8 GB (or unknown memory) is High; everything else Medium. `?tier=low|medium|high` forces a tier; a saved choice in `localStorage` (`quality-tier`) is honoured, and blocked storage falls back to detection. Shown in the `?debug=1` overlay
  - [x] D12 reconciled: phones never reach tier detection; they are Static
  - [x] Toggle in the footer (`src/dom/ui/GraphicsToggle.tsx`): Automatic, High, Medium, Low, or Off (the 2D page). A native `<select>`, so keyboard and screen-reader support come free. A tier applies at once; Off, and coming back from it, reloads, since whether the canvas exists is decided at startup. Saved in `localStorage` (`quality-tier`); offered only where 3D could run (not on phones, without WebGL, or under reduced motion)
- [x] **6.2 Auto-downgrade** — `src/canvas/AutoDowngrade.tsx` on drei's `PerformanceMonitor`: on a sustained decline, High → Medium (glass, vignette, aberration off; fewer particles) → Low (post-processing off) → DPR 1. Shadows are not a rung: the scene has none (D9 lighting). Never steps back up within a visit — flip-flopping would recompile shaders, the stutter it exists to avoid — never persisted, and never overrides a tier the visitor or `?tier=` chose
- [x] **6.3 Static tier** — no-WebGL / reduced-motion / user-toggle path serves the Phase 1 build. Verified by disabling WebGL in the browser
  - `verify:phase4` launches Chrome with `--disable-webgl --disable-3d-apis`: no canvas, three.js never fetched, no graphics toggle, all content, no errors. Reduced motion, phones and the Off toggle were already covered
- [ ] **6.4 Mobile pass** — real device testing on a low-end and a mid-tier Android; touch scroll feel; thermal check over 3 minutes
- [~] **6.5 Accessibility audit** — `npm run verify:a11y` (19 checks, axe-core): zero serious or critical violations on the 3D page, the Static page, a phone and the 404; keyboard reaches everything in document order with a visible focus ring and nothing focusable inside the canvas; **Esc** switches to the plain view for the visit (sessionStorage, not the saved choice), offered also as the second skip link, and Esc inside the contact form stays with the field
  - Fixed: the TRUUNA screenshot row scrolls sideways on phones but could not be reached from a keyboard (axe `scrollable-region-focusable`); it is now focusable, named, and arrow keys scroll it
  - axe's contrast rule cannot see the 3D scene; contrast against the rendered scene stays with `verify:phase3`'s pixel measurement (hero and every staged article)
  - [ ] Screen-reader read-through — needs a person; steps in `DEVICE_TESTING.md` §6
- [ ] **6.6 Cross-browser** — Chrome, Firefox, Safari (macOS + iOS), Edge, Samsung Internet. Needs devices; steps in `DEVICE_TESTING.md` §5
- [~] **6.7 Performance gate** — Lighthouse ≥ 85 desktop / ≥ 70 mobile; all §6 budgets verified in CI
  - [x] CI runs every browser suite before deploy: one matrix job per suite (phase2–5, a11y) in parallel, and `deploy` needs them all. ubuntu-latest's preinstalled Chrome; software GL, hence tiers forced wherever a check compares numbers
  - [x] `npm run perf:lighthouse` (local, not CI — scores under shared runners are too noisy to gate on). Measured here: **mobile 98 / 99 / 100 / 100** (Performance / Accessibility / Best Practices / SEO; LCP 2.2 s, TBT 30 ms, CLS 0.012). **Desktop 100 / 100 / 100 on the last three; Performance 67–70**
  - **Desktop Performance is a software-GL artefact, measured, not assumed.** TBT was 1.5–3.2 s run to run, and every frame of the scene under SwiftShader is itself a 130–400 ms long task, so TBT grows with the frame count. The same page without the canvas (mobile) has 30 ms. The one real cost found — a ~1 s synchronous shader compile in `Warmup` — now uses `compileAsync` (parallel compile where the driver supports it). Desktop Performance is advisory in the script unless `LIGHTHOUSE_STRICT=1`, and needs a run on a machine with a GPU (`DEVICE_TESTING.md` §3)
- [~] **6.8 Launch** — analytics (Plausible or GoatCounter), OG preview verified on LinkedIn + WhatsApp, custom domain if D6 says yes, resume + LinkedIn updated with the URL
  - [x] OG metadata checked by `verify:phase5`: absolute https image, canonical matches og:url, large Twitter card, image 1200 × 630 as declared and under 300 KB. It was 415 KB — over the size WhatsApp will fetch for a preview — and is now a 91 KB palette PNG, generator updated
  - [x] Analytics: GoatCounter, wired and off until switched on. `src/analytics.ts` loads its ~3 KB script after idle, only when the build has a site code (`VITE_GOATCOUNTER`, from the repository variable `GOATCOUNTER_CODE`); never for Do Not Track, Global Privacy Control, localhost, `?debug` or automated browsers. No cookies, so no consent banner. Résumé and Play Store links carry `data-goatcounter-click`, so downloads are counted as events. `verify:phase5` checks the gates and that a build without a code mentions no endpoint
  - [ ] To switch on: create a free GoatCounter site, then set the repository variable `GOATCOUNTER_CODE` to its code (Settings → Secrets and variables → Actions → Variables) and redeploy
  - [ ] Link previews by hand (`DEVICE_TESTING.md` §6)
  - [-] Custom domain: not now (D6)

---

## Assets Register

| ID | Asset | Needed by | Status |
|---|---|---|---|
| A1 | Professional photo | 1.4 | **received and processed** — `assets-source/img/shridhanImage.jpeg`, 1000×1500 RGB. Graded rather than cut out (Phase 1.4); variants in `public/img/` |
| A2 | Resume PDF | 1.5 | received — published at `public/resume.pdf` |
| A3 | TRUUNA screenshots | 3.2 | **received ×5** — language, OTP login, configurator, booking summary, order timeline |
| A4 | aashman.in captures | 3.3 | **received ×8** |
| A5 | DMS POS screenshots | 3.6 | **received ×4** |
| A6 | Urja Dairy Tour screenshots | 3.6 | **received ×5** |
| A7 | Raspberry Pi kiosk photos ×2–3 | 3.4 | **CUT — none available.** L3 Ground (L5 before D10) rescoped to pure geometry; see Appendix A revision |
| A8 | Aashman Technicals logo (SVG) | 3.3 | pending, optional |
| A9 | TRUUNA screen recording | 4.3 | pending, optional |
| A10 | Web3Forms access key | 1.6 | **received** — inlined in `src/dom/sections/Contact.tsx`, `VITE_WEB3FORMS_KEY` overrides it. See Confirmed Facts and Appendix B |

---

## Open Decisions

| ID | Question | Blocks | Answer |
|---|---|---|---|
| D1 | Tone | 1.2, 4.9 | **DECIDED: cinematic-serious.** Dark, restrained, moody lighting. Reads senior; suits the descent concept. |
| D2 | Audience | 1.2 | **DECIDED: Indian product companies, primary — written so it does not block remote.** Keep the LinkedIn CTA level with the resume download and one "open to remote" line; omit async/timezone copy. |
| D3 | Colour direction | 4.9 | **Default applied 2026-11-24:** a palette per layer derived from D1 (`src/canvas/moods.ts`). Still open to override: change the table, keep `verify:phase3` contrast and `verify:phase4` separation passing. |
| D4 | Ambient sound, muted by default? | 5.4 | **DECIDED 2026-11-25: no sound.** Recruiters read portfolios at work, muted, and browsers block autoplay; a muted-by-default bed would be heard by almost no one while costing a toggle, assets and upkeep. The 5.4 budget went to finishing 4.9 and 5.3. |
| D5 | Publish the phone number? | 1.1 | **DECIDED: no.** Email + contact form only. Number stays in the resume PDF. |
| D6 | Custom domain? | 6.8 | **DECIDED 2026-11-25: not now.** `shridhan29.github.io` is free, already on the résumé and indexed; a domain adds a yearly cost and a renewal to remember. Revisit if one is bought: the build is domain-agnostic except `index.html` metadata, `robots.txt` and `sitemap.xml`. |
| D7 | 3D asset source | 3.1–3.6 | **DECIDED: CC0 kits + procedural geometry.** Poly Haven / Quaternius assets plus code-generated shapes. No Blender modelling required; bakes come from the kits or are faked with baked-look materials. |
| D8 | Collectibles: five or six? | 5.5 | **DECIDED 2026-11-25: neither — cut.** The plan gated the résumé download behind finding all of them, and the résumé is the one thing a recruiter must never have to work for. As an ungated extra it would be a game few would find, hiding objects across six layers, against D1's restraint. The console note (5.7) stays as the easter egg. |
| D9 | Environment lighting within 200 KB | 3.1–3.6 | **DECIDED 2026-09-17: (a) procedural light panels** rendered into a 64 px environment map — 0 KB, art-directable per layer. A 1k Poly Haven HDRI measured 1.3–1.6 MB, and one per layer would have been ~9 MB. |
| D10 | How the 3D journey lines up with the page | 2.6, 3.2–3.6 | **DECIDED 2026-09-17: follow the page order.** Each layer arrives with its article; layer order is Orbit, Device (TRUUNA), Surface (aashman.in), Ground (DMS + Urja), Core (About/Skills), Cloud (Experience). The page is unchanged; the descent no longer ends at hardware. |
| D11 | Third-party component libraries | 5.2, 5.3 | **DECIDED 2026-09-17: React Bits, selectively; Aceternity UI, no.** React Bits matches the stack (React 19, Tailwind v4, TS) and its licence (MIT + Commons Clause) allows use inside the site; take only `Magnet`, `ScrambledText`/`DecryptedText`, a `CountUp`-style counter and `SpotlightCard`/`GlareHover`. Rejected: all React Bits backgrounds (each opens a second WebGL context via `ogl`, breaking the one-canvas rule) and cursor gimmicks. Aceternity rejected: its signature effects are the generic glow-and-gradient look D1 avoids, Globe and Macbook Scroll duplicate L0 and L1, it assumes Next.js, and its licence forbids redistributing source files, which a public repo arguably does. |
| D12 | 3D on phones | 3.8, 6.1 | **DECIDED 2026-11-23: (a) phones get the Static tier.** `src/tier.ts`: a coarse pointer on a viewport under 1024 px (the stages' breakpoint) at boot means no canvas — no three.js download, no GPU context. A touch tablet at ≥ 1024 px keeps the scene, on the Low tier. `verify:phase4` checks both. |

---

## Appendix A — Screenshot Brief (B2)

Exact shots wanted, derived from what each project actually does. The build pipeline converts to AVIF + WebP at two sizes.

> **Historical brief — B2 is cleared.** The 22 files that arrived did not follow these filenames; originals live in `assets-source/img/<project>/` (outside `public/`, so they are never published) and `scripts/process-screenshots.mjs` renames them to stable slugs in `public/img/<project>/`. The tables below record what was asked for, not what is on disk.

**Universal rules**
- PNG, no compression, native resolution. Never a photo of a screen, never a crop from WhatsApp.
- **Test/demo data only.** No real customer names, phone numbers, addresses, order values, or staff records. If real data cannot be avoided, say so and it gets blurred in post.
- Consistent state: same demo account, same theme, same language across a project's set.
- Full window, no cursor, no browser dev tools, no OS notification bars where avoidable.

### A3 — TRUUNA (Flutter, live on Play Store) → `assets-source/img/truuna/`

The hero project. It carries L1 Device and gets the most screen area on the site.

| # | Filename | Shot | Why it earns its place |
|---|---|---|---|
| 1 | `01-onboarding.png` | First-run onboarding / splash | Establishes the brand and the app's look |
| 2 | `02-otp.png` | Phone-OTP screen, **dummy number** | Proves Firebase Phone Auth visually |
| 3 | `03-catalog.png` | Product catalog grid | The commerce core |
| 4 | `04-product.png` | Product detail | Shows depth beyond a list view |
| 5 | `05-cart-booking.png` | Cart / booking screen | The conversion step |
| 6 | `06-quote-pdf.png` | Generated PDF quote (the PDF, or the in-app preview) | Server-generated PDFs are a real backend flex |
| 7 | `07-payment.png` | Advance payment screen | ⚠️ see note below |
| 8 | `08-order-timeline.png` | Order timeline / status tracking | Shows post-purchase lifecycle |
| 9 | `09-playstore.png` | The Play Store listing page itself | **Highest-credibility shot in the whole set** — proof it shipped |

> **⚠️ Shot 7 will fail on a normal build.** You set `FLAG_SECURE` on the payment screens, so Android returns a black frame. Capture it from a debug/staging flavour with the flag off, or from an emulator. If neither is quick, skip it — the other eight carry the story.

Format: portrait, device-native (1080×2400 or whatever your test device is). Screen recording of the full flow (A9) is still welcome — it becomes a video texture on the phone slab.

### A4 — aashman.in (React 18 SPA) → `assets-source/img/aashman.in/`

| # | Filename | Shot |
|---|---|---|
| 1 | `01-home-desktop.png` | Home route, **full-page** capture, 1440 px wide |
| 2 | `02-services-desktop.png` | Services or products route, full-page, 1440 px |
| 3 | `03-gallery-lightbox.png` | Media lightbox **open**, mid-zoom — the pinch-zoom feature is on the resume, so show it |
| 4 | `04-contact-desktop.png` | Contact route with the reCAPTCHA v2 widget visible — shows the secure PHP API front-end |
| 5 | `05-home-mobile.png` | Home, 390 px wide, full-page |
| 6 | `06-nav-mobile.png` | Mobile nav menu open |

Full-page capture in Chrome: `F12` → `Ctrl+Shift+P` → type "Capture full size screenshot".

### A5 — DMS Dairy POS (Raspberry Pi) → `assets-source/img/dms/`

| # | Filename | Shot |
|---|---|---|
| 1 | `01-dashboard.png` | Chart.js dashboard with charts populated (demo data) |
| 2 | `02-pos-billing.png` | The POS / billing screen mid-transaction |
| 3 | `03-inventory.png` | Product & inventory management table |
| 4 | `04-invoice.png` | A generated PDF invoice |
| 5 | `05-audit.png` | Audit history or staff records view — *optional, shows the depth* |

### A6 — Urja Dairy Tour (Raspberry Pi kiosk) → `assets-source/img/urja/`

| # | Filename | Shot |
|---|---|---|
| 1 | `01-language-select.png` | The English / हिंदी / मराठी selector — **the signature screen**, lead with it |
| 2 | `02-categories.png` | Category selection |
| 3 | `03-playback.png` | Tour playing, with progress indicator and playback controls visible |
| 4 | `04-tour-detail.png` | A tour stop's content view |

Capture at the kiosk's real resolution, not a scaled browser window.

### A7 — Raspberry Pi hardware — **CUT, no photos available**

No field photos exist. This does not cost the site much, because the Ground layer was always going to be geometry rather than photography. Revised plan for L3 Ground (L5 before decision D10):

- **Raspberry Pi board:** a CC0 Pi model (Sketchfab CC0 / Poly Haven electronics props), or built procedurally — a Pi is a green box, a black SoC, four USB blocks and a GPIO comb. Roughly 40 lines of `three` primitives and it reads instantly.
- **Kiosk enclosure:** procedural — a slab, a stand, a bezel. No modelling skill needed.
- **The kiosk screen:** this is where the credibility comes back. Instead of a photo of hardware, the screen renders the **real Urja Dairy Tour UI** live via `<Html transform>` — the language selector, actually clickable, inside the 3D scene. A working interface beats a photo of a box.
- **Second screen** in the diorama shows the DMS POS billing view the same way.

Net effect: L3 Ground needs A5 and A6 screenshots, and no hardware photography at all.

If a field photo ever becomes available — a colleague at the plant, a site visit, an old phone gallery — it slots straight in as a texture on a frame beside the diorama. Worth asking around; it is still the strongest possible proof. But the layer ships without it.

### If a project is dead or inaccessible

Say so rather than skipping silently. Fallbacks in order: an old screenshot at any quality → a screen recording frame → a stylized recreation built from the description. The 3D layer still works; it just leans on geometry instead of imagery.

---

## Appendix B — Contact Form Backend (B3)

**Why any of this is needed:** GitHub Pages serves static files only. There is no PHP, no Node, no mail server. The `mail()`-based PHP contact API from aashman.in cannot be reused here. A third-party form service is the standard answer for static hosting.

**How it works:** the form POSTs to the service's endpoint with a public access key. The service validates, filters spam, and emails the submission to you. No account credentials ship in the bundle — the access key is designed to be public, and it is domain-restricted.

**Cost: free, and it stays free at portfolio volume.**

| | Web3Forms (recommended) | Formspree |
|---|---|---|
| Free submissions/month | **250** | 50 |
| Credit card for free tier | No | No |
| Free submission history | 30 days | 30 days |
| Unlimited forms & domains | Yes | Yes |
| Spam protection | hCaptcha + advanced filtering | Honeypot only |
| First paid tier | Starter, 5,000/mo | Personal, $15/mo for 200/mo |

Web3Forms gives 5× the free headroom and better spam handling at the same price of zero. A portfolio realistically sees single-digit submissions a month, so the 250 ceiling will never be approached.

**Free tier includes:** 250 submissions/month, unlimited forms and domains, 30-day submission history, advanced spam filtering, hCaptcha, custom redirects.
**Paid-only:** webhooks, file uploads, the submissions API, history beyond 30 days, and **domain restriction**.

**Setup — about two minutes, no signup:** see the step-by-step in the reply thread; the key goes into `.env` as `VITE_WEB3FORMS_KEY=...`.

**On key abuse:** the access key is public by design and, on the free tier, cannot be locked to one domain. The realistic worst case is someone copying it to spam your inbox. Mitigated by the honeypot field, hCaptcha, and the fact that a key can be regenerated instantly. Not worth $12/month to prevent at portfolio scale.

**Trade-off, stated plainly:** contact-form messages pass through a third party before reaching your inbox. That is unavoidable on static hosting and is what every static portfolio does. A `mailto:` link is offered alongside the form for anyone who prefers to skip it.

---

## Change Log

| Date | Change |
|---|---|
| 2026-11-25 | **UI refresh; every project screenshot visible.** On desktop the 3D stage used to replace each project's screenshot row, and showed one tilted screen (aashman.in stacked six panes, so five were hidden); web shots were also cropped to a fixed 1843×954 box, which cut the 1284×959 DMS point-of-sale shot. Now every project has a gallery at every width: phone screens in handset frames, web screens in browser frames two to a row, each at its true proportions (letterboxed, never cropped), all opening in a native `<dialog>` lightbox with arrow keys and focus return. The 3D stage stays as a showcase above it. Esc in the lightbox no longer triggers the Esc plain-view shortcut. Projects become numbered cards; new tokens (`line`, `line-strong`, `accent-soft`) and shared `.card`, `.chip`, `.btn-primary`, `.btn-ghost`, `.field` styles; Skills, Experience, Contact, hero stats and the nav restyled to match. `verify:phase3` updated: a staged project must now show its stage *and* its full gallery. |
| 2026-11-25 | **Decisions D4, D6 and D8 closed; analytics wired.** No sound (5.4 cut), no collectibles (5.5 cut: the résumé is never gated), no custom domain for now. GoatCounter added behind a build-time site code, so it is off until the repository variable is set; privacy signals and automated browsers are never counted. Phase 5 is complete. What remains needs a person: device, browser, screen-reader and link-preview checks, desktop Lighthouse on a GPU, and creating the GoatCounter site. |
| 2026-11-24 | **4.9, 5.3 and 6.3 complete.** Per-layer moods (own studio environment per layer, scroll-eased sky; no draw calls added) on D3's default. Links and buttons given one set of states; the contact form's sending state is marked busy. Found and fixed the section reveal dimming the first project (range scaled with the 5300 px Work section). No-WebGL path verified in a real browser. First CI run with the verify gate: all six jobs green, about 5 minutes. |
| 2026-11-24 | **Phase 6, automatable part.** CI gates deploy on every browser suite (parallel matrix). `verify:a11y` added (axe-core, keyboard, Esc plain view); fixed a keyboard-unreachable screenshot scroller. `perf:lighthouse` added (lighthouse, chrome-launcher): mobile 98, desktop Performance 67–70 traced to software GL rather than the site, after replacing a ~1 s synchronous shader compile with `compileAsync`. OG image cut from 415 KB to 91 KB. `DEVICE_TESTING.md` now covers phones as Static, other browsers, link previews and a screen-reader pass. New devDependencies: axe-core, lighthouse, chrome-launcher. |
| 2026-11-24 | **Phase 5, first pass.** 5.1 non-blocking reveal, 5.2 magnetic buttons (custom cursor cut), 5.3 decode, count-up and portrait glare, 5.6 404 page, 5.7 console note. 5.4 waits on D4 and 5.5 on D8. Added `verify:phase5` (29 checks), each feature tested with motion allowed and reduced. Headless Chrome reports no pointer, so hover-only features switched themselves off under test — correct behaviour, but untestable; the suite stands in a desktop mouse by answering only the pointer half of the media query. Entry 79.4 / 180 KB gzip. |
| 2026-11-23 | **6.1 and 6.2 complete.** Footer graphics toggle (Automatic / High / Medium / Low / Off) and the auto-downgrade ladder. `src/tier.ts` now separates `SUPPORTS_3D` (could the device run it) from `CAN_RENDER_3D` (will it, given the visitor's choice). `verify:phase4` adds toggle and downgrade checks (54 in all); under software GL a detected tier steps down within seconds, and a forced one never does — which is also why the suites force tiers wherever they compare numbers. Found on the way: a downgrade from Medium to Low removes the composer, which changes the renderer's tone mapping and recompiles every material — a one-off hitch, seconds long under software GL, that made the Phase 2 layer-sync check read a stale layer. That check now pins its tier; the hitch itself is the accepted price of a downgrade, paid once per visit at most twice. |
| 2026-11-23 | **Phase 4 complete except 4.9 (blocked on D3).** 4.1 particle system and the 4.2 name dispersal; L1 screen glow spill; L3 warm practicals; D12 decided — phones are Static and no longer download three.js. Defects caught from captures: the name was mis-projected (flat px scale ignored the camera's tilt) and, at 60k particles, brighter than the headline. Chromatic aberration halved after it fringed the particle letters. Suites updated: the Phase 3 hero draw-call count now allows for the name's one call; phone-with-3D expectations removed from Phase 2 and 3; `verify:phase4` adds particle, morph, spill, practicals and phones-as-Static checks. |
| 2026-11-23 | **4.8 complete; tiers started (6.1).** Quality store with detection and `?tier=` override; tier-gated post-processing with brightness-selective bloom; glass on L2 (High only); fog on L5; packet count by tier. Two defects caught by looking at captures rather than numbers: ACES tone mapping in the composer washed out every product screenshot (switched to Neutral), and the first glass pass frosted the aashman.in page grey (now clear). Added `verify:phase4` and wired it into `npm run verify`. Software-GL fps on High is ~1, so the suites force tiers rather than trusting detection. 4.1 particles, the L0 name dispersal, L1 glow spill and L3 warm lights remain. |
| 2026-09-07 | Tracker created. Architecture and build prompt drafted. Repo name availability confirmed. |
| 2026-09-07 | Decisions D1, D2, D5, D7 answered. D3, D4, D6 deferred with defaults. B4 cleared. Phase 3 rescoped from Blender modelling to CC0 kits + procedural geometry. |
| 2026-09-07 | Appendix A (screenshot brief) and Appendix B (form backend) added. Asset register made specific. |
| 2026-09-07 | A1 photo received (1000×1500), B1 cleared. A7 hardware photos cut — none exist; L5 rescoped to procedural geometry plus live `<Html transform>` UIs on the kiosk screens. |
| 2026-09-07 | Web3Forms form created and key stored in `.env`. B3 cleared. `.gitignore` and `.env.example` added. Only A3–A6 screenshots remain outstanding. |
| 2026-09-07 | Phase 0 built: repo created, Vite 8 / React 19 / TS 6 scaffold, 3D and motion dependencies, Tailwind v4 tokens, bundle-budget guardrail, Pages workflow, README and licence. Toolchain landed newer than the architecture assumed (Vite 8 not 6, oxlint not ESLint) — docs updated to match. |
| 2026-09-07 | **Phase 0 complete.** Work had been committed to a local `backend` branch while `main` still sat at the initial commit; `main` was fast-forwarded to it and pushed. Pages was on `legacy` branch-serving mode, which would have served unbuilt source — switched to `workflow`. Live and green at https://shridhan29.github.io. |
| 2026-09-07 | **Phase 1 complete.** Static portfolio built, deployed and verified live. All 22 screenshots received and processed, clearing B2 and unblocking Phase 3. Remaining: a Lighthouse run and a real-device pass. |
| 2026-09-07 | Web3Forms key inlined in `Contact.tsx` with a `VITE_WEB3FORMS_KEY` override. As a CI secret it added no security — the key ships in the client bundle regardless — while giving the deployed form a way to silently break. |
| 2026-09-07 | Post-Phase-1 audit. Three real defects found and fixed: 7.6 MB of raw originals were being published (sources sat inside `public/`, which ships verbatim — moved to `assets-source/`, dist 9.9 MB to 2.4 MB); six text tints failed WCAG AA (`mist/50` 2.39:1, `/60` 2.97:1, `/70` 3.69:1 — floor raised to `/80`); and mobile had no navigation at all. Removed unused `profile.openToRemote`; synced README and the architecture folder diagram. |
| 2026-09-07 | Responsive rework. Fixed 1024 px container replaced with a fluid `.shell` (max 2200 px, `clamp()` padding), fluid type scale, and reading measures capped so wide screens gain space rather than line length. Project shot rows promoted to full block width; highlights split to two columns at xl. Verified 390 / 768 / 1280 / 1440 / 1920 / 2560. |
| 2026-09-07 | **Phase 2 complete.** Scroll-to-camera engine live against six placeholder layers. Two bugs caught: `three` was being pulled into the entry graph by `path.ts` (the store and the DOM layer-nav imported it for layer data), split into three-free `layers.ts` and `curve.ts`; and Vite was emitting a `modulepreload` for the lazy 3D chunk, downloading 231 KB on first paint and defeating the deferral — filtered via `build.modulePreload.resolveDependencies`. The budget script classified chunks by filename, which hid both; it now reads `dist/index.html` to see what actually loads eagerly and fails if `three` is ever in it. Entry 75.4/180 KB gzip, lazy 280.8/600 KB. |
| 2026-09-07 | Added `scripts/verify-phase2.mjs` and `npm run verify:phase2` — 29 automated checks across the bundle graph, source invariants and a driven browser. Two failures on first run were the harness's own fault (the layer-nav renders every label as sr-only text, so scraping `body.innerText` always matched the first layer); the overlay now carries `data-debug` hooks. Confirmed the render loop reports ~40–50 fps, closing the one item Phase 2 could not verify. (The draw-call figure recorded alongside it was a per-window total — see 2026-09-16.) |
| 2026-09-16 | Post-Phase-2 audit. Lint, typecheck, build and budgets re-verified from a clean install; the live site serves the same asset hashes as a fresh build of `main`. Fixed: `verify:phase2` could not run on Windows (`spawn npx` → `ENOENT`) and its Chrome lookup never checked anything (an async `.find()` predicate is always truthy); `npm run analyze` used an `ANALYZE=1` prefix that `cmd.exe` cannot parse, now `--mode analyze`; 17 files had drifted from Prettier because CI never checked formatting — formatted, `format:check` extended to `scripts/` and added to CI; `.gitattributes` pins LF so Windows checkouts do not flag every file. Removed the unused Vite starter stylesheet `src/index.css`. The debug overlay's `calls` and `tris` were summed over each 0.5 s sample window, so they scaled with fps and the ≤ 120 per-frame budget check compared the wrong number — now divided by the frame count, and the check requires a non-zero reading taken on a layer (p = 0.6) rather than between two, where everything is correctly frustum-culled. Synced this tracker, `ARCHITECTURE.md` and the README with what was built. Added D8. |
| 2026-09-16 | **Phase 3.0 complete.** Model pipeline, shared Meshopt loader, model budgets in CI and `verify:models`. Two deviations from the architecture, both recorded under 3.0: Meshopt instead of Draco, WebP instead of KTX2. No models exist yet — by D7 most layers are procedural geometry, so the pipeline serves CC0 kit props and the L5 diorama. |
| 2026-09-16 | Phase 3.0 review. Fixed three pipeline defects the first pass missed: normal maps were encoded as lossy WebP (now lossless — lossy blocks show as faceting under light); the credits gate matched substrings, so crediting `not-fixture.glb` let `fixture.glb` through (now whole filenames); simplification could move open borders and crack modular kit pieces apart (now `lockBorder`). `verify:models` covers all three and was mutation-tested — reverting either the lossless or the credits fix fails it. Found the HDRI budget unworkable and opened D9. |
| 2026-09-16 | Added `npm run verify` (`scripts/verify-all.mjs`): every check in one command, dependent steps skipped rather than run on stale output, exit code non-zero on any failure or skip; checked by injecting a type error. Running it with `--live` exposed two defects already on the live site. **Mobile overflow:** on a phone the page laid out 756 px wide on a 390 px screen, so browsers zoomed the whole site out. Cause: the sr-only captions (`position: absolute`) inside the TRUUNA screenshot scroller had no positioned ancestor within it, so they escaped `overflow-x`; the Phase 1 checks at 390 px used a desktop window, where `body { overflow-x: hidden }` hides it. Fixed with `relative` on each item, and `verify:phase2` now checks both tiers on an emulated phone (31 checks; confirmed failing without the fix). **Stray CSS:** Tailwind v4 scanned the whole repo, so words in docs and scripts ("table", "shadow", "container", "collapse") shipped unused utilities; sources are now limited to `src/` and `index.html`, CSS 29.5 → 27.1 KB, and a full-page comparison against the live site showed no layout change. |
| 2026-09-17 | **3.1 L0 Orbit and 3.7 gating complete.** D9 decided (a). Found and fixed on the way: 3D geometry drew straight through the hero headline on the live site (text now on a scrim, and the monolith is placed from measured layout); a 6–15 s first-frame stall from the environment map; a near-black metal material that rendered as a flat cut-out. Extracted `scripts/lib/harness.mjs` so the three suites share reporting, browser and server code. Added `verify:phase3` to `npm run verify`. |
| 2026-09-17 | Review before commit. The contrast check skipped every link on the assumption they had solid backgrounds; two of the three hero links and the whole header sit directly on the canvas. Widened it, which surfaced the logo's accent-blue dot at 4.07:1 — marked `aria-hidden` as decorative (screen readers now say "shridhan", not "shridhan dot"). Noted, not yet fixed: `--font-display: 'Satoshi'` is declared but no font is ever loaded, so headings render in the system font. Pre-dates Phase 3; belongs to 5.3 or a typography pass. |
| 2026-09-17 | **D10: layers follow the page.** Building L1 exposed that the camera ran on an even split of the scroll while the articles do not: at 1440 px the TRUUNA phone would have shown over the aashman.in article, and the Raspberry Pi layer was last although its projects sit mid-page. Reordered to Orbit, Device, Surface, Ground, Core, Cloud; `src/store/stops.ts` maps scroll through measured article positions, re-measured on resize; the camera curve is sampled by parameter so each stop lands on its layer. `verify:phase2` now scrolls to every article at 1440 px and on a phone and checks the camera is at its layer (33 checks) — reverting to the even split fails it on 4 and 5 layers. |
| 2026-09-17 | **3.2 L1 Device complete.** Placement chosen for impact: the phone replaces TRUUNA's screenshot row on desktop instead of repeating it. Moved the 3D-tier decision to `src/tier.ts` so sections can reserve stages. Noted for 3.3: the L2 placeholder wireframe still draws over the aashman.in article text until that layer is built. Noted, pre-existing: in the visible screenshot rows each image's `alt` and its sr-only `figcaption` carry the same text, so screen readers announce each shot twice. |
| 2026-09-17 | D11: reviewed React Bits and Aceternity UI. Four small React Bits pieces added to 5.2 and 5.3 with licence, reduced-motion and budget conditions; Aceternity not used. |
| 2026-09-17 | **3.3 L2 Surface complete.** The placeholder wireframe over the aashman.in article is gone. |
| 2026-09-17 | Review of L1–L2: staged layers mounted at startup, so a phone downloaded 156 KB of layer textures it never shows, and desktop fetched L2's pages before leaving the hero. `src/canvas/Staged.tsx` mounts a staged layer only when its stage is laid out and the camera is within reach; `verify:phase3` (34 checks) confirms a phone downloads none and desktop defers L2, and fails without the fix. ARCHITECTURE §4.6 documents scenery vs staged layers. |
| 2026-09-17 | **3.4 L3 Ground complete.** The L3 placeholder no longer draws over the DMS and Urja articles. Still to replace: the L4 and L5 placeholders over About, Skills and Experience. |
| 2026-09-17 | Process slip, corrected. The L3 commits were pushed although `npm run verify` had failed: the verify output was piped through `tail`, whose exit code let the chained commit run. CI and the live site were unaffected. The failing check pinned the camera at L3 with `?p=` while the page sat at the top — since L3 became staged, its stages were off screen and it correctly drew nothing, which the check treats as unmeasured. It now samples draw calls at real scroll positions (top and each article centred): at most 12 per frame against the 120 budget. Commits now wait for verify's own exit code. |
| 2026-09-17 | **3.5 L4 Core complete.** The L4 placeholder no longer draws over About and Skills; only the L5 placeholder over Experience remains. |
| 2026-09-18 | **3.6 L5 Cloud complete — all six layers built.** No placeholder geometry remains anywhere on the site. Remaining in Phase 3: 3.8 performance checkpoint. |
| 2026-09-18 | **Review after L5 found two serious defects, both fixed.** (1) *three.js was downloaded on every first visit.* zustand is shared by the page and react-three-fiber; the bundler put it in the three chunk and the entry imported it statically, so the lazy 3D payload loaded eagerly — including on phones and in the Static tier. The budget check only read `index.html`, so it reported a 75 KB entry while visitors downloaded 303 KB. Fixed by chunking zustand with React (entry now 76.7 KB, three chunk truly lazy); `scripts/lib/bundle.mjs` computes the eager set by following static imports, used by the build budget and `verify:phase2`, plus a runtime check that the no-WebGL page never requests the three chunk. (2) *A failed 3D download blanked the whole site.* The lazy scene had no error boundary, so a failed chunk unmounted the app. `SceneBoundary` now contains it and marks `html[data-scene-off]` (also set on GPU context loss); the `scene-off:` CSS variant hides every stage and brings back the screenshots it stood in for. Stages stay the default on capable desktops, so a normal visit still never fetches the rows' images — a first attempt that showed rows until the scene started made the browser lazy-load them, which the download check caught. `verify:phase3` blocks the 3D download and checks the page is whole; removing the boundary fails it. |
| 2026-09-18 | 3.8 measurable part done: `npm run perf`, extended debug overlay, `DEVICE_TESTING.md`. Peak 13 draw calls, 428 KB on load. Opened D12 (three.js on phones for a starfield) and noted shader-compile-on-mount for 5.1. |
| 2026-09-18 | **4.3 complete** — the TRUUNA phone advances through the app's five screens on scroll. First attempt at its check measured pixels and passed against a frozen effect; replaced with the layer's own published screen index, mutation-tested both ways. |
| 2026-09-18 | **4.6 and 4.7 complete.** Effects now publish their own state (`useScrollStore.effects`, shown in the `?debug=1` overlay) and `verify:phase3` (68 checks) reads it. Two of my checks were caught being useless by mutation testing: the screen-advance check compared screenshots taken at different scroll positions (the page had moved, so everything "changed"), and the packets check compared pixels in a diagram that also sways, passing with the packets frozen. Frozen effects now read `screens 0 → 0 → 0`, `travelled 0 → 0` and `stages lit 0 → 0 → 0`, and all three fail. The suite also survives a browser dying mid-layer: that layer is retried once on a fresh browser instead of the run ending ("detached Frame" on this 4 GB machine). |
| 2026-09-18 | **4.4 complete.** Ribbons weave between the aashman.in panes and draw in on scroll. While routing them I put the extent calculation above the definitions it uses, which threw at module load: the page stayed whole and simply had no 3D, which is `SceneBoundary` doing its job. |
| 2026-09-18 | **4.5 complete.** The kiosk runs the real Urja interface inside the scene. Two test fixes on the way: `KioskScreen` sat in `layers/` and tripped the gating rule (it is screen content, now in `shared/`), and effect readings now wait for the value instead of sampling while a layer is still mounting. |
| 2026-09-18 | **4.2 (rim) complete.** The monolith's signature effect is a fresnel rim; the physical iridescence alone could not be seen against this dim environment. Hero text contrast unchanged. The name dispersing into particles waits for 4.1. |
