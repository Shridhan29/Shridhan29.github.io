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

## Phase 4 — Signature Effects
*Goal: the "insane" pass. One memorable effect per layer, and nothing more. Est. 4 days.*

- [ ] **4.1 Particle system** — single persistent `Points` buffer, per-layer target positions baked by `scripts/bake-particles.mjs`, morph interpolated in the vertex shader
- [ ] **4.2 L0** — fresnel/iridescence shader on the monolith; name text disperses into particles on scroll-out
- [x] **4.3 L1** — the phone's screen plays TRUUNA's real flow as the stage crosses the screen: language, phone-OTP login, configurator, booking summary, order timeline. `shared/ScreenSequence` cross-fades two samplers in one material (one draw call whatever the number of screens), holding each screen and flipping in the middle third of each step; `shared/roundedScreen` is the rounded display geometry, now shared with `ScreenPlane`. Five 840 px textures (~160 KB), still loaded only on approach and only on desktop. Screen glow spill on the slab stays for later
  - The layer publishes which screen is showing (`useScrollStore.screen`, in the `?debug=1` overlay), and `verify:phase3` (66 checks) reads that. A first version compared screenshots from two scroll positions and "passed" with the effect frozen — the whole page had moved between the shots, so everything differed. Frozen now reads `screens 0 → 0 → 0` and fails
- [ ] **4.4 L2** — GSAP-drawn ribbons weaving between panes; transmission material on glass (High tier only)
- [ ] **4.5 L3 Ground** — working miniature React UI on the kiosk screen; warm practical lights
- [x] **4.6 L4 Core** — packets travel the request path: in from the edge, into the API, on to the database, fading in and out at the ends rather than popping. Still one instanced draw call, its matrices updated in the layer's existing frame callback
- [x] **4.7 L5 Cloud** — the pipeline runs as the column rises: commit, build and test, container registry, deploy light in order, through per-instance colours on the indicator mesh (no extra draw call). Volumetric fog stays for the post-processing pass
- [ ] **4.8 Post-processing** — Bloom, selective DoF, vignette, subtle chromatic aberration; all tier-gated
- [ ] **4.9 Palette** *(needs D3)* — distinct lighting mood + colour grade per layer, coherent as one journey

**Done when:** each layer has exactly one effect you would screenshot. Resist adding a second.

---

## Phase 5 — Polish
*Goal: the details that get it nominated. Est. 3 days.*

- [ ] **5.1 Preloader** — `useProgress`-driven, shader-based, no fake progress bar; assets warmed before reveal
- [ ] **5.2 Custom cursor** — magnetic on interactive elements; disabled on touch
  - [ ] Magnetic pull from React Bits `Magnet` (no dependencies) on the hero and project buttons — see D11
- [ ] **5.3 Micro-interactions** — link hovers, button states, scroll hint, layer-entry text reveals
  - [ ] One-time decode of the hero role line (`SOFTWARE DEVELOPER · PUNE`) from React Bits `ScrambledText` or `DecryptedText` — see D11
  - [ ] Hero stats (13, 20+, 2, 100%) count up once when in view, modelled on React Bits `CountUp` but rewritten without `motion`
  - [ ] Subtle hover light on project cards or the portrait, from React Bits `SpotlightCard` or `GlareHover` (no dependencies)
  - [ ] Every copied component: keeps its MIT + Commons Clause notice and is listed in `LICENSE` as not covered by the repo's MIT licence; respects `prefers-reduced-motion`; keeps GSAP out of the entry bundle unless the budget impact is measured and accepted; passes `npm run verify`
- [ ] **5.4 Sound design** *(needs D4)* — ambient bed per layer + UI ticks via Howler.js; muted by default, persistent toggle, respects `prefers-reduced-motion`
- [ ] **5.5 Collectibles** — 5 hidden objects, one per layer; `useDiscoveryStore` persisted to `localStorage`; all five unlock the resume download with a small celebration
- [ ] **5.6 404 page** — themed, on-brand, with a route back
- [ ] **5.7 Easter egg** — Konami code or console art (optional, cheap, memorable)

---

## Phase 6 — Hardening
*Goal: it works for everyone, everywhere. Est. 2 days.*

