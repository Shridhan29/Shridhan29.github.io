# Device testing

The checks here need real hardware. Everything else — draw calls, triangles,
bundle sizes, contrast, layout — is measured automatically by `npm run verify`
and `npm run perf`, but those run on software rendering, so their frame rates say
nothing about a real device.

Test against the live site: **https://shridhan29.github.io**

Budgets these results are judged against (ARCHITECTURE §6):

| Metric | Budget |
|---|---|
| Desktop frame rate | 60 fps sustained — frame time ≤ 16.7 ms |
| Mid-range phone frame rate | ≥ 30 fps sustained — frame time ≤ 33 ms |
| Lighthouse Performance | ≥ 85 desktop, ≥ 70 mobile |

## 1. The debug overlay

Add `?debug=1` to the URL: **https://shridhan29.github.io/?debug=1**

A panel appears in the bottom-left corner. The numbers that matter:

| Field | Meaning |
|---|---|
| `fps` / `ms` | Frame rate and mean frame time over the last half second |
| `calls` | Draw calls per frame (budget ≤ 120) |
| `geometries` / `textures` / `programs` | GPU resources currently alive |

Wait two seconds after each scroll for the numbers to settle.

## 2. Desktop — frame rate (about 5 minutes)

Use the laptop or desktop you would show the site on, in Chrome, plugged in,
with the window maximised.

1. Open https://shridhan29.github.io/?debug=1 and wait for the 3D to appear.
2. At each stop below, scroll until that part of the page is centred, wait two
   seconds, and write down `fps` and `ms`:
   - top of the page (hero, with the monolith)
   - TRUUNA (the 3D phone)
   - Aashman Technicals (the layered website panes)
   - DMS (the POS terminal and Raspberry Pi)
   - Urja Dairy Tour (the kiosk)
   - About (the API and database diagram)
   - Experience (the delivery pipeline)
3. Scroll from top to bottom at a normal reading pace and note any visible
   stutter, and where.

## 3. Lighthouse (about 5 minutes)

In desktop Chrome, in an **Incognito window** (extensions skew the score):

1. Open https://shridhan29.github.io (without `?debug=1`).
2. Open DevTools (`F12`) → **Lighthouse** tab.
3. Mode **Navigation**, category **Performance** (the others are fine to leave on).
4. Run once with **Device: Desktop**, then once with **Device: Mobile**.
5. Note each Performance score, and the values for **LCP**, **TBT** and **CLS**.

## 4. Android phone (about 10 minutes)

Use a mid-range Android phone. Phones get the plain 2D page — no 3D at all
(decision D12) — so this checks that the page reads well and scrolls cleanly.

**Check by eye:**

1. The page fits the screen — no sideways scrolling, nothing cut off.
2. The TRUUNA screenshot row scrolls sideways with a finger.
3. Scrolling feels smooth; note any stutter and where.
4. Rotate to landscape and back: nothing jumps or overflows.

**Optional, with a cable:** Settings → About phone → tap **Build number** seven
times → Developer options → **USB debugging** on. Connect by USB, open
`chrome://inspect/#devices` on the computer, click **inspect** on the site, and
record a **Performance** trace while scrolling the whole page once.

## 5. Other browsers (about 15 minutes)

Open https://shridhan29.github.io in each you can reach. In every one: the 3D
scene appears on desktop (or the plain page on a phone), scrolling moves the
camera, the footer **Graphics** menu works, **Esc** switches to the plain view,
and the contact form submits.

- **Safari on a Mac** — also check the hero name in particles and the fade-in.
- **Safari on an iPhone** — plain page expected; check it fits and scrolls.
- **Firefox** and **Edge** on desktop.
- **Samsung Internet** on a Samsung phone, if you have one.

## 6. Link previews and screen readers (about 10 minutes)

1. **LinkedIn:** paste the site URL into https://www.linkedin.com/post-inspector/
   and confirm the card shows the name, the role and the portrait.
2. **WhatsApp:** send the URL to yourself; the same card should appear.
3. **Screen reader:** with VoiceOver (Mac: `Cmd+F5`) or TalkBack (Android), go
   through the page top to bottom. Note anything read twice, read as gibberish
   (the hero role line scrambles visually but should be read cleanly), or skipped.

## 7. Send back

Copy this table, fill it in, and paste it into the conversation.

```
Desktop: <make/model, GPU if known>, Chrome <version>

| Stop        | fps | ms |
|-------------|-----|----|
| top         |     |    |
| TRUUNA      |     |    |
| Aashman     |     |    |
| DMS         |     |    |
| Urja        |     |    |
| About       |     |    |
| Experience  |     |    |
Stutter while scrolling: <none / where>

Lighthouse desktop: Performance __  LCP __  TBT __  CLS __
Lighthouse mobile:  Performance __  LCP __  TBT __  CLS __

Phone: <make/model>, Android <version>, Chrome <version>
Fits the screen: yes/no    Smooth scrolling: yes/no (where not)
Screenshot row scrolls: yes/no

Browsers checked: <Safari Mac / Safari iPhone / Firefox / Edge / Samsung Internet>
Problems: <none / what and where>

LinkedIn preview: ok/broken    WhatsApp preview: ok/broken
Screen reader: <VoiceOver/TalkBack>, problems: <none / what>
Performance recording: <long frames? where>
```
