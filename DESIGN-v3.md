---
name: BuildersPool
version: 3.0-draft
updated: 2026-11-05
status: proposed — not yet implemented. DESIGN.md (v2.0) stays the live spec until this file is promoted.
owner: Builders' Pool Technologies Ltd (RC 9317391)
supersedes: DESIGN.md v2.0
keeps: the v2.0 colour palette, one-colour-one-job rule, Pool & Save semantics, ₦ money rules, contact details
changes: typeface system, type scale, layout system, three density modes, motion, imagery rules, accessibility fixes, performance budgets

colors:
  # ── Brand (unchanged from v2.0) ──────────────────────────────────────────
  navy: "#0B1F3A"
  cyan: "#1BA6DE"
  cyan-strong: "#0F86B8"     # large text (≥ 24px / 18.66px bold) and icons ONLY — 4.1:1 on white
  cyan-text: "#0B5F86"       # any-size cyan text on white / pale-blue (7.0:1 / 6.2:1)
  pale-blue: "#E6F4FB"
  orange: "#F47B20"          # decoration only
  orange-soft: "#FDEBDD"
  cta: "#CC4E00"             # white text 4.51:1
  cta-hover: "#B34400"       # white text 5.61:1
  orange-text: "#B34400"
  logo-gray: "#3D4752"

  # ── Surfaces (unchanged) ─────────────────────────────────────────────────
  background: "#F1F1F2"
  card: "#FFFFFF"
  card-alt: "#FBFCFD"
  surface: "#E9EEF4"
  muted: "#E4E9EF"

  # ── Text (unchanged) ─────────────────────────────────────────────────────
  foreground: "#0B1F3A"
  text-storefront: "#282828"
  text-secondary: "#545459"
  muted-foreground: "#5A6B80"
  placeholder: "#6B6B70"

  # ── Lines ────────────────────────────────────────────────────────────────
  hairline: "#E6E6E8"        # decorative dividers only (1.25:1 — never a control boundary)
  border: "#D5DDE6"          # decorative card edges only
  border-strong: "#B7C3D0"   # decorative
  input-border: "#7C8BA0"    # NEW — every input, select, checkbox, radio boundary (3.47:1 on white, 3.07:1 on ground)

  # ── Status ───────────────────────────────────────────────────────────────
  success: "#1F7A4D"
  success-soft: "#E3F3EA"
  warning: "#B26A00"         # fills and icons only
  warning-text: "#8A5200"    # NEW — warning text and the TEST tag fill (6.4:1 on white, 5.8:1 on warning-soft)
  warning-soft: "#FFF3DC"
  error: "#B42318"
  error-soft: "#FBE9E7"

  # ── Derived tones for dark (navy) surfaces — the only additions ──────────
  navy-raised: "#162F52"     # cards sitting on navy
  on-navy: "#FFFFFF"
  on-navy-muted: "#B6BFCC"   # 8.9:1 on navy
  on-navy-line: "rgba(255,255,255,0.14)"

  charts: ["#0B1F3A", "#1BA6DE", "#7FC8EA", "#5A6B80", "#B7C3D0"]

