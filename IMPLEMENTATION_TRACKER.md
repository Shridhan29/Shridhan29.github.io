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

- [ ] **0.1 Repo**
  - [x] Create `Shridhan29.github.io` on GitHub (public)
  - [x] `origin` repointed and `main` pushed. Old private `shridhan_web` remote kept as `private`
  - [x] Add `.gitignore` (node_modules, dist, .env, .DS_Store, Blender `.blend1`)
  - [x] Add `LICENSE` (MIT) and rewrite `README.md`
- [ ] **0.2 Toolchain**
  - [x] Scaffolded — Vite 8.2, React 19.2, TypeScript 6.0
  - [x] `.nvmrc` 22; `engines` `^20.19.0 || >=22.12.0` (local Node is 20.20.2, which Vite 8 supports)
  - [x] **oxlint** (create-vite's default now, and far faster than ESLint) + Prettier; `lint`, `typecheck`, `format` scripts
  - [x] Tailwind v4 via `@tailwindcss/vite`; palette tokens in `src/styles/index.css`
  - [x] `vite.config.ts` with `base: '/'`, `@` alias, and manual chunks isolating three/R3F
- [ ] **0.3 3D dependencies**
  - [x] `three` 0.181, `@react-three/fiber` 9.7, `drei` 10.7, `postprocessing` 3.1
  - [x] `gsap` 3.15, `lenis` 1.3, `zustand` 5.0
  - [x] Cube renders; kept as the Phase 0 placeholder page, removed in Phase 1
- [ ] **0.4 CI/CD**
  - [x] `.github/workflows/deploy.yml` written — lint, typecheck, build, budget check, deploy
  - [x] Pages switched from `legacy` (branch-serving) to `workflow` build type via the API
  - [x] **Live at https://shridhan29.github.io** — HTTP 200, hashed assets served, full pipeline green
- [ ] **0.5 Bundle guardrail**
  - [x] `rollup-plugin-visualizer` wired to `npm run analyze`
  - [x] `scripts/check-budget.mjs` fails the build above the §6 gzip budgets; wired into `npm run build`. Current: entry 61.2/180 KB, three 225.5/600 KB

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

## Phase 2 — Camera System
*Goal: the scroll-to-camera engine working against placeholder geometry. Est. 2 days.*

- [ ] **2.1 Scroll infrastructure**
  - [ ] `useLenis` hook; Lenis ↔ ScrollTrigger `scrollerProxy` wired
  - [ ] `useScrollStore` (Zustand): `progress`, `activeLayer`, `direction`
  - [ ] `prefers-reduced-motion` disables Lenis entirely
- [ ] **2.2 Canvas shell**
  - [ ] Single `<Canvas>`, `position: fixed`, `inset: 0`, `z-index: 0`, DPR clamped `[1, 2]`
  - [ ] DOM overlay above at `z-index: 10`, `pointer-events: none` except on controls
  - [ ] Canvas lazy-loaded via `React.lazy` after first paint
  - [ ] `aria-hidden="true"` on the canvas
- [ ] **2.3 Camera rig**
  - [ ] `CatmullRomCurve3` path with 6 authored control regions
  - [ ] `progress` → `curve.getPointAt()`, damped with `MathUtils.damp`
  - [ ] Tangent look-at with per-layer look-target overrides
  - [ ] `ScrollTrigger` with `scrub: 1` (never `true`)
- [ ] **2.4 Camera language per layer**
  - [ ] L0 wide orbit · L1 tight dolly · L2 lateral truck · L3 forward push · L4 slow crane · L5 grounded eye-level
- [ ] **2.5 Dev tooling**
  - [ ] Leva panel (dev-only, tree-shaken from prod) for curve points, FOV, damping
  - [ ] `?debug=1` overlay: FPS, draw calls, triangles, progress, active layer
  - [ ] Six labelled placeholder boxes standing in for the layers
- [ ] **2.6 Section sync**
  - [ ] DOM sections fade/translate in as their layer becomes active
  - [ ] Nav dots jump the scroll to any layer

**Done when:** scrolling flies the camera smoothly through six boxes and the DOM keeps pace.

---

## Phase 3 — The Six Layers
*Goal: real geometry, textured, baked, compressed, placed. Est. 5–7 days. Blocked by B2.*

- [ ] **3.0 Asset pipeline**
  - [ ] `scripts/compress-models.mjs` — gltf-transform: dedup → prune → weld → simplify → draco → resize 1024 → ktx2
  - [ ] `scripts/process-images.mjs` — sharp → AVIF + WebP
  - [ ] KTX2 + Draco loaders registered in a shared `useGLTF` config
  - [ ] Per-model size assertion in CI (≤ 500 KB each, ≤ 3.5 MB total)
- [ ] **3.1 L0 Orbit** — monolith mesh, instanced starfield, HDRI environment (≤ 200 KB)
- [ ] **3.2 L1 Device** — phone slab, screen planes, TRUUNA screenshots as textures, screen-glow light
- [ ] **3.3 L2 Surface** — layered glass panes, aashman.in captures, ribbon curve geometry
- [ ] **3.4 L3 Core** — service nodes, tube geometry between them, instanced packet mesh
- [ ] **3.5 L4 Cloud** — instanced wireframe containers, fog volume, CI/CD pipeline stage markers
- [ ] **3.6 L5 Ground** — low-poly dairy kiosk + Raspberry Pi board, warm bake, `<Html transform>` mini React UI on the kiosk screen
- [ ] **3.7 Visibility gating** — layers ≥ 2 steps from the camera set `visible = false` and skip `useFrame`
- [ ] **3.8 Perf checkpoint** — ≤ 120 draw calls, 60 fps desktop, first mobile profile run

**Done when:** all six layers render in place, budgets hold, no effects yet.

---

## Phase 4 — Signature Effects
*Goal: the "insane" pass. One memorable effect per layer, and nothing more. Est. 4 days.*

- [ ] **4.1 Particle system** — single persistent `Points` buffer, per-layer target positions baked by `scripts/bake-particles.mjs`, morph interpolated in the vertex shader
- [ ] **4.2 L0** — fresnel/iridescence shader on the monolith; name text disperses into particles on scroll-out
- [ ] **4.3 L1** — screens advance through the real app flow as `progress` moves; glow spill onto the slab
- [ ] **4.4 L2** — GSAP-drawn ribbons weaving between panes; transmission material on glass (High tier only)
- [ ] **4.5 L3** — instanced packets flowing along tubes, count scaled by quality tier
- [ ] **4.6 L4** — volumetric fog; pipeline stages light green sequentially with scroll
- [ ] **4.7 L5** — working miniature React UI on the kiosk screen; warm practical lights
- [ ] **4.8 Post-processing** — Bloom, selective DoF, vignette, subtle chromatic aberration; all tier-gated
- [ ] **4.9 Palette** *(needs D3)* — distinct lighting mood + colour grade per layer, coherent as one journey

**Done when:** each layer has exactly one effect you would screenshot. Resist adding a second.

---

## Phase 5 — Polish
*Goal: the details that get it nominated. Est. 3 days.*

- [ ] **5.1 Preloader** — `useProgress`-driven, shader-based, no fake progress bar; assets warmed before reveal
- [ ] **5.2 Custom cursor** — magnetic on interactive elements; disabled on touch
- [ ] **5.3 Micro-interactions** — link hovers, button states, scroll hint, layer-entry text reveals
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
| A1 | Professional photo | 1.4 | **received** — `public/img/source/shridhanImage.jpeg`, 1000×1500 RGB. Needs background replacement and a head-and-shoulders crop in Phase 1.4 |
| A2 | Resume PDF | 1.5 | received — copy to `public/resume.pdf` |
| A3 | TRUUNA screenshots | 3.2 | **received ×5** — language, OTP login, configurator, booking summary, order timeline |
| A4 | aashman.in captures | 3.3 | **received ×8** |
| A5 | DMS POS screenshots | 3.6 | **received ×4** |
| A6 | Urja Dairy Tour screenshots | 3.6 | **received ×5** |
| A7 | Raspberry Pi kiosk photos ×2–3 | 3.6 | **CUT — none available.** L5 rescoped to pure geometry; see Appendix A revision |
| A8 | Aashman Technicals logo (SVG) | 3.3 | pending, optional |
| A9 | TRUUNA screen recording | 4.3 | pending, optional |
| A10 | Web3Forms access key | 1.6 | **received** — in `.env`. See Appendix B |

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

---

## Appendix A — Screenshot Brief (B2)

Exact shots wanted, derived from what each project actually does. Drop everything into `public/img/source/<project>/` with the filenames given; the build pipeline converts to AVIF + WebP at two sizes.

**Universal rules**
- PNG, no compression, native resolution. Never a photo of a screen, never a crop from WhatsApp.
- **Test/demo data only.** No real customer names, phone numbers, addresses, order values, or staff records. If real data cannot be avoided, say so and it gets blurred in post.
- Consistent state: same demo account, same theme, same language across a project's set.
- Full window, no cursor, no browser dev tools, no OS notification bars where avoidable.

### A3 — TRUUNA (Flutter, live on Play Store) → `public/img/source/truuna/`

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

### A4 — aashman.in (React 18 SPA) → `public/img/source/aashman/`

| # | Filename | Shot |
|---|---|---|
| 1 | `01-home-desktop.png` | Home route, **full-page** capture, 1440 px wide |
| 2 | `02-services-desktop.png` | Services or products route, full-page, 1440 px |
| 3 | `03-gallery-lightbox.png` | Media lightbox **open**, mid-zoom — the pinch-zoom feature is on the resume, so show it |
| 4 | `04-contact-desktop.png` | Contact route with the reCAPTCHA v2 widget visible — shows the secure PHP API front-end |
| 5 | `05-home-mobile.png` | Home, 390 px wide, full-page |
| 6 | `06-nav-mobile.png` | Mobile nav menu open |

Full-page capture in Chrome: `F12` → `Ctrl+Shift+P` → type "Capture full size screenshot".

### A5 — DMS Dairy POS (Raspberry Pi) → `public/img/source/dms/`

| # | Filename | Shot |
|---|---|---|
| 1 | `01-dashboard.png` | Chart.js dashboard with charts populated (demo data) |
| 2 | `02-pos-billing.png` | The POS / billing screen mid-transaction |
| 3 | `03-inventory.png` | Product & inventory management table |
| 4 | `04-invoice.png` | A generated PDF invoice |
| 5 | `05-audit.png` | Audit history or staff records view — *optional, shows the depth* |

### A6 — Urja Dairy Tour (Raspberry Pi kiosk) → `public/img/source/urja/`

| # | Filename | Shot |
|---|---|---|
| 1 | `01-language-select.png` | The English / हिंदी / मराठी selector — **the signature screen**, lead with it |
| 2 | `02-categories.png` | Category selection |
| 3 | `03-playback.png` | Tour playing, with progress indicator and playback controls visible |
| 4 | `04-tour-detail.png` | A tour stop's content view |

Capture at the kiosk's real resolution, not a scaled browser window.

### A7 — Raspberry Pi hardware — **CUT, no photos available**

No field photos exist. This does not cost the site much, because L5 was always going to be geometry rather than photography. Revised plan for L5 Ground:

- **Raspberry Pi board:** a CC0 Pi model (Sketchfab CC0 / Poly Haven electronics props), or built procedurally — a Pi is a green box, a black SoC, four USB blocks and a GPIO comb. Roughly 40 lines of `three` primitives and it reads instantly.
- **Kiosk enclosure:** procedural — a slab, a stand, a bezel. No modelling skill needed.
- **The kiosk screen:** this is where the credibility comes back. Instead of a photo of hardware, the screen renders the **real Urja Dairy Tour UI** live via `<Html transform>` — the language selector, actually clickable, inside the 3D scene. A working interface beats a photo of a box.
- **Second screen** in the diorama shows the DMS POS billing view the same way.

Net effect: L5 needs A5 and A6 screenshots, and no hardware photography at all.

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
| 2026-09-07 | Post-Phase-1 audit. Three real defects found and fixed: 7.6 MB of raw originals were being published (sources sat inside `public/`, which ships verbatim — moved to `assets-source/`, dist 9.9 MB to 2.4 MB); six text tints failed WCAG AA (`mist/50` 2.39:1, `/60` 2.97:1, `/70` 3.69:1 — floor raised to `/80`); and mobile had no navigation at all. Removed unused `profile.openToRemote`; synced README and the architecture folder diagram. |
| 2026-09-07 | Responsive rework. Fixed 1024 px container replaced with a fluid `.shell` (max 2200 px, `clamp()` padding), fluid type scale, and reading measures capped so wide screens gain space rather than line length. Project shot rows promoted to full block width; highlights split to two columns at xl. Verified 390 / 768 / 1280 / 1440 / 1920 / 2560. |
| 2026-09-07 | **Phase 1 complete.** Static portfolio built, deployed and verified live. All 22 screenshots received and processed, clearing B2 and unblocking Phase 3. Remaining: a Lighthouse run and a real-device pass. |
| 2026-09-07 | **Phase 0 complete.** Work had been committed to a local `backend` branch while `main` still sat at the initial commit; `main` was fast-forwarded to it and pushed. Pages was on `legacy` branch-serving mode, which would have served unbuilt source — switched to `workflow`. Live and green at https://shridhan29.github.io. |
