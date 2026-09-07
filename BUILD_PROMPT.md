# High-Level Build Prompt

A single self-contained brief. Hand this to any capable coding agent (or use it as the north star for your own build) and it should be able to start without further context. Companion document: `ARCHITECTURE.md`.

---

## The Prompt

> Build a scroll-driven 3D personal portfolio website for **Shridhan Satish Vidhate**, a software developer in Pune with 2+ years at Aashman Technicals shipping production systems across Flutter mobile, React web, Python/FastAPI backends, Azure cloud, and Raspberry Pi hardware. The site is a static build deployed to GitHub Pages at `Shridhan29.github.io`. It must look like an Awwwards Site of the Day, and it must load in under four seconds on 4G. Tone is **cinematic-serious** — dark, restrained, moody lighting that reads as a senior engineer, not a toy. The primary audience is **Indian product companies**, written so it does not block remote roles: lead with shipped outcomes, keep the LinkedIn CTA level with the resume download, and include one "open to remote" line. **Do not publish his phone number** anywhere on the site; email and contact form only.
>
> **The concept is "The Stack."** The site is one continuous vertical descent through six floating layers, each one a domain of his work. The camera rides a single spline downward as the visitor scrolls: **L0 Orbit** (hero, name, a rotating iridescent monolith in a starfield) → **L1 Device** (TRUUNA, the live Play Store Flutter app — a phone slab whose screens advance through the real app flow) → **L2 Surface** (aashman.in, the React corporate site — layered glass panes with GSAP ribbons weaving between them) → **L3 Core** (FastAPI + PostgreSQL — instanced data packets flowing along tubes between service nodes) → **L4 Cloud** (Azure + GitHub Actions — wireframe containers rising through volumetric fog while a CI/CD pipeline lights up stage by stage) → **L5 Ground** (Raspberry Pi dairy POS and kiosk — a warm-lit low-poly diorama whose kiosk screen renders a real, working miniature React UI via `<Html transform>`). The 3D is not decoration; it *is* the information architecture, and a recruiter should understand the range of the work before reading a word.
>
> **Stack:** Vite 6 + React 19 + TypeScript, three.js with @react-three/fiber v9, @react-three/drei, @react-three/postprocessing, GSAP 3 + ScrollTrigger for the scroll timeline, Lenis for smooth scroll, Zustand for shared state, Tailwind v4 for the DOM overlay only. Geometry comes from CC0 kits (Poly Haven, Quaternius, Kenney) plus procedural shapes generated in code — no from-scratch modelling; Blender is an assembly-and-export step only. Everything is compressed with gltf-transform (Draco + Meshopt) and KTX2/Basis textures. Contact form posts to Web3Forms — there is no server. Deploy via GitHub Actions to Pages.
>
> **Architecture rules, non-negotiable.** Exactly one `<Canvas>`, fixed and full-viewport, mounted for the life of the page — never remount per section. Scrolling HTML sits above it and carries every word of content in real semantic markup. ScrollTrigger produces a single `progress: 0→1` that drives `camera.position` along a `CatmullRomCurve3`, damped so no wheel notch snaps the camera; use `scrub: 1`, never `scrub: true`. Camera *language* changes per layer — wide orbit, tight dolly, lateral truck, forward push, slow crane, grounded eye-level — so the descent feels authored rather than mechanical. Layers more than one step from the camera set `visible = false` and skip their `useFrame` work. Give each layer exactly **one** signature effect; restraint is what separates the award sites from the demos. Use a single persistent 60k-point particle buffer whose targets morph per layer in the vertex shader — one draw call, infinite variety.
>
> **Budgets, enforced.** ≤ 180 KB initial JS gzip with the 3D chunk lazy-loaded behind `React.lazy` after first paint; ≤ 600 KB for that chunk; ≤ 3.5 MB total models; ≤ 120 draw calls; 60 fps desktop, ≥ 30 fps mid-tier mobile; Lighthouse ≥ 85 desktop. Skip real baked lightmaps: use one low-cost HDRI environment per layer plus at most two real-time lights, with ambient occlusion faked in the material. Instance everything repeated. Clamp DPR to `[1, 2]`. Wire drei's `PerformanceMonitor` to auto-downgrade in order: post-FX off → particles halved → shadows off → DPR to 1.
>
> **Four quality tiers**: High, Medium, Low, and **Static**. The Static tier — served on no-WebGL, on `prefers-reduced-motion: reduce`, or by user toggle — is a genuinely well-designed 2D portfolio with AVIF imagery and CSS transitions, *not* an unsupported-browser notice. Build it first, because it must be shippable on its own. Everything must be keyboard-navigable, contrast must clear 4.5:1 with text on scrims rather than bare 3D, and the canvas is `aria-hidden`.
>
> **Build in phases, live from day one.** Phase 0: scaffold, CI/CD green, deployed. Phase 1: all DOM sections with real resume content — a complete, shippable static portfolio. Phase 2: spline, scroll→camera mapping, placeholder geometry. Phase 3: model, texture, bake, compress, and place L0–L5. Phase 4: the signature effect per layer, the particle morph system, post-processing. Phase 5: preloader, custom cursor, sound design, and five hidden collectibles — one per layer — that unlock a resume download when all are found. Phase 6: quality tiers, mobile pass, a11y pass, Lighthouse, cross-browser, OG tags. The site is never in a broken state at a phase boundary.
>
> **Content lives in `src/data/*.ts`**, never hardcoded in JSX, so a resume change is a one-line edit. Source the copy from the resume: the TRUUNA app (13 production releases, 8 delivery phases, 20+ REST endpoints, Firebase Phone Auth, FCM, server-generated PDF quotes, Azure App Service via Container Registry, target API 36, FLAG_SECURE, PII-safe logging), the aashman.in site (9-route React 18 SPA, 17 components, hand-written CSS3 design system, GSAP and Framer Motion, PHP contact API with reCAPTCHA v2 and per-IP rate limiting, Apache shared hosting under no-Node/no-SMTP constraints), the DMS dairy POS (local-first offline Raspberry Pi, SQLite, PDF invoicing, RFID check-in microservices, Chart.js dashboards), and Urja Dairy Tour (trilingual React kiosk, Howler.js audio-guided tours). Lead with the fact that ships: **a Flutter app live on Google Play, backed by a FastAPI service on Azure with CI/CD, plus hardware running in the field.**

