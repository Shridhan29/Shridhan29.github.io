# Prompt: scroll-driven redesign of the portfolio

Use this prompt in a new Claude Code session opened in this repository.

---

You are redesigning the scroll experience of my portfolio in this repository (Vite 8, React 19, TypeScript, three/R3F, Tailwind v4, Lenis, GSAP 3.13, zustand). The site is live at https://shridhan29.github.io and deploys from `main` through GitHub Actions only when every verify job passes.

**Work only on the `scroll_web` branch.** Never commit to, push to or merge into `main` yourself. When the redesign is done, it goes to `main` through a pull request. The pull request runs the full build and every verify suite but does not deploy, and the merge happens only when I approve it.

The visual reference is https://prichard.hu/. Use it **for reference only**. Match its *feel*: cinematic, scroll-driven, one idea per screen, dark and polished. Do **not** copy its content, logo, copy, layout one-to-one, imagery or brand. Every word and image on my site must come from my own data in `src/data/` and my own screenshots in `public/img/`. Never invent metrics, clients, awards, testimonials or projects.

## 1. Read first, change nothing yet

1. Read `ARCHITECTURE.md`, `IMPLEMENTATION_TRACKER.md`, `BUILD_PROMPT.md`, and `README.md`.
2. Read `src/canvas/` (the layer system, `CameraRig`, `Staged`, `useLayerFrame`, `moods.ts`, `NameField`), `src/dom/sections/*`, `src/dom/ui/Gallery.tsx`, `src/hooks/useLenis.ts` and `src/styles/index.css`.
3. Read `scripts/verify-*.mjs` so you know what the tests assert. These include:
   - stages and layer textures (phase3);
   - mood ΔE ≥ 8 between neighbouring layers, and particle-name placement (phase4);
   - CLS < 0.05 and metadata (phase5);
   - axe and keyboard checks (a11y);
   - bundle budgets: entry ≤ 180 KB gz and lazy ≤ 600 KB gz.
4. Then write a short plan, section by section, listing the files you will touch. Show it to me and **wait for my approval** before editing.

## 2. What the reference does (observed at 1440 × 900)

Use these as patterns. Do not copy them pixel for pixel.

- **Base:**
  - Near-black navy background (about `#020617`) with a faint starfield.
  - White text; blue-to-violet accent gradients.
  - Glassy, rounded surfaces with soft blue glows.
- **Headings are two-tone:** a heavy uppercase line in white, then a second line in the accent gradient (for example "INNOVATIVE / DESIGN"). Body text is short, centred or left-aligned, at a comfortable measure.
- **Navigation:**
  - A centred pill with an underline under the active item.
  - The logo on the left and a contact link with ↗ on the right.
  - A thin two-line menu icon.
- **The hero:**
  - A large headline with one gradient word, a subline, one primary CTA and a small credential badge.
  - A "Scroll" cue at the bottom.
- **A pinned statement:** one short heading and two lines of copy, centred, alone on the screen.
- **A media frame that grows with scroll:** a framed video or collage starts at about 40 % of the viewport width. While the section is pinned, scrolling scales it to nearly full-bleed with rounded corners, then it shrinks and releases. This is scrubbed: it is tied to scroll position, not played once.
- **A pinned feature with a 3D device:**
  - Text on the left; a phone mockup on the right that tilts and rotates in 3D as you scroll.
  - A particle sphere drifts behind it.
  - The phone finally flies out before the next section.
- **A horizontal highlights strip:** a row of phone screens you can drag sideways, with round ← → buttons top right. The active button is filled, the inactive one dimmed.
- **Contact:**
  - Two columns: a large two-tone heading, a short pitch and direct contact links on the left; the form on the right.
  - The form uses underlined inputs, chip-style choices and a full-width gradient submit button.
- **Footer:** minimal, with small legal links.
- **Technology seen:** GSAP and ScrollTrigger (pinning and scrubbing), GSAP Draggable for the strip, and two canvases (particles).

## 3. Target experience for my site

Keep the existing 3D journey (camera along `CAMERA_CURVE`, one layer per section, particle name in the hero). The goal is to make the **DOM side** scroll-driven and cinematic so it moves *with* the 3D scene, not beside it. Keep the existing section order unless a change below says otherwise.