- [ ] **6.1 Quality tiers** — `useDeviceTier` detection; High / Medium / Low; manual override in UI, persisted
- [ ] **6.2 Auto-downgrade** — `PerformanceMonitor` ladder: post-FX off → particles halved → shadows off → DPR 1
- [ ] **6.3 Static tier** — no-WebGL / reduced-motion / user-toggle path serves the Phase 1 build. Verified by disabling WebGL in the browser
- [ ] **6.4 Mobile pass** — real device testing on a low-end and a mid-tier Android; touch scroll feel; thermal check over 3 minutes
- [ ] **6.5 Accessibility audit** — axe clean; full keyboard traversal; `Esc` → plain-text view; contrast ≥ 4.5:1 everywhere; screen-reader read-through
- [ ] **6.6 Cross-browser** — Chrome, Firefox, Safari (macOS + iOS), Edge, Samsung Internet
- [ ] **6.7 Performance gate** — Lighthouse ≥ 85 desktop / ≥ 70 mobile; all §6 budgets verified in CI
- [ ] **6.8 Launch** — analytics (Plausible or GoatCounter), OG preview verified on LinkedIn + WhatsApp, custom domain if D6 says yes, resume + LinkedIn updated with the URL

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
| D3 | Colour direction | 4.9 | Open — default is to derive a palette per layer from the cinematic-serious direction (D1). Override any time. |
| D4 | Ambient sound, muted by default? | 5.4 | Open — defer to Phase 5. |
| D5 | Publish the phone number? | 1.1 | **DECIDED: no.** Email + contact form only. Number stays in the resume PDF. |
| D6 | Custom domain? | 6.8 | Open — defer to Phase 6; affects DNS only, not the build. |
| D7 | 3D asset source | 3.1–3.6 | **DECIDED: CC0 kits + procedural geometry.** Poly Haven / Quaternius assets plus code-generated shapes. No Blender modelling required; bakes come from the kits or are faked with baked-look materials. |
| D8 | Collectibles: five or six? | 5.5 | Open — the plan says "five hidden objects, one per layer", but there are six layers. Either one per layer (six) or skip one layer (five; L0 is the natural candidate, since it is the hero). Defer to Phase 5. |
| D9 | Environment lighting within 200 KB | 3.1–3.6 | **DECIDED 2026-09-17: (a) procedural light panels** rendered into a 64 px environment map — 0 KB, art-directable per layer. A 1k Poly Haven HDRI measured 1.3–1.6 MB, and one per layer would have been ~9 MB. |
| D10 | How the 3D journey lines up with the page | 2.6, 3.2–3.6 | **DECIDED 2026-09-17: follow the page order.** Each layer arrives with its article; layer order is Orbit, Device (TRUUNA), Surface (aashman.in), Ground (DMS + Urja), Core (About/Skills), Cloud (Experience). The page is unchanged; the descent no longer ends at hardware. |
| D11 | Third-party component libraries | 5.2, 5.3 | **DECIDED 2026-09-17: React Bits, selectively; Aceternity UI, no.** React Bits matches the stack (React 19, Tailwind v4, TS) and its licence (MIT + Commons Clause) allows use inside the site; take only `Magnet`, `ScrambledText`/`DecryptedText`, a `CountUp`-style counter and `SpotlightCard`/`GlareHover`. Rejected: all React Bits backgrounds (each opens a second WebGL context via `ogl`, breaking the one-canvas rule) and cursor gimmicks. Aceternity rejected: its signature effects are the generic glow-and-gradient look D1 avoids, Globe and Macbook Scroll duplicate L0 and L1, it assumes Next.js, and its licence forbids redistributing source files, which a public repo arguably does. |
| D12 | 3D on phones | 3.8, 6.1 | Open. Every layer after the hero is desktop-only (stages need ≥ 1024 px), so a phone downloads three.js (227 KB gzip) and starts a GPU context to draw only the hero's starfield — below the hero it draws nothing. Options: **(a)** treat phones as the Static tier — no three.js, no GPU work, the page they already see (recommended); **(b)** keep the starfield on phones and accept the cost; **(c)** design phone versions of the layers in Phase 6 tiers. |

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