typography:
  families:
    sans: "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif"   # ONE family for display, UI and body
    mono: "'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace"                  # figures only
  weights: { sans: [400, 500, 600, 700, 800], mono: [400, 500] }
  rules:
    min-size: 12px                # 11px permitted only for phone tab-bar labels
    line-length: "60–72ch for running text, 40–48ch for card copy"
    headings: "text-wrap: balance"
    paragraphs: "text-wrap: pretty"
    numerals: "tabular-nums wherever two figures can sit in a column; ₦ is in latin-ext and must be verified in the primary face (see §3.4)"
  scale:   # fluid: size = clamp(min, preferred, max). px values assume 16px root.
    display-xl:  { size: "clamp(2.5rem, 1.6rem + 4vw, 4.5rem)",     px: "40 → 72", weight: 800, line: 1.04, tracking: "-0.035em", use: "home hero only" }
    display-lg:  { size: "clamp(2rem, 1.4rem + 2.6vw, 3.25rem)",    px: "32 → 52", weight: 800, line: 1.08, tracking: "-0.03em",  use: "showroom section statements" }
    heading-xl:  { size: "clamp(1.75rem, 1.4rem + 1.4vw, 2.5rem)",  px: "28 → 40", weight: 700, line: 1.15, tracking: "-0.025em", use: "page title (h1)" }
    heading-lg:  { size: "clamp(1.375rem, 1.2rem + 0.7vw, 1.75rem)", px: "22 → 28", weight: 700, line: 1.2,  tracking: "-0.02em",  use: "section title (h2)" }
    heading-md:  { size: "1.25rem",   px: 20, weight: 700, line: 1.3,  tracking: "-0.01em", use: "card group / panel title (h3)" }
    heading-sm:  { size: "1.0625rem", px: 17, weight: 700, line: 1.35, tracking: "0",       use: "row title, form section (h4)" }
    body-lg:     { size: "1.0625rem", px: 17, weight: 400, line: 1.55, use: "intro paragraphs, hero support line" }
    body:        { size: "0.9375rem", px: 15, weight: 400, line: 1.55, use: "default text" }
    body-sm:     { size: "0.875rem",  px: 14, weight: 400, line: 1.45, use: "dense tables, helper text, product names" }
    caption:     { size: "0.8125rem", px: 13, weight: 400, line: 1.4,  use: "units, timestamps, secondary notes" }
    label:       { size: "0.75rem",   px: 12, weight: 700, line: 1.3,  tracking: "0.06em", transform: uppercase, use: "eyebrows, table headers, tags" }
    micro:       { size: "0.6875rem", px: 11, weight: 700, line: 1.2,  use: "phone tab-bar labels only" }
    figure-xl:   { family: mono, size: "clamp(2.25rem, 1.6rem + 3vw, 3.75rem)", px: "36 → 60", weight: 500, line: 1.0, tracking: "-0.02em", use: "pool countdown, savings headline" }
    figure-lg:   { family: mono, size: "1.5rem",   px: 24, weight: 500, line: 1.1, use: "stat tiles, totals" }
    figure:      { family: mono, size: "0.9375rem", px: 15, weight: 500, line: 1.4, use: "order numbers, ledger rows, kobo-exact amounts" }
    price-lg:    { family: sans, size: "1.75rem",  px: 28, weight: 800, line: 1.1, tracking: "-0.02em", numerals: tabular, use: "product page price" }
    price:       { family: sans, size: "1.25rem",  px: 20, weight: 700, line: 1.2, numerals: tabular, use: "card price" }
    price-sm:    { family: sans, size: "1rem",     px: 16, weight: 700, line: 1.2, numerals: tabular, use: "offer rows, cart lines" }
    wordmark:    { family: sans, size: "1.625rem", px: 26, weight: 800, tracking: "-0.03em", mobile: "20px" }

spacing:   # 4px base. Components use 4–24. Sections use the rhythm tokens.
  base: [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128]
  section-rhythm: { phone: { tight: 32, default: 48, loose: 72 }, desktop: { tight: 48, default: 80, loose: 120 } }

radius: { control: 6px, card: 8px, panel: 12px, pill: 9999px }   # v2 allowed 4/6/8/10; v3 uses three steps, nothing else

elevation:
  flat: "none"                                   # default: separation by tone, not shadow
  raised: "0 1px 2px rgba(11,31,58,0.06), 0 1px 1px rgba(11,31,58,0.04)"
  floating: "0 8px 24px rgba(11,31,58,0.12)"     # menus, popovers, sheets
  focus: "0 0 0 3px rgba(27,166,222,0.45)"       # plus a 2px solid cyan-text outline for forced-colours

motion:
  duration: { instant: 80ms, fast: 160ms, base: 240ms, slow: 400ms }
  easing: { standard: "cubic-bezier(0.2, 0, 0, 1)", emphasised: "cubic-bezier(0.16, 1, 0.3, 1)", exit: "cubic-bezier(0.4, 0, 1, 1)" }
  properties: "transform and opacity only"

layout:
  container: { content: 1280px, wide: 1440px, prose: 720px }
  grid: { columns: 12, gutter: { phone: 16px, tablet: 24px, desktop: 32px }, margin: { phone: 16px, tablet: 32px, desktop: 48px } }
  breakpoints: { min: 360px, sm: 480px, md: 768px, lg: 1024px, xl: 1280px, wide: 1536px }
  header: { phone: 56px, desktop: 64px }
  tap-target: 44px
  scroll-padding-top: "calc(header height + 16px)"   # focus and anchors never hide under the sticky header

performance-budget:   # measured on a throttled mid-range Android (Slow 4G, 4× CPU slowdown)
  LCP: "≤ 2.5s"
  CLS: "≤ 0.05"
  INP: "≤ 200ms"
  home-initial-js: "≤ 150 KB gzipped"
  hero-image: "≤ 160 KB (AVIF/WebP), explicit width/height, fetchpriority=high"
  fonts: "one variable sans (latin + latin-ext) + one mono; font-display: swap; preload the latin sans file"
---

# BuildersPool Design System — v3.0 (draft)

> **Status:** proposal. The live app still follows `DESIGN.md` v2.0. Nothing here is built until it is promoted.

## 0. What this version is for

v2.0 got BuildersPool to a clean, consistent Jumia-style marketplace. It is correct, and it is why the site now looks like every other marketplace. v3.0 keeps everything that is *ours* — the palette, the one-colour-one-job rule, Pool & Save, honest numbers — and raises the craft bar to a **product company standard**: fewer elements, each one deliberate; large confident type; quiet chrome; real photography; motion that explains instead of decorates; measurable performance and accessibility.