---

## Compressed variant

For a tighter context window:

> Scroll-driven 3D portfolio for Shridhan Vidhate (Flutter/FastAPI/React/Azure/Raspberry Pi dev, Pune). Vite + React 19 + TS + R3F + drei + postprocessing + GSAP ScrollTrigger + Lenis + Zustand + Tailwind, static to GitHub Pages. Concept: one continuous camera descent along a spline through six layers — Orbit (hero) → Device (TRUUNA Play Store app) → Surface (aashman.in) → Core (FastAPI/Postgres) → Cloud (Azure CI/CD) → Ground (Raspberry Pi kiosk diorama). One persistent Canvas, never remounted; DOM overlay carries all copy semantically; ScrollTrigger progress drives camera on a CatmullRomCurve3 with `scrub: 1`; one signature effect per layer; a single 60k particle buffer morphing per layer. Budgets: 180 KB initial JS, 600 KB lazy 3D chunk, 3.5 MB models, 60 fps desktop / 30 mobile, Lighthouse 85+. Four tiers ending in a fully-designed no-WebGL Static fallback that ships first. Phase 1 is a complete static portfolio; every later phase is upside.

---

## Guard rails for whoever builds it

Things that will quietly wreck this build:

- Remounting the canvas per route or section. Never do it.
- Unclamped `devicePixelRatio` on a retina display — instant 4× fill cost.
- Uncompressed `.glb` files. A 40 MB portfolio fails regardless of how good it looks.
- Real-time shadows on every layer. Bake them.
- Text rendered inside the 3D scene as the *only* copy — kills SEO and accessibility both.
- Starting with Phase 3. Build the static portfolio first; it is the thing that actually gets you hired if the 3D work stalls.