### 3.1 Hero (`Hero.tsx`)
- Intro on load:
  - The eyebrow, the headline lines, the subhead and the CTAs reveal in sequence: a mask or clip reveal per line, staggered by 60–90 ms, about 0.9 s in total.
  - It plays once and never blocks reading.
- Headline: a two-tone treatment, with one key word in the accent gradient. Use my real headline from `src/data/profile.ts`, for example the word "leaves" or "laptop", whichever reads best.
- Add a subtle animated "Scroll" cue at the bottom, which fades out after the first scroll.
- While scrolling out of the hero, everything is scrubbed:
  - the copy rises and fades;
  - the portrait gets a slight parallax;
  - the stats row staggers in, then out.
- The particle name keeps its fixed band (`[data-name-band]`) and existing dispersal. Do not break phase4.

### 3.2 Statement (new, between the hero and Work)
- Pinned for about 100 vh.
- A centred two-tone heading built from my real positioning. Draft it from `profile.subhead` or `profile.about`, and show it to me for approval.
- The words light up one by one as you scroll: a scrubbed opacity from 0.15 to 1 per word.

### 3.3 Reel (new, the opening of Work)
- Pinned. A rounded frame scales from about 45 % of the viewport width to full-bleed (minus a 24 px inset), then shrinks back and releases.
- Contents: there is no video, so build a tilted collage of my real phone and web screenshots from `public/img/truuna`, `aashman.in`, `dms` and `urja`, using existing sizes only. Lazy-load it, and make sure it adds no CLS.
- If you think a short muted looping video would be clearly better, propose it and stop. Don't add binary assets without my approval.

### 3.4 Projects (`Projects.tsx`, one chapter per project)
- Each project becomes a pinned chapter:
  - **Left:** the number ("01 / 04"), a two-tone title, the tagline, the summary, the meta, and the stack chips. These reveal as the chapter enters.
  - **Right:** the existing 3D stage for that project (device, surface or kiosk). Scroll drives a **screen sequence**: the device's screen steps through that project's real screenshots in order, and the device tilts slightly between steps.
  - A small progress indicator shows the current step.
- Below each chapter, put the full gallery as a **horizontal draggable strip** with round ← → buttons (filled when enabled, dimmed at the ends).
  - Mouse: drag and wheel-sideways. Touch: swipe. Keyboard: arrows.
  - Clicking a screenshot still opens the existing lightbox.
  - Phone-shot projects use phone frames; web projects use browser frames. Nothing is ever cropped.
- Keep "Highlights" and the "Show details / Hide details" toggle. Highlights may reveal line by line.

### 3.5 About, Skills, Experience
- **About:** a pinned portrait or text split with a scrubbed word reveal for the first paragraph. The rest reads normally.
- **Skills:** cards rise in with a stagger. A hover lifts the card and adds a soft glow. Don't use tilt effects that fight the scene.
- **Experience:** a vertical timeline line that **draws itself** as you scroll (scrubbed stroke). Dates count up, and bullets reveal in order.

### 3.6 Contact (`Contact.tsx`)
- Two columns at `lg` and up.
- **Left:**
  - a two-tone heading ("Have something to build? / Let's talk." or better copy from my data, shown to me for approval);
  - one line of pitch;
  - email and phone as large accent links.
- **Right:** the existing Web3Forms form, restyled:
  - underlined inputs;
  - a chip group for "What is it about?" (keep any new fields optional and backward compatible with Web3Forms);
  - a full-width gradient submit button;
  - success and error states that keep the existing aria-live behaviour.

### 3.7 Navigation and global polish
- Nav:
  - a centred pill with an animated underline that slides to the active section (extend the current `aria-current` logic);
  - the résumé stays as the button on the right;
  - a solid enough background to stay legible over any layer.