The test for every screen is the one a product team at a car or aerospace company would apply: *Can someone who has never seen this page tell, in five seconds, what it is, what is happening right now, and the one thing to do next?*

### What changes from v2.0

| Area | v2.0 | v3.0 | Why |
| --- | --- | --- | --- |
| Typeface | Roboto + Poppins + IBM Plex Mono | **Plus Jakarta Sans** (one family, 400–800) + **Geist Mono** for figures | Poppins and Roboto/Inter are everywhere. One distinctive family with a real weight range gives hierarchy without a second face to load. |
| Type scale | 11 fixed sizes, 28px max h1 | 15 tokens, **fluid** display range up to 72px, a mono "figure" ramp, tracking and line-height per token | v2 had no display tier, so every page opened at the same volume. |
| Layout | 1200px container, one density | **1280px / 12-col grid**, three **density modes** (Showroom, Aisle, Control room), section-rhythm tokens | One density cannot serve a landing page, a catalogue and an admin table. |
| Surfaces | Cards on grey, shadows for hover | Tonal layering first; shadows only for floating layers; **three radii** | Flat and precise reads as engineered. |
| Motion | `ease`, 120/200/320ms | Named easings, transform/opacity only, scroll-reveal rules, reduced-motion contract | Motion has to be fast on low-end phones. |
| Imagery | "Real Nigerian sites" | Shot list, aspect ratios, weight budgets, **no photo → no feature slot** | Placeholder imagery was the biggest credibility leak. |
| Accessibility | Pre-checked token pairs | Seven **corrections** to v2.0 pairs that fail WCAG (see §12), plus a 3:1 input border | Several v2 token uses are below the minimum. |
| Performance | "< 3 s on throttled mobile" | Numeric budgets (LCP, CLS, INP, JS, hero weight) | What is not measured regresses. |

**Unchanged on purpose:** every brand colour, `cta` for spending money only, cyan/pale-blue for Pool & Save and savings only, navy for structure, light mode only, ₦ + tabular numerals, TEST tag on simulated payments, 44px touch targets, sentence case.

---

## 1. Principles

1. **One message per viewport.** A showroom screen says one thing, in the largest type on the page, with one primary action. Everything else waits below.
2. **Quiet chrome, loud content.** Navigation, borders and containers recede; photography, prices and the pool clock carry the page. If removing a line, shadow or label changes nothing, remove it.
3. **Show the live system.** Pool & Save is a daily cycle. The interface always shows where the cycle is *now* — a real clock, a real stage — never a static explanation of it.
4. **One colour, one job** (unchanged). Orange spends money. Cyan pools and saves. Navy structures. A Pool & Save action is never orange; a Buy Direct action is never cyan.
5. **Honest numbers** (unchanged). Exact prices; savings are *Estimated* until awarded and *Verified* after; no figure appears that the system cannot back. Where data does not exist yet, show a real empty state, not an invented number.
6. **Engineered for the weakest device.** Design for a mid-range Android on a patchy connection in sunlight. Budgets in the front matter are acceptance criteria, not aspirations.
7. **Type does the work.** Hierarchy comes from size, weight and spacing, not from boxes, colours or icons.
8. **Every state is designed.** Loading, empty, error, offline, partial, success. A screen is not done until all six exist.

---

## 2. Density modes

BuildersPool is three products in one shell. Each page declares its mode; the mode sets type tier, spacing and container.

| | **Showroom** | **Aisle** | **Control room** |
| --- | --- | --- | --- |
| Pages | Home, Pool & Save story, supplier landing, campaign pages | Catalogue, product, cart, checkout, orders, account | Seller Centre, Admin, Hub, Dispatch |
| Goal | Make one idea memorable; move to the next step | Compare, decide, pay | Operate quickly, audit exactly |
| Type tier | display-xl/lg, body-lg | heading-xl/lg, body, price | heading-lg/md, body-sm, figure |
| Section spacing | `loose` rhythm | `default` rhythm | `tight` rhythm |
| Container | `wide` 1440 with full-bleed media allowed | `content` 1280 | fluid inside the sidebar shell |
| Ground | `background` and navy blocks | `background`, white cards | `background`, `card-alt` panels |
| Imagery | Full-bleed photography | Product photography on neutral ground | None except avatars and proofs of delivery |
| Motion | Scroll reveal, hero entrance | Micro-feedback only | Almost none |

A page never mixes modes in one viewport. The transition between modes (home → catalogue) is the moment the page gets denser.

---

## 3. Typography

### 3.1 Typefaces

