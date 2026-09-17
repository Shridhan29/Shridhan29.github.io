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

## 4. Android phone (about 15 minutes)

Use a mid-range Android phone. Phones show the hero's stars in 3D and the rest
of the page as normal content, so this checks that the phone is not strained
and that the page reads well.

**Connect it for measurement (optional but best):**

1. On the phone: Settings → About phone → tap **Build number** seven times to
   enable Developer options. Then Developer options → turn on **USB debugging**.
2. Connect it to the computer by USB and accept the prompt on the phone.
3. On the computer, open `chrome://inspect/#devices` in Chrome. Open the site in
   Chrome on the phone; it appears in the list. Click **inspect**.
4. In that DevTools window, **Performance** tab → record while you scroll the
   whole page once on the phone → stop. Note any long red frames.

**Without a cable:** open https://shridhan29.github.io/?debug=1 on the phone and
read `fps` / `ms` from the overlay at the top of the page and while scrolling.

**Check by eye:**

1. The page fits the screen — no sideways scrolling, nothing cut off.
2. Scrolling feels smooth; note any stutter and where.
3. Leave the page open at the top for **3 minutes**. Note whether the phone gets
   noticeably warm, and whether `fps` drops over that time.

## 5. Send back

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
Top of page fps/ms: __ / __
Fits the screen: yes/no    Smooth scrolling: yes/no (where not)
After 3 minutes: warm? yes/no   fps then: __
Performance recording: <long frames? where>
```