- Section labels and headings use one consistent two-tone system across the whole site.
- **Font:** `--font-display` names `Satoshi`, but no font file is loaded, so the site currently falls back to system fonts. That fallback is also why CI rendered the hero differently.
  - Propose two or three open-licence display fonts (for example Satoshi from Fontshare, Sora or Space Grotesk) with weights and subset sizes.
  - Self-host one as a subset `woff2` with `font-display: swap` and a metric-matched fallback (`size-adjust`) so there is no CLS.
  - **Ask me before adding the font files.**
- Optional, desktop pointer only: a small cursor follower or magnetic hover on CTAs (`useMagnet` already exists). It must be off for touch and for reduced motion.

## 4. How to build it

- Use **GSAP ScrollTrigger** for pinning and scrubbing. It is already a dependency, so register the plugin in one place.
  - Drive it from the **existing Lenis instance** (`lenis.on('scroll', ScrollTrigger.update)` and `gsap.ticker`), not a second scroll loop.
  - Keep one source of truth for scroll progress. The camera in `CameraRig` and DOM triggers must agree, and a pinned section must not desync the 3D journey. Measure and adjust the curve keyframes if pin spacing changes section offsets.
- For the draggable strip, prefer native CSS scroll-snap with pointer drag added on top, rather than adding GSAP Draggable. If Draggable is clearly better, ask first. **No new dependencies without my approval.**
- Put shared motion in `src/dom/motion/` with these primitives, each exposed as a hook or component:
  - `useScrub`
  - `usePin`
  - `SplitReveal`
  - `WordScrub`
  - `DrawLine`
  - `HStrip`

  Clean up every ScrollTrigger on unmount and on resize (`ScrollTrigger.refresh` after fonts and images load).
- Animate only `transform` and `opacity`, plus `clip-path` where needed. Never animate layout properties.
- Code-split heavy sections, and keep the entry bundle within budget.

## 5. Non-negotiable quality bar

- **Reduced motion** (`prefers-reduced-motion: reduce`): no pinning, no scrubbing, no parallax. Content appears in place, fully readable, with at most short fades. Test it.
- **Scene off / no WebGL / low tier:** every section is still complete and readable, and pins degrade to normal flow on low tier and on phones if they hurt scrolling.
- **Mobile (390 × 844) and tablet (820 × 1180):**
  - no horizontal page scroll;
  - pins shorter or removed where they would trap the thumb;
  - the strip swipes natively;
  - tap targets ≥ 44 px.
- **Accessibility:**
  - every animated text is in the DOM as real text, in reading order, and never split into pieces a screen reader reads letter by letter (use `aria-label` on the parent or visually hidden full text);
  - focus order is unchanged;
  - focus is never hidden behind a pinned layer;
  - contrast is AA over every layer.
- **Performance:**
  - CLS < 0.05;
  - no long tasks above 50 ms from scroll handlers;
  - 60 fps on a mid laptop at the medium tier;
  - the bundle budgets still pass.
- **Truthfulness:** only my real content. Any new copy (statement, contact heading) is a draft for me to approve.

## 6. Process

1. Plan first and wait for my approval (see §1).
2. Build one section at a time in this order:
   1. motion primitives and Lenis/ScrollTrigger wiring;
   2. hero;
   3. statement;
   4. reel;
   5. project chapters and strip;
   6. about/skills/experience;
   7. contact;
   8. nav and font.

   After each section, build it, take screenshots at 1440 × 900, 820 × 1180 and 390 × 844, at scroll positions before, during and after each pin, and check them yourself before moving on.
3. Update or add verify checks for the new behaviour:
   - pins release;
   - the strip is keyboard-reachable;
   - reduced motion shows everything with no pin spacers;
   - no text is split for screen readers.

   Keep every existing check passing. If a check's assumption truly changes (for example section offsets), explain why before changing it.
4. Run `npm run verify` (all suites). Use `npx prettier --write <files>`, never a blanket format. Add a dated change-log row to `IMPLEMENTATION_TRACKER.md`.
5. **Do not commit or push without my explicit approval.** When approved, commit and push to `scroll_web` as separate commands. When the whole redesign is ready, open a pull request into `main` and watch its CI. Merge only with my approval, then watch the deploy on `main` and confirm the live bundle changed.
6. Report what changed, what was verified, and anything you skipped or could not test (for example a real GPU, Safari or Android), stated plainly.