- **Plus Jakarta Sans** is the only text face: display, headings, UI, body, buttons, tables, prices. Its geometric but warm forms hold up at 12px on low-density screens and at 72px in the hero. The weight range (400–800) replaces the old Poppins/Roboto split — hierarchy comes from weight and size inside one family.
- **Geist Mono** (tabular) is for *figures that must align or be read exactly*: the pool countdown, order numbers, reference codes, ledger rows, kobo-exact amounts, stat tiles. It is never used for sentences.
- No third family. No italics in UI. No faux bold. Self-hosted through `next/font` (variable axis for Plus Jakarta Sans; `latin` + `latin-ext` so ₦ renders).

### 3.2 Scale

Fluid tokens interpolate between a 360px and a 1440px viewport. Use the token name in code, never a raw size.

| Token | Size (px) | Weight | Line | Tracking | Use |
| --- | --- | --- | --- | --- | --- |
| `display-xl` | 40 → 72 | 800 | 1.04 | −0.035em | Home hero headline only |
| `display-lg` | 32 → 52 | 800 | 1.08 | −0.03em | Showroom section statements |
| `heading-xl` | 28 → 40 | 700 | 1.15 | −0.025em | Page title (h1) |
| `heading-lg` | 22 → 28 | 700 | 1.2 | −0.02em | Section title (h2) |
| `heading-md` | 20 | 700 | 1.3 | −0.01em | Panel / group title (h3) |
| `heading-sm` | 17 | 700 | 1.35 | 0 | Row title, form section (h4) |
| `body-lg` | 17 | 400 | 1.55 | 0 | Intro paragraphs, hero support line |
| `body` | 15 | 400 | 1.55 | 0 | Default text |
| `body-sm` | 14 | 400 | 1.45 | 0 | Product names, dense tables, helper text |
| `caption` | 13 | 400 | 1.4 | 0 | Units, timestamps, notes |
| `label` | 12 | 700 | 1.3 | +0.06em, uppercase | Eyebrows, table headers, tags |
| `micro` | 11 | 700 | 1.2 | 0 | Phone tab-bar labels only |
| `figure-xl` | 36 → 60 | Mono 500 | 1.0 | −0.02em | Pool countdown, savings headline |
| `figure-lg` | 24 | Mono 500 | 1.1 | 0 | Stat tiles, totals |
| `figure` | 15 | Mono 500 | 1.4 | 0 | Order numbers, ledger, kobo amounts |
| `price-lg` | 28 | 800 | 1.1 | −0.02em | Product-page price |
| `price` | 20 | 700 | 1.2 | 0 | Card price |
| `price-sm` | 16 | 700 | 1.2 | 0 | Offer rows, cart lines |

### 3.3 Rules

- **Hierarchy ratio:** adjacent heading tiers differ by at least 1.25×. If two things on a page are within 1.2× of each other in size, they must differ in weight or colour.
- **One display line per screen.** `display-*` appears at most once per viewport.
- **Measure:** running text 60–72ch (`max-width: 68ch`); card copy 40–48ch. Never full-width paragraphs.
- **Case:** sentence case everywhere. `label` is the only uppercase style.
- **Colour:** headings `foreground` (navy); body `text-storefront` or `text-secondary`; captions `muted-foreground`. Never grey text on a grey ground below 4.5:1.
- **Weights in use:** 400 body, 500 UI emphasis and buttons, 600 small headings, 700 headings and prices, 800 display only. 300 and below are not loaded.
- **Truncation:** product names clamp to 2 lines; everything else wraps. Never truncate money, units or times.

### 3.4 Money and the ₦ glyph

- `₦` + grouped digits: **₦4,850**, **₦1,250,000**. Kobo only where the value is not whole (ledger, statements): **₦12,345.50**.
- Unit follows in `caption`: **₦4,850** / bag. Money in tables is right-aligned in `figure`. Money in cards and rows is `price*`, tabular.
- **The ₦ sits in Google's `latin-ext` subset (U+20A0–20AB), not `latin`.** Load both subsets for the sans face; the browser fetches `latin-ext` only because ₦ is on every page, so budget for it. **Verify before shipping** that Plus Jakarta Sans actually draws `₦` (U+20A6) with both crossbars intact. If it does not, add a `unicode-range: U+20A6` fallback face from the mono or system font. A missing or drawn-over naira sign is a trust bug.
- Savings: `cyan-text` figure plus label. Before award: "Estimated saving ₦…" (the word *Estimated* visible). After award: "Verified saving ₦…" with a check icon. Never a negative saving — show "No saving on this line".

---

## 4. Colour

The palette is unchanged. v3.0 only *tightens how it is used*.

| Role | Token | Rule |
| --- | --- | --- |
| Ground | `background` | Behind all Aisle and Control-room content |
| Content surface | `card` (white) | Cards, header, tab bar. No border on storefront cards — tone separates them |
| Navy block | `navy` + `navy-raised` | Showroom hero, footer, sidebars, spotlight panels. Text `on-navy`; secondary `on-navy-muted`; dividers `on-navy-line` |
| Spend | `cta` / `cta-hover` | Add to cart, Buy now, Checkout, Pay, Search, **Join pool** is the exception below |
| Pool & Save | `cyan`, `pale-blue`, `cyan-text` | Pool tags, pool panels, savings figures, the countdown. Cyan on **navy** (5.9:1) or navy on cyan; never white on cyan (2.8:1) |
| Structure | `navy` | Text, workspace primary buttons, sidebars |
| Decoration | `orange`, `orange-soft` | Wordmark, badges, icons — never text or large fills |

