# Shridhan Vidhate — 3D Portfolio: Technical Architecture

> Status: design document (v1). No code written yet.
> Target host: GitHub Pages (static, no server runtime).

---

## 1. Benchmark Research

These are the sites the design targets in quality. They were reviewed for what actually earns the awards.

| Site | Technique worth stealing |
|---|---|
| [Bruno Simon](https://bruno-simon.com) | Physics-driven interaction as the navigation itself |
| [Sébastien Lempens](https://sebastien-lempens.com) | Scroll-driven camera tour with shifting camera language (first-person, chase, aerial) |
| [Bilal El Moussaoui](https://bilal.show) | Scroll as a narrative engine: character moves through a diorama world |
| [Aimee Weis](https://aimees-papercraft-world.com) | React Three Fiber + Blender + 2D illustrated textures on 3D geometry; open-sourced |
| [Thibault Introvigne](https://thibault-introvigne.com) | R3F sci-fi scene with hidden collectibles rewarding exploration |
| [Jordan Breton](https://jordan-breton.com) | Dense natural detail (grass, water, particles) on a floating island |
| [Cartier Watches & Wonders](https://www.awwwards.com/websites/three-js/) | Discrete 3D "alcoves" entered and exited by scroll, baked lighting, Lenis |
| [Shopify Editions](https://www.shopify.com/editions) | Particle-dispersing typography, each section staged as a narrative beat |

**The consistent finding across all of them:** the winners are not the ones with the most polygons. They are the ones with a single clear idea, a scroll that means something, and a byte budget. Instancing, baked lighting, deferred 3D bundles, and HTML-first rendering are what separate an award site from a demo.

---

## 2. The Concept: "The Stack"

A generic 3D portfolio is a rotating laptop model. That is not a differentiator in 2026.

The concept here comes directly from the resume: the work spans **mobile → web → backend → cloud → physical hardware**. That is a literal stack, and a stack is a vertical space. So the site is a single continuous **descent through five floating layers**, one per domain, and the camera flies the visitor down a curved path through them.

```
     ▲  scroll up = ascend
  ┌─────────────────────────────────────┐
  │  L0  ORBIT      hero / name / intro │
  ├─────────────────────────────────────┤
  │  L1  DEVICE     TRUUNA · Flutter    │  phone slab, UI screens on planes
  ├─────────────────────────────────────┤
  │  L2  SURFACE    aashman.in · React  │  glass panes, GSAP ribbons
  ├─────────────────────────────────────┤
  │  L3  CORE       FastAPI · Postgres  │  data pipes, packet particles
  ├─────────────────────────────────────┤
  │  L4  CLOUD      Azure · CI/CD       │  volumetric container nodes
  ├─────────────────────────────────────┤
  │  L5  GROUND     Raspberry Pi · DMS  │  physical kiosk diorama, warm light
  └─────────────────────────────────────┘
     ▼  scroll down = descend
```

Each layer is a discrete "alcove" (the Cartier pattern) with its own lighting mood, palette, and one signature effect. The visitor never loses the sense of a single continuous space — the camera path is one unbroken curve.

**Why this concept wins:** it is not decoration. The 3D *is* the information architecture. A recruiter scrolling it learns the range of the work without reading a word.

**Secondary hook (the "collectible"):** five hidden interactive objects, one per layer (a scannable QR on the Pi, a running `git log` terminal in L4, etc.). Finding all five unlocks a resume download. Rewards exploration the way Introvigne's spaceman does, at near-zero build cost.

---

## 3. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Build | **Vite 8** + TypeScript 6 | Fastest HMR for shader iteration; trivial static output for Pages. (Landed as 8.x — create-vite's current default — rather than the 6.x this document first assumed.) |
| UI | **React 19** | Component model for DOM overlay; matches existing React 18 experience |
| 3D | **three.js** (latest r1xx) | Industry standard; WebGPU path available later |
| 3D binding | **@react-three/fiber v9** | Declarative scene graph, no imperative render loop to maintain |
| 3D helpers | **@react-three/drei** | Environment, useGLTF, Instances, Html, PerformanceMonitor, KTX2 loader |
| Post FX | **@react-three/postprocessing** | Bloom, selective DoF, vignette — the "expensive" look |
| Motion | **GSAP 3 + ScrollTrigger** | Scroll timeline authority; already known from aashman.in |
| Scroll | **Lenis** | Smooth inertial scroll; every benchmark site uses it |
| State | **Zustand** | Tiny; shares scroll progress and quality tier between R3F and DOM without prop drilling |
| Styling | **Tailwind CSS v4** | DOM overlay only; the 3D layer is not styled by CSS |
| Linting | **oxlint** | create-vite's current default; ~50× faster than ESLint and adequate for this codebase |
| Shaders | Raw GLSL via `glslify`-free inline strings | No extra toolchain; Vite handles `?raw` imports |
| Models | **CC0 kits** (Poly Haven, Quaternius, Kenney) + **procedural geometry in code** | Decision D7 — no Blender modelling skill required. Blender used only for placement, scale fixes and export |
| Compression | **gltf-transform** (Draco + Meshopt), **KTX2/Basis** textures | 5–10× asset size reduction |
| Forms | **Web3Forms** or **Formspree** | GitHub Pages has no server; PHP contact API from aashman.in cannot be reused |
| Analytics | **Plausible** or GoatCounter | Privacy-safe, tiny script |
| CI/CD | **GitHub Actions → GitHub Pages** | Mirrors the Azure CI/CD experience already on the resume |

### Explicitly rejected

- **Next.js** — SSR/ISR buys nothing on a static Pages host and adds weight.
- **R3F `<ScrollControls>`** — convenient but takes ownership of the scroll container, which fights Lenis and makes DOM-side ScrollTrigger pinning awkward. GSAP ScrollTrigger drives everything instead.
- **WebGPU as primary renderer** — real 2026 trend (Samsy, Ameen Abdullah) but the fallback path doubles the shader work. Keep WebGL2 as primary, leave a WebGPU upgrade as a post-launch phase.

---

## 4. Rendering Architecture

### 4.1 One canvas, many scenes

There is exactly **one `<Canvas>`**, fixed at `position: fixed; inset: 0; z-index: 0`, mounted for the life of the page. DOM content scrolls above it at `z-index: 10` with `pointer-events: none` except on real interactive elements.

Remounting a canvas per section is the single most common cause of jank in amateur 3D portfolios. It is never done here.

```
<App>
├── <Lenis>                          smooth scroll provider
├── <ScrollProvider>                 Zustand store: progress 0..1, active layer, quality tier
├── <Canvas>                         fixed, full viewport, single WebGL context
│   ├── <CameraRig>                  reads progress → position on CatmullRomCurve3
│   ├── <Environment />              baked HDRI (compressed, <200 KB)
│   ├── <Suspense>
│   │   ├── <LayerOrbit />           L0
│   │   ├── <LayerDevice />          L1   each layer: frustum-culled + visibility-gated
│   │   ├── <LayerSurface />         L2
│   │   ├── <LayerCore />            L3
│   │   ├── <LayerCloud />           L4
│   │   └── <LayerGround />          L5
│   ├── <ParticleField />            persistent, morphs per layer
│   ├── <Effects />                  post-processing, tier-gated
│   └── <PerformanceMonitor />       auto-downgrade on sustained FPS drop
└── <DomOverlay>                     scrolling HTML: headings, copy, project cards, contact
```

### 4.2 Scroll → camera mapping

The camera is not animated per section. It rides a single spline.

1. A `CatmullRomCurve3` is authored in Blender as an empty-path, exported as points.
2. `ScrollTrigger` on the document body produces `progress: 0 → 1`.
3. Lenis smooths the raw scroll; the progress value is additionally damped (`MathUtils.damp`) so a mouse-wheel notch never snaps the camera.
4. `camera.position = curve.getPointAt(progress)`; `camera.lookAt(curve.getPointAt(progress + 0.01))` for tangent-following, overridden by per-layer look targets where a section needs to face a specific object.
5. Camera **language** changes per layer (the Lempens lesson): wide orbit at L0, tight dolly at L1, lateral truck at L2, forward push at L3, slow crane at L4, grounded eye-level at L5.

`scrub: 1` on ScrollTrigger, never `scrub: true` — the one-second catch-up is what makes it feel cinematic rather than mechanical.

### 4.3 Layer visibility gating

Each layer subscribes to progress and sets `visible = false` plus skips its own `useFrame` work when the camera is more than one layer away. This keeps draw calls roughly constant regardless of total scene complexity.

### 4.4 Signature effect per layer

Each layer gets **one** memorable effect. Not five. Restraint is the Oryzo lesson.

| Layer | Signature effect |
|---|---|
| L0 Orbit | Instanced starfield + a slowly rotating monolith with a custom fresnel/iridescence shader; name text disperses into particles on scroll-out |
| L1 Device | Phone slab with real TRUUNA screenshots on planes; screens flip through the app flow as scroll progresses; soft screen-glow light source |
| L2 Surface | Layered glass panes (transmission material) holding aashman.in screenshots; GSAP-drawn ribbon curves weaving between them |
| L3 Core | GPU-instanced "packets" flowing along tube geometry between a FastAPI node and a Postgres node; count scales with quality tier |
| L4 Cloud | Wireframe container cubes rising through volumetric fog; a CI/CD pipeline lights up green stage by stage on scroll |
| L5 Ground | Warm-lit low-poly dairy-kiosk diorama with a Raspberry Pi board; the kiosk screen is a live `<Html transform>` running a miniature real React UI |

The L5 `<Html transform>` trick — a genuinely working mini-app rendered inside the 3D scene — is the kind of detail that gets an Awwwards nomination, and it costs almost nothing because that UI already exists in the Urja Dairy Tour project.

### 4.5 Particle system

A single persistent `Points` buffer (recommended: 60k desktop / 20k mobile) whose target positions are swapped per layer and interpolated on the GPU in the vertex shader. This is the Shopify Editions pattern. One draw call, one buffer allocation, infinite visual variety.

Positions per layer are precomputed at build time from sampled mesh surfaces and shipped as a compressed `Float32Array`.

---

## 5. Project Structure

```
shridhan_web/
├── .github/workflows/deploy.yml
├── assets-source/         raw originals — NEVER inside public/, or the
│   └── img/               unprocessed multi-MB files get published as-is
├── public/                everything here ships to the live site verbatim
│   ├── models/            *.glb  (Draco + Meshopt compressed)
│   ├── textures/          *.ktx2 (Basis compressed)
│   ├── env/               *.hdr  (or baked to .ktx2 env map)
│   ├── img/               processed screenshots (AVIF + WebP fallback)
│   ├── data/              particle position buffers (.bin)
│   └── resume.pdf
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── canvas/
│   │   ├── Scene.tsx
│   │   ├── CameraRig.tsx
│   │   ├── Effects.tsx
│   │   ├── layers/        L0Orbit … L5Ground
│   │   ├── shared/        ParticleField, Instances, ScreenPlane
│   │   └── shaders/       *.vert / *.frag
│   ├── dom/
│   │   ├── sections/      Hero, About, Project×4, Skills, Experience, Contact
│   │   ├── ui/            Nav, Cursor, Preloader, ScrollHint, SoundToggle
│   │   └── fallback/      StaticPortfolio.tsx   ← full no-WebGL experience
│   ├── store/             useScrollStore, useQualityStore, useDiscoveryStore
│   ├── hooks/             useLenis, useScrollProgress, useDeviceTier
│   ├── data/              projects.ts, experience.ts, skills.ts   ← content lives here, not in JSX
│   └── styles/
├── scripts/
│   ├── compress-models.mjs      gltf-transform pipeline
│   └── bake-particles.mjs       mesh surface → Float32Array
└── vite.config.ts
```

**Content in `src/data/*.ts`, never hardcoded in components.** Resume changes then become one-line edits.

---

## 6. Performance Budget

Non-negotiable. Every award-winning site in the research passes Core Web Vitals; a 40 MB portfolio that drops frames is worse than no 3D at all.

| Metric | Budget |
|---|---|
| Initial JS (gzip, before 3D chunk) | ≤ 180 KB |
| 3D chunk (lazy, after first paint) | ≤ 600 KB gzip |
| Total model payload | ≤ 3.5 MB |
| Largest single texture | 1024², KTX2 |
| Time to first meaningful paint | < 1.5 s on 4G |
| Time to interactive 3D | < 4 s on 4G |
| Desktop FPS | 60 sustained |
| Mid-tier mobile FPS | ≥ 30 sustained |
| Draw calls per frame | ≤ 120 |
| Lighthouse Performance | ≥ 85 desktop, ≥ 70 mobile |

### Techniques applied

- **Instancing** for every repeated object (containers, packets, stars, grass).
- **Baked lighting** into textures in Blender; at most 2 real-time lights per layer.
- **Draco + Meshopt** on all geometry; **KTX2/Basis** on all textures (GPU-native, no decode stall).
- **Deferred 3D bundle** — HTML and hero copy render first, `Canvas` lazy-imported behind `React.lazy`.
- **Visibility gating** per layer (§4.3).
- **`PerformanceMonitor`** auto-downgrades: post-FX off → particle count halved → shadow maps off → DPR clamped to 1.
- **DPR clamp** `[1, 2]` always; never `window.devicePixelRatio` unclamped on retina.
- **Frustum culling** on by default; manual bounding spheres set on instanced meshes.

---

## 7. Quality Tiers & Fallbacks

Detected once at boot, overridable by a UI toggle.

| Tier | Trigger | What runs |
|---|---|---|
| **High** | Desktop, WebGL2, ≥ 8 GB RAM proxy, no `prefers-reduced-motion` | Everything: 60k particles, full post-FX, soft shadows, transmission material |
| **Medium** | Mid-tier laptop / high-end mobile | 25k particles, bloom only, no transmission, hard shadows |
| **Low** | Low-end mobile, `PerformanceMonitor` downgrade | 8k particles, no post-FX, no shadows, simplified materials |
| **Static** | No WebGL, `prefers-reduced-motion: reduce`, or a saved user preference | `StaticPortfolio.tsx` — a genuinely good 2D portfolio with AVIF images and CSS transitions. Not a "your browser is unsupported" page. |

The Static tier is a real deliverable, not an afterthought. It is also what search engines and link-preview crawlers see, so all copy lives in real semantic HTML in both tiers.

### Accessibility

- All content readable in the DOM overlay; the 3D is enhancement, never the sole carrier of information.
- Full keyboard navigation: `Tab` through sections, `↑/↓`/`PageUp`/`PageDown` drive scroll, `Esc` jumps to a plain-text view.
- `prefers-reduced-motion` respected at every level — Lenis disabled, GSAP `duration: 0`, camera cuts instead of glides.
- Contrast ≥ 4.5:1 on all overlay text; text sits on scrims, never directly on a busy 3D background. Against the `--color-void` ground this rules out `mist` below 80% opacity — measured 2.97:1 at `/60` and 2.39:1 at `/50`, so the palette's dim tints stop at `/80` (4.52:1).
- ARIA landmarks; canvas is `aria-hidden="true"`.

---

## 8. Asset Pipeline

Per decision **D7**, geometry is sourced rather than modelled. Blender is used only as an assembly and export step, which needs no modelling skill.

```
Source geometry
  ├─ CC0 kits    Poly Haven (props, HDRIs), Quaternius (low-poly kits), Kenney (UI/props)
  └─ Procedural  generated in code — tubes, panes, containers, starfield, particle targets
      └─ Blender 4.x  (assembly only: place, scale, apply transforms, join, export)
          └─ export glTF 2.0 (.glb), Y-up
              └─ npm run compress-models
                  gltf-transform: dedup → prune → weld → simplify(0.75)
                                → draco → resize(1024) → ktx2(etc1s|uastc)
                  └─ public/models/*.glb    ← target ≤ 500 KB per layer
```

Roughly half the scene never touches Blender at all. Tubes (L3), glass panes (L2), containers (L4), the starfield (L0) and every particle target are generated from `three` primitives at runtime or baked to a buffer at build time — cheaper, smaller, and fully parametric.

**Lighting:** real baked lightmaps require Blender skill, so instead each layer uses a single low-cost HDRI environment plus two real-time lights, with ambient occlusion faked in the material. Visually close to baked at this scene complexity, at a fraction of the authoring effort.

**Licensing:** every CC0 source must be recorded in `public/models/CREDITS.md` with its URL, even where the licence does not require attribution.

Screenshots: source PNG → `sharp` → AVIF (primary) + WebP (fallback) at 2 sizes each.

HDRI: single 1k studio HDRI from Poly Haven → `RGBM`/KTX2 env map, ≤ 200 KB.

## 9. Deployment

**Repo:** `Shridhan29/Shridhan29.github.io` (user site — serves at the root path, so `base: '/'` in Vite and no path rewriting anywhere). A project repo would force `base: '/repo-name/'` and break every absolute asset path in the 3D loaders; the user-site repo avoids that class of bug entirely.

```yaml
# .github/workflows/deploy.yml  (outline)
on: { push: { branches: [main] } }
permissions: { contents: read, pages: write, id-token: write }
jobs:
  build:
    - actions/checkout
    - actions/setup-node (node 22, npm cache)
    - npm ci
    - npm run typecheck && npm run lint
    - npm run build           # includes model compression check
    - actions/upload-pages-artifact  path: dist
  deploy:
    - actions/deploy-pages
```

Custom domain optional later via `public/CNAME` + DNS `A`/`CNAME` records. GitHub Pages provisions HTTPS automatically.

**Note:** Git LFS is not needed if the compression budget in §6 is respected. If any single `.glb` exceeds 50 MB, the budget was violated, not the storage.

---

## 10. Build Phases

| Phase | Deliverable | Est. |
|---|---|---|
| **0 — Foundation** | Vite + React + TS + R3F scaffold, Lenis, GSAP, empty canvas, CI/CD green, live on Pages | 1 day |
| **1 — Skeleton** | All DOM sections with real resume content, Static tier complete and shippable on its own | 2 days |
| **2 — Camera** | Spline path, scroll→camera mapping, placeholder boxes per layer, camera language per layer | 2 days |
| **3 — Layers** | L0–L5 modelled, textured, baked, compressed, placed | 5–7 days |
| **4 — Signature FX** | One effect per layer (§4.4), particle morph system, post-processing | 4 days |
| **5 — Polish** | Preloader, custom cursor, sound design, micro-interactions, the 5 collectibles | 3 days |
| **6 — Hardening** | Quality tiers, mobile pass, a11y pass, Lighthouse, cross-browser, meta/OG tags | 2 days |

**Phase 1 ships a working portfolio.** Every phase after that is upside, and the site is never in a broken state. This matters — a half-finished 3D portfolio that is live and static beats a spectacular one that is never deployed.

---

## 11. Assets, Blockers & Decisions

Moved to **`IMPLEMENTATION_TRACKER.md`** — see the *Assets Register* and *Open Decisions* tables there, which are kept current as items arrive.

Confirmed as of 2026-09-07: GitHub, LinkedIn, Play Store and company-site URLs; resume PDF; contact email; and that `Shridhan29.github.io` is available (the domain returns 404 and the account has no public repos).
