# Scroll redesign: implementation plan

This plan builds the redesign in `SCROLL_REDESIGN_PROMPT.md`, on the `scroll_web` branch. It is written against the code as it stands at `df946e8`.

## Key decision: scroll timelines in CSS, not GSAP ScrollTrigger

The brief suggests ScrollTrigger. I am using CSS instead, for three reasons found in the code:

1. **GSAP isn't loaded for every visitor.** It is loaded only with the lazy 3D chunk (`src/canvas/Scene.tsx` calls `useLenis`). Visitors on the Static tier (no WebGL, or reduced motion) never download it. Moving it into the entry bundle would cost about 45 KB gz for every visitor, and the Static tier would still need a separate code path.
2. **The site already uses CSS scroll timelines.** `.reveal` uses `animation-timeline: view()`, so CSS scroll-driven animation is the established pattern. It costs 0 KB, runs off the main thread, and follows Lenis automatically, because Lenis scrolls the window itself.
3. **Pinning is `position: sticky` inside a tall wrapper.** ScrollTrigger's pin-spacer would wrap elements in new boxes and move every article's offset. `measureStops()` would then have to stay in step with ScrollTrigger's refresh order. With sticky, the extra height is ordinary document height, which `measureStops()` already reads, so the camera journey re-times itself.

Fallbacks:

- Browsers without `animation-timeline` (Firefox today) get the finished state: everything visible, no pin height.
- `prefers-reduced-motion: reduce` gets the same finished state.

Every scrubbed effect therefore sits inside `@supports (animation-timeline: view())` and `@media (prefers-reduced-motion: no-preference)`. The base styles, outside those blocks, are the final, readable state.

JavaScript is used only where CSS can't do the job:

- the horizontal strip's arrow buttons and drag;
- the nav's sliding indicator, which already has the scroll-spy.

There are no new dependencies.

## Phase 1: DOM motion, no changes to the 3D layers

1. **Motion primitives** (`src/styles/index.css`, `src/dom/motion/`):
   - `.t-accent`: gradient text for the second tone of a heading.
   - `WordScrub`: splits a sentence into words and lights each one, from 0.18 opacity to 1, as the element crosses the viewport. Screen readers read the sentence once, from a visually hidden copy; the word spans are `aria-hidden`.
   - `.intro-rise`: a one-shot, time-based load reveal with a stagger set by a `--i` custom property.
   - `.draw-y`: a vertical line whose `scaleY` follows its own view timeline.
   - `.pin-track` / `.pin-sticky`: the tall wrapper and the sticky stage for pinned sections. Without support or with reduced motion, the wrapper collapses to its content height.
2. **Hero:**
   - staggered intro for the eyebrow, headline, subhead, CTAs and stats;
   - two-tone headline (the gradient on "leaves the laptop.");
   - a "Scroll" cue that fades out as the hero leaves.
   - The name band stays as it is.
3. **Statement** (new `Statement.tsx` between the hero and Work):
   - a pinned, centred, word-by-word scrub of one sentence taken from `profile.about[0]`;
   - the sentence is a draft for approval.
4. **Section headings:** `Section` takes an optional `accent` (the trailing words drawn in the gradient). Each section uses it.
5. **Galleries:**
   - both kinds become one horizontal strip with snap and drag;
   - round ← → buttons sit in the "Screens" header, filled when they can move and dimmed at the ends;
   - arrow keys work when the strip is focused;
   - clicking an image still opens the lightbox.
6. **Experience:** a timeline line that draws down the left edge of the entry as it scrolls past.
7. **Contact:**
   - two-tone heading;
   - email and LinkedIn as large accent links;
   - inputs with underlines in place of boxes;
   - the existing submit, honeypot and aria-live behaviour unchanged.
8. **Nav:** a highlight pill that slides between items instead of jumping.
9. Run every verify suite and check screenshots at 1440, 820 and 390 px.

## Phase 2: after you review Phase 1

1. **Reel:** a pinned collage of real screenshots that grows to full-bleed at the start of Work.
2. **Project chapters:** pin each project's text beside its 3D stage, and step the device's screen through that project's screenshots as you scroll. This touches `src/canvas/layers/*` and phase3's stage checks, so it gets its own round.
3. **Display font:** choose one of Satoshi, Sora or Space Grotesk (your call). Self-host it as a subset woff2 with a metric-matched fallback.

## Checks to add

- **Reduced motion:** no `.pin-track` is taller than its content, and every `WordScrub` word is at full opacity.
- **WordScrub:** the accessible name of each scrubbed sentence equals the sentence.
- **Gallery strips:** they are keyboard-focusable, and the arrow buttons move them and disable at the ends.
- **Existing suites:** they stay green. Any assumption that truly changes is explained in the change log.