**Join pool button:** it commits the buyer to buy at the pool outcome, so it is a spending action. In the *Showroom* hero and pool module it uses `cta`. Inside the product page's Pool panel (where the choice is Pool vs Buy Direct side by side) it uses the `pool` button (pale-blue fill, cyan-text label) so the two options read as different decisions. One rule, two contexts: *where Buy Direct is not on screen, Join pool is the spend action.*

**Gradients:** none, except a single linear scrim (navy → transparent) over photography to keep text at ≥ 4.5:1. No glows, no glass, no coloured shadows.

---

## 5. Layout system

### 5.1 Grid and container

- 12 columns. Gutters 16 / 24 / 32px (phone / tablet / desktop); outer margins 16 / 32 / 48px.
- Content container **1280px**; Showroom may use **1440px** and full-bleed media; prose **720px**.
- Everything aligns to the grid. Hero text starts on column 1; the live pool module spans columns 1–12; product rails bleed to the right edge on phones (peek the next card).
- Test at **360, 390, 768, 1024, 1280, 1536**.

### 5.2 Breakpoints

| Name | Width | Behaviour |
| --- | --- | --- |
| phone | < 768 | Tab bar visible, search on its own row, rails scroll, one-column forms |
| tablet | 768–1023 | Compact header (search row below), 2-col forms, tab bar hidden |
| desktop | 1024–1279 | Full header with inline search, utility strip |
| wide | ≥ 1280 | 1280 container; Showroom may widen to 1440 |

### 5.3 Spacing and rhythm

- 4px base; components use 4–24; **sections use rhythm tokens**, not ad-hoc padding.
- Rhythm (phone → desktop): `tight` 32 → 48, `default` 48 → 80, `loose` 72 → 120.
- Gap between a heading and its content: 16px (phone) / 24px (desktop). Gap between sibling cards: 8–12px on the ground.
- A section is separated from the next by **rhythm + tone change**, not by a rule.

### 5.4 Page anatomy — Home (Showroom)

1. **Header** (64px / 56px, white, sticky, hairline shadow): mark + wordmark · search pill · Account · Cart. Utility strip (desktop): Sell on BuildersPool · Help.
2. **Hero** — full-bleed navy, 560–640px tall on desktop, ≤ 70svh on phones. Left: label eyebrow, `display-xl` headline, `body-lg` support line, **one** `cta` button + one text link. Right/behind: a single real photograph (Ushafa depot or a delivery at a site). No tiles beside it.
3. **Live pool band** — directly under the hero, overlapping its bottom edge by 48px: the pool module (§6.1). This is the first thing a scrolling visitor sees.
4. **How Pool & Save works** — four numbered steps in one row, each a `heading-sm` + `body-sm`, with a single illustration or cropped photo per step. `loose` rhythm.
5. **Today's pool** rail, then **Lowest prices** rail — only products with real photographs.
6. **Proof strip** — verified suppliers, paid after delivery, delivery code, disputes: four short statements in one row, no icons larger than 20px.
7. **Ushafa + suppliers** — two panels: collect free (photo), sell to Abuja's builders.
8. **Categories** — photographic tiles (4:3), never abstract icons.
9. **Footer** — navy.

A Showroom page has at most **seven** blocks. If a block is not moving a buyer toward joining a pool or buying, it goes.

---

## 6. Components

### 6.1 Pool module (signature component)

The most important component on the platform. It shows the **live state of today's cycle**.

- **Anatomy:** eyebrow (`label`, cyan-text) · stage sentence (`body`) · countdown (`figure-xl`, tabular, navy) · primary action · stage timeline (three equal steps).
- **States:** `open` (counting to pool close) · `bidding` · `evaluating` · `awarded` · `no-winner` · `closed-for-day` (counting to tomorrow). Each state has its own sentence and its own primary action; none is a blank.
- **Timeline:** active step on `navy` with white text; completed steps at 60% opacity with a check; upcoming steps on white. `aria-current="step"` on the active one.
- **Clock:** Africa/Lagos (WAT, UTC+1, no DST). The countdown starts after hydration; before that it renders a fixed-width placeholder (`--:--:--`) so layout never shifts. Digits update without animation.
- **Data contract (design requirement):** stage times come from configuration, not from hard-coded copy. The component must never print "12:00 / 16:00 / 17:00" from a string literal; it renders whatever the cycle config says.
- **Never shows** a participant count, a price, or a saving that the system does not hold. When live pool data exists, add: builders joined, your quantity, price to beat, estimated saving range (always labelled *Estimated*).

### 6.2 Buttons

| Variant | Look | Use |
| --- | --- | --- |
| **CTA** | `cta` fill, white 500 text | Spend: Add to cart, Buy now, Checkout, Pay, Search, Join pool (see §4) |
| **CTA outline** | white fill, 1.5px `cta` border, `cta` text; fills on hover | Add to cart on cards, so a rail of cards is quiet |
| **Pool** | `pale-blue` fill, `cyan-text` label | Join pool beside a Buy Direct option |
| **Primary** | `navy` fill, white text | Seller Centre, Admin, forms |
| **Secondary** | `surface` fill, navy text | Alternatives next to a primary |
| **Ghost** | transparent, navy text | Toolbars, icon actions |
| **Link** | `cyan-text` or `orange-text`, underline on hover | Inline navigation |
| **Destructive** | `error` fill, white text | Cancel, reject, delete — always confirms |

Sizes: **sm 36 · md 44 · lg 52** (heights). Buttons that spend money or join a pool are **lg on phones**, full width. Radius `control` (6px). Disabled 45% opacity, no shadow. Loading shows an in-button spinner and keeps its width. One `cta` per viewport region.

### 6.3 Product card

- White, `card` radius, 8px padding, **no border**, no shadow at rest; hover (pointer only) lifts to `raised`.
- 1:1 photograph on `surface`, `object-fit: cover`, explicit dimensions. **A card without a photograph is not eligible for Showroom rails** and falls back to a neutral "Photo coming soon" tile in the Aisle only.
- Pool tag top-left: cyan fill, navy `micro` text. Category label is *not* on the image.
- Name `body-sm` (2-line clamp) · price `price` + unit `caption` · seller count in `cyan-text` when real.
- One action: **CTA outline** "Add to cart" (adds one). Quantity is edited in the cart or on the product page.
- Rail card widths: 176 / 200 / 224px (phone / tablet / desktop); the next card always peeks.

### 6.4 Price block

`price-lg` or `price` · unit in `caption` beside it · below: a single `caption` line for delivery or pool context. A struck-through price appears only when a verified comparison exists. The ₦ must render with both bars (see §3.4).

### 6.5 Offer row (product page)

Seller (verified mark + name) · landed price for the buyer's zone (`price-sm`) · delivery note · select. Best offer: `pale-blue` row, "Best offer" `label`, left rule `cyan`. Ranked by landed price. Competitor bids are never shown (blind bidding).

### 6.6 Hero and showroom panels

Radius `panel` (12px) or full-bleed with no radius. Navy ground, `on-navy` text. Photography carries a navy scrim only where text sits on it. One `cta` + one text link. No more than 14 words in the headline, 22 in the support line.

### 6.7 Navigation

- **Header:** mark + wordmark · search pill (44px, 17px text) · Account · Cart (count bubble `cta`, `micro`). On phones: search on its own row, no utility strip.
- **Category strip:** text only, `body-sm` 500, active underline `cta` 2px; no icons (icons return only when they are real, custom and consistent).
- **Phone tab bar** (< 768px): Home · Catalogue · Pool & Save · Cart · Account. A Pool & Save tab ships when a buyer-facing pool page exists. Active tab `orange-text`, label `micro`; respects the safe-area inset.
- **Footer:** navy; Buy · Sell · Contact columns; company line.

### 6.8 Forms

- Inputs 44px, `control` radius, **`input-border`** (3:1) boundary, `cyan-text` 2px focus outline + `focus` ring. Labels above (`body-sm` 500); helper `caption`; errors `error` text with icon below the field. Naira inputs show a fixed ₦ prefix.
- Validate on blur, not on every keystroke. Never clear a field on error. Autofill and numeric keyboards (`inputmode`) set correctly.
- One column on phones. Group related fields; one primary action; secondary action is a ghost or link, never a second filled button.

### 6.9 Tables (Control room)

White `card-alt` panel, hairline row rules, no zebra, `body-sm`, sticky header in `muted`. Money right-aligned in `figure`. Status as badge **with a word**. Row actions: ghost buttons, 36px minimum on desktop, 44px on touch. On phones, tables become stacked label–value cards.

### 6.10 Badges and status

Pill, `caption`/`label`, soft-tint fill + coloured text + 1px tinted border + a word. Success → `success`; warning → `warning-text` on `warning-soft`; error → `error`; pool → `cyan-text` on `pale-blue`. **TEST tag:** `warning-text` fill, white 12px bold uppercase "TEST", visible without scrolling on every simulated payment, receipt and ledger line.

### 6.11 Feedback and states

- **Loading:** skeletons that match final layout (no layout shift); spinners only inside buttons. 
- **Empty:** one illustration or photo crop, one sentence, one action.
- **Error:** what happened · what to do · a retry. Never "Something went wrong" alone.
- **Offline / slow:** keep the last good data on screen with a quiet "Updating…" `caption`.
- **Toasts:** bottom-centre on phones, top-right on desktop; 4s, dismissible, never the only record of an action.

---

## 7. Motion

Motion explains cause and effect. It is never decoration, and it never delays a task.

| Moment | Duration | Easing | What moves |
| --- | --- | --- | --- |
| Press / hover feedback | `instant`–`fast` | `standard` | opacity, 1px translate |
| Menus, popovers, sheets | `base` | `emphasised` in, `exit` out | opacity + 8px translate |
| Scroll reveal (Showroom only) | `base` | `emphasised` | opacity + 24px translate, **once**, 80ms stagger, max 4 items |
| Hero entrance | `slow` | `emphasised` | headline, then support line, then CTA (60ms apart) |
| Countdown digits | none | — | digits swap instantly |
| Page change | `fast` cross-fade | `standard` | View Transitions API where supported |

Rules: animate `transform` and `opacity` only; never `width`, `height`, `top`, `left`, blur or filter; nothing loops except a spinner; **under `prefers-reduced-motion: reduce` everything is instant** and reveals are replaced by static content; nothing animates content that is needed to read the page before it finishes.

---

## 8. Imagery

- **Real photography only.** Nigerian sites, materials, trucks, the Ushafa Fulfilment Centre, people receiving goods. No foreign stock, no illustrations of construction, no clip art, no hard hats as decoration.
- **No photo, no slot.** If a product or section has no photograph, it does not appear in Showroom positions.
- **Shot list (priority order):** 1) Ushafa depot exterior and interior, wide; 2) cement pallets, close, label legible; 3) rebar bundle, strapped; 4) a delivery arriving at a site; 5) hands receiving goods and confirming a delivery code; 6) blocks stacked, raw; 7) roofing sheets; 8) tiles, in daylight.
- **Aspect ratios:** hero 16:9 (desktop) and 4:5 (phone) as two crops; cards 1:1; category tiles 4:3; panels 3:2.
- **Technical:** AVIF with WebP fallback, `srcset` at 480 / 768 / 1280 / 1920, explicit `width`/`height`, `loading="lazy"` except the hero (`fetchpriority="high"`), hero ≤ 160 KB, card ≤ 40 KB, LQIP or `surface` placeholder.
- **Treatment:** natural colour, no filters. A navy scrim only behind text. Alt text: what is shown + the key spec.
- **Icons:** one library (Phosphor, Regular, 1.5px optical stroke; Fill for the active state). 16px in buttons, 20px in lists, 24px in navigation. Icons never replace a label for a non-universal concept.

---

## 9. Control rooms (Seller Centre, Admin, Hub, Dispatch)

- Navy sidebar (collapses to a sheet on phones), content on `background`, panels `card-alt`. Primary actions `navy`; **never** mix navy and orange primaries in one form.
- Type tier: `heading-lg/md`, `body-sm`, `figure` for every number. Stat tiles use `figure-lg` with a `label` caption and a delta that always includes a word (*up*, *down*).
- Hub and Dispatch: 52px actions, step-by-step scan and photo proof, readable outdoors. Admin destructive actions require a reason field and write an audit entry.
- Bids and competitor data are confidential and never rendered to other sellers.

---

## 10. Voice and copy

- Plain English with builders' terms: *bags, tonnes, trips, lengths, pieces, site, yard*.
- Headlines state the outcome, not the mechanism ("Build smarter. Save more."). Support lines state the mechanism in one sentence.
- Verbs on buttons: "Join today's pool", "Add to cart", "Place order". No "Submit", no "Click here".
- Never promise a saving before award. Never print a number the system cannot back. Cycle times, percentages and shares are read from configuration, not typed into copy.
- Times in Lagos time ("Pool closes 12:00 today").
- **Contact:** +234 805 420 7559 · info@builderspool.net · WhatsApp +234 805 420 7559 · Ushafa Fulfilment Centre, Bwari Area Council, Mon–Sat 8am–6pm · Builders' Pool Technologies Ltd, RC 9317391.

---

## 11. Brand

- Full logo: login, splash, footer, print. Mark: header (40px desktop / 32px phone), app icon, favicon. Wordmark in text: **BUILDERS** `logo-gray` + **POOL** `orange`, Plus Jakarta Sans 800, tracking −0.03em; on navy, **BUILDERS** is white.
- Clear space ≥ the height of the "B" counter. Never recolour, outline, stretch, or place on orange or busy photography.
- **The ownable idea:** the live pool. The countdown, the three-stage timeline and the cyan-on-navy pairing are the visual signature; they appear on the home page, the product page, the phone tab bar and the share image — and nowhere else in cyan.

---

## 12. Accessibility

Target **WCAG 2.2 AA**, with AAA for body text where the palette allows (navy on white is 16.5:1).

### Corrections to v2.0 (measured)

| Pair | v2.0 use | Ratio | v3.0 fix |
| --- | --- | --- | --- |
| `cyan-strong` text on white | "when it must carry text on white" | 4.1:1 ✗ | Large text and icons only; use `cyan-text` (7.0:1) for any-size text |
| `warning` text on `warning-soft` | warning badges | 3.9:1 ✗ | `warning-text #8A5200` (5.8:1) |
| White on `warning` fill | TEST tag | 4.2:1 ✗ | `warning-text` fill (6.4:1) |
| `border` / `border-strong` on white as an input boundary | all inputs | 1.4–1.8:1 ✗ (needs 3:1) | `input-border #7C8BA0` (3.5:1) |
| White on `cyan` | forbidden in v2.0 but used in step numbers | 2.8:1 ✗ | `cyan-text` fill, white text (7.0:1) |
| `cta` text on white (outline button) | n/a | 4.51:1 ✓ (barely) | Keep, but do not use for text under 14px |
| `muted-foreground` on `background` | captions | 4.8:1 ✓ | Keep; never lighter |

### Requirements

- Text ≥ 4.5:1; large text, icons, control boundaries ≥ 3:1. New colour pairs are checked before use and added to a contrast table in the repo.
- Targets ≥ 44 × 44px with ≥ 8px between neighbours.
- Visible focus on every control (`focus` ring + 2px `cyan-text` outline); focus is never hidden behind the sticky header (`scroll-padding-top`).
- One `h1` per page; heading levels never skip; landmarks (`header`, `nav`, `main`, `footer`) present; skip-to-content link.
- Status never by colour alone. Live regions: the pool countdown is **not** announced every second — announce stage changes only (`aria-live="polite"` on the stage sentence, `aria-live="off"` on the digits).
- Forms: labels, programmatic errors, `autocomplete` and `inputmode` set. Images have meaningful alt. Respect `prefers-reduced-motion` and forced-colours.
- Zoom to 200% and 400% reflow with no horizontal scroll (except tables and code).

---

## 13. Implementation notes

**Fonts (`next/font`):**

```ts
import { Plus_Jakarta_Sans, Geist_Mono } from 'next/font/google';

export const sans = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'], // ₦ (U+20A6) lives in latin-ext
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});
export const mono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500'],
});
```

**Tokens:** the front matter maps one-to-one onto the Tailwind v4 `@theme` block in `app/globals.css`. Existing token names (`brand`, `ink`, `slate`, `surface`, `cta`, `cyan-*`, `pale-blue`) are kept so screens adopt the palette without edits. New tokens: `warning-text`, `input-border`, `navy-raised`, `on-navy*`, and the type tokens as `text-display-xl` … `text-micro`, `text-figure*`, `text-price*`.

**Migration order** (each step ships on its own and is verified before the next):

1. Fonts, type scale and the contrast corrections (global, low risk).
2. Layout shell: container, grid, header, rhythm tokens, tab bar.
3. Home (Showroom): hero, live pool band, steps, rails, proof strip, panels.
4. Aisle: catalogue, product, cart, checkout, orders.
5. Control rooms: sidebars, tables, stat tiles.
6. Motion and imagery pass (needs the photography shot list delivered).

---

## 14. Acceptance checklist (per screen, before it ships)

- [ ] **Five-second test:** a new viewer can say what the page is, what is happening now, and the one next action.
- [ ] One primary action per viewport; one display line per viewport.
- [ ] Only scale tokens used; no raw font sizes; no more than two weights per card.
- [ ] Tone separates sections; no decorative borders or shadows at rest.
- [ ] Every colour pair on the page appears in the contrast table and passes.
- [ ] All six states exist: loading, empty, error, offline, partial, success.
- [ ] No placeholder imagery in a Showroom slot; every image has dimensions and alt.
- [ ] No number on the page that the system cannot back; no cycle time typed into copy.
- [ ] LCP ≤ 2.5s, CLS ≤ 0.05, INP ≤ 200ms on the throttled-Android profile; JS and hero budgets met.
- [ ] axe-core: zero serious or critical violations; keyboard-only run-through completes the primary task.
- [ ] Tested at 360, 390, 768, 1024, 1280, 1536; no horizontal scroll at any width.
- [ ] `prefers-reduced-motion` and 200% zoom checked.

---

## 15. Do / Don't

**Do:** one message per screen · big type, quiet chrome · real photography · the live pool clock · tonal layering · tabular figures · `cta` for spending only · cyan for pooling and savings only · measure everything.

**Don't:** put tiles beside a hero · repeat the same content twice on a screen · invent numbers or participants · use placeholder images in prominent slots · mix three typefaces · animate anything but transform and opacity · put white text on cyan or logo orange · use a decorative border as a control boundary · ship a screen with fewer than six designed states.
