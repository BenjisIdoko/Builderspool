---
name: BuildersPool
version: 2.0
updated: 2026-11-05
owner: Builders' Pool Technologies Ltd (RC 9317391)
source_of_truth: Floot project "BuildersPool" — base.css, AppShell, ProductCard, Button, Badge
supersedes: static/__dev/design-principles.md (pre-November "site ledger" direction — no orange, Bricolage/IBM Plex)

colors:
  # Brand voice
  navy: "#0B1F3A"            # primary text, primary buttons, sidebar, chart series 1
  cyan: "#1BA6DE"            # Pool & Save signal, focus, info, savings
  cyan-strong: "#0F86B8"     # cyan when it must carry text on white
  cyan-text: "#0B5F86"       # cyan-family text on white/pale blue (seller counts, Pool CTA label)
  pale-blue: "#E6F4FB"       # Pool & Save panels, selected rows, secondary surfaces
  orange: "#F47B20"          # logo orange — badges, accents, decoration only
  orange-soft: "#FDEBDD"     # orange tint backgrounds
  cta: "#CC4E00"             # buy/search/checkout buttons (white text passes 4.5:1)
  cta-hover: "#B34400"
  orange-text: "#B34400"     # orange text, hover links, active tab
  logo-gray: "#3D4752"       # "BUILDERS" wordmark gray

  # Surfaces
  background: "#F1F1F2"      # page ground (Jumia-style light gray)
  card: "#FFFFFF"            # product cards, header, category row, tab bar
  card-alt: "#FBFCFD"        # form/dashboard cards
  surface: "#E9EEF4"
  muted: "#E4E9EF"
  popup: "#FFFFFF"

  # Text
  foreground: "#0B1F3A"
  text-storefront: "#282828" # storefront body/product names (Jumia neutral)
  text-secondary: "#545459"
  muted-foreground: "#5A6B80"
  placeholder: "#6B6B70"

  # Lines
  border: "#D5DDE6"
  border-strong: "#B7C3D0"
  hairline: "#E6E6E8"        # storefront header/category/tab-bar rules

  # Status (always paired with a text label)
  success: "#1F7A4D"
  success-soft: "#E3F3EA"
  warning: "#B26A00"         # also the TEST-mode tag
  warning-soft: "#FFF3DC"
  error: "#B42318"
  error-soft: "#FBE9E7"
  info: "#1BA6DE"

  charts: ["#0B1F3A", "#1BA6DE", "#7FC8EA", "#5A6B80", "#B7C3D0"]

typography:
  families:
    base: "Roboto, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif"
    display: "Poppins, Roboto, system-ui, sans-serif"
    mono: "'IBM Plex Mono', ui-monospace, Menlo, monospace"
  weights: { roboto: [400, 500, 700, 900], poppins: [600, 700, 800], plex-mono: [400, 500] }
  scale:
    wordmark:   { family: display, size: 26px, weight: 800, tracking: -0.02em, mobile: 20px }
    h1:         { family: display, size: 28px, weight: 700, line: 1.2, mobile: 22px }
    h2:         { family: display, size: 22px, weight: 700, line: 1.25, mobile: 18px }
    h3:         { family: base,    size: 18px, weight: 700, line: 1.3 }
    body:       { family: base,    size: 15px, weight: 400, line: 1.5 }
    body-sm:    { family: base,    size: 14px, weight: 400, line: 1.4 }
    product-name: { family: base,  size: 14px, weight: 400, line: 1.35, clamp: 2 }
    price:      { family: base,    size: 18px, weight: 700, numerals: tabular }
    caption:    { family: base,    size: 12px, weight: 400 }
    micro:      { family: base,    size: 11px, weight: 700 }   # tags, cart count, tab labels
    search:     { family: base,    size: 17px, weight: 400 }
    figures:    { family: mono,    numerals: tabular }          # order numbers, ledger, kobo-exact amounts

spacing: { 1: 4px, 2: 8px, 3: 12px, 4: 16px, 6: 24px, 8: 32px, 12: 48px, 16: 64px, 20: 80px }

radius: { sm: 4px, default: 6px, md: 8px, lg: 10px, full: 9999px }

elevation:
  shadow: "0 1px 2px rgba(11,31,58,0.06)"
  shadow-md: "0 2px 8px rgba(11,31,58,0.08)"
  shadow-lg: "0 12px 32px rgba(11,31,58,0.14)"
  card-hover: "0 4px 14px rgba(11,31,58,0.14)"
  focus: "0 0 0 3px rgba(27,166,222,0.35)"

motion: { fast: 120ms, normal: 200ms, slow: 320ms, easing: ease }

layout:
  content-max-width: 1200px
  topbar-height: 68px        # 56px on phones
  tap-target: 44px
  breakpoints: { phone: "≤900px", tablet: "≤1100px", desktop: ">1100px", min-test-width: 360px }

z-index: { header: 20, tab-bar: 30, overlay: 400, spotlight: 1000, critical: 2000 }
---

# BuildersPool Design System

BuildersPool is a construction-materials marketplace for Abuja with a built-in collaborative buying engine (Pool & Save). The interface follows **Jumia's marketplace layout and type feel** — light gray ground, white product cards, a big rounded search bar, a strong orange buy button — but wears **BuildersPool's own identity**: the navy and cyan of the logo's "B", the orange of "POOL", and the logo's charcoal wordmark.

Use this file as the brief for any screen, component, page, deck-to-web conversion or AI-generated UI for the platform. Token values above are the live values in the app's `base.css`; if the two ever disagree, update this file to match the app.

---

## 1. Design principles

1. **Shop like Jumia, trust like a bank.** The storefront should feel instantly familiar to Nigerian online shoppers; money screens (checkout, ledger, savings, payouts) should feel exact and calm.
2. **One colour, one job.**
   - **Orange (CTA)** = spend money or search: *Add to cart, Buy now, Checkout, Search*.
   - **Cyan / pale blue** = Pool & Save and savings: *Join pool, estimated/verified saving, pool status*.
   - **Navy** = the brand voice and everything structural: text, primary admin/seller buttons, sidebars.
   Never swap these roles. A Pool & Save action is never orange; a Buy Direct action is never cyan.
3. **Phone first, sun-readable.** Most users are on low-cost Android phones, often outdoors on site or in a market. Light mode only, high contrast, 44px touch targets, nothing that depends on hover.
4. **Information before decoration.** Dense, scannable catalogue rows and tables. No hazard stripes, stencil fonts, hard-hat clip art or "construction costume".
5. **Honest numbers.** Prices are exact, savings are labelled *Estimated* until a pool is awarded and *Verified* after, and test payments are impossible to mistake for real ones.
6. **Light on data.** Images lazy-load, video and audio never autoplay, pages target < 3 s on a throttled mobile connection.

---

## 2. Brand assets

| Asset | Use |
| --- | --- |
| Full logo (B monogram + BUILDERSPOOL wordmark) | Splash screen, login, footer, printed material, share images |
| Monogram mark (`/_cdn/static/bp-icon-512.png`) | Header (40px desktop / 32px phone, 6px radius), app icon, favicon |
| Wordmark in text | Header: **BUILDERS** in `logo-gray #3D4752` + **POOL** in `orange #F47B20`, Poppins 800 |

Rules: keep clear space of at least the height of the "B" counter around the full logo; never recolour, outline, stretch or place the logo on orange or busy photography; on navy, use the white-wordmark version.

---

## 3. Colour usage

| Role | Token | Do | Don't |
| --- | --- | --- | --- |
| Page ground | `background #F1F1F2` | Behind all storefront content | Use pure white as the page ground |
| Cards & bars | `card #FFFFFF` | Product cards, header, category strip, tab bar | Add borders to storefront product cards (the gray ground separates them) |
| Buy / search CTA | `cta #CC4E00` → hover `#B34400` | White text, bold | Use logo orange `#F47B20` behind white text (fails contrast) |
| Orange accent | `orange #F47B20`, `orange-soft` | Wordmark, promo badges, icons, discount flags | Body text, large fills |
| Orange text | `orange-text #B34400` | "Sell on BuildersPool" link, hover state of nav links, active phone tab | — |
| Pool & Save | `cyan #1BA6DE`, `pale-blue #E6F4FB`, `cyan-text #0B5F86` | Pool tag on cards (cyan fill + **navy** text), Join-pool button (pale-blue fill + cyan-text label), savings figures, pool panels | White text on `#1BA6DE` (fails 4.5:1) — use navy text or `cyan-strong` |
| Primary (workspaces) | `navy #0B1F3A` | Primary buttons in Seller Centre, Admin, Hub, Dispatch; sidebar | Mixing navy and orange primaries on the same form |
| Focus | `focus` ring (cyan 35%) | Every interactive element, keyboard and search focus | Removing outlines without a replacement |
| Status | success / warning / error + `-soft` | Soft-tint badge + coloured text + a word | Colour alone to signal state |

**Contrast minimums:** body text 4.5:1, large text and icons 3:1. The token pairs above are pre-checked; new pairs must be checked before use.

---

## 4. Typography

- **Roboto** is the workhorse for everything on the storefront and in workspaces (Jumia's feel: neutral, compact, very legible on Android).
- **Poppins** (600–800) is reserved for the wordmark, page titles, section headings on the home page and hero banners. Never for body text, buttons or tables.
- **IBM Plex Mono** with tabular numerals for order numbers, reference codes, ledger rows, kobo-exact amounts and admin data tables.
- Product names: 14px regular, clamped to 2 lines. Prices: 18px bold, tabular numerals, `#282828`.
- Sentence case for headings and buttons ("Add to cart", not "ADD TO CART"). Uppercase only for tiny eyebrow labels and the TEST tag.

### Money and quantities

- Always `₦` + grouped digits: **₦4,850**, **₦1,250,000**. Show kobo only where the value is not whole (ledger, statements): **₦12,345.50**.
- Unit follows price in caption style: **₦4,850** / bag.
- Right-align money in tables; use tabular numerals everywhere money appears.
- Savings: cyan-text figure + label. Before award: "Estimated saving ₦…" with the word *Estimated* visible. After award: "Verified saving ₦…" with a check icon.
- Never show a negative saving; show "No saving on this line" instead.

---

## 5. Layout & grid

- Max content width **1200px**, centred, 16px side padding (12px on phones).
- **Product grid:** 2 columns on phones, 3 at ~600px, 4 at ~900px, 5–6 on desktop; 8–12px gaps on the gray ground.
- **Breakpoints:** ≤ 900px is "phone" (tab bar appears, utility strip hides, search moves below the header); ≤ 1100px hides secondary header labels.
- Test every screen at **360px** wide.
- Workspaces (Seller Centre, Admin, Hub, Dispatch) use a navy sidebar on desktop that collapses to a sheet on phones; content sits on `background` with `card-alt` panels.

---

## 6. Storefront shell (Jumia-style)

From top to bottom:

1. **Utility strip** (desktop only, 40px, `#F1F1F2`, 13px): left — "Sell on BuildersPool" in orange-text with icon; right — Help, account links.
2. **Header** (sticky, white, 68px, 1px `hairline` bottom shadow): mark + wordmark · full-width **pill search** (`#F1F1F2` fill, search icon left, 44px input, 17px text, orange **Search** pill button on the right; focus = 2px inset cyan ring) · Account · Help · Cart icon with an orange count bubble (18px, 11px bold white).
3. **Category strip** (white, 50px, horizontally scrollable, no visible scrollbar): icon + category name, 15px; hover/active turns orange-text.
4. **Main**.
5. **Phone tab bar** (≤ 900px, fixed bottom, white, 5 equal tabs: Home · Categories · Pool & Save · Cart · Account; 11px labels; active tab orange-text bold; respects safe-area inset).
6. **Footer**: navy background, white/pale text, contact details (info@builderspool.net, +234 805 420 7559, Ushafa Fulfilment Centre, Mon–Sat 8am–6pm), CAC RC 9317391.

---

## 7. Components

### Buttons

| Variant | Look | Use |
| --- | --- | --- |
| **CTA** | `cta` fill, white bold text, 6–8px radius (pill in search) | Add to cart, Buy now, Checkout, Pay, Search |
| **Primary** | navy fill, white text, soft 1px shadow that grows on hover | Main action in Seller Centre / Admin / forms |
| **Pool** | `pale-blue` fill, `cyan-text` bold label | Join pool, View pool |
| **Outline** | white, 12% navy hairline | Secondary action beside a primary |
| **Secondary** | 6% navy tint, no border | Tertiary actions, filters |
| **Ghost** | transparent until hover | Icon actions, toolbars |
| **Destructive** | `error` fill, white | Cancel order, reject, delete — always with confirmation |
| **Link** | navy text, underline on hover | Inline navigation |

Sizes: **sm 32px · md 36px · lg 44px**. On phones, any button a buyer taps to spend money or join a pool is **lg (44px)** and usually full width. One CTA per view region. Disabled = 45% opacity, no shadow.

### Product card

White, 6px radius, 8px padding, no border; hover adds `card-hover` shadow (desktop only).
- Square thumbnail on `#F1F1F2`, 4px radius, image `object-fit: cover`, placeholder icon if missing.
- **Pool & Save tag** top-left: cyan fill, navy 11px bold text.
- Media chips bottom-left (video / audio available): navy 85% pill, white 11px.
- Name (14px, 2-line clamp) · price (18px bold) + unit (12px) · "N sellers" in cyan-text · delivery note in gray if the buyer's zone isn't served.
- Optional **Join pool** strip (40px, pale-blue, cyan-text bold).

### Product page

Gallery with zoom + video/audio (poster, tap to load) · title, brand, specs table from attributes · **offers list** — every seller's price ranked by landed price for the buyer's zone, best offer highlighted with a pale-blue row and "Best offer" label · quantity stepper respecting minimum order · CTA "Add to cart" (orange) and Pool panel (pale-blue box with pool status, closing time, estimated saving, "Join pool").

### Pool & Save panel

Pale-blue background, 8px radius, cyan 1px left rule or border. Contents: cycle status (Pooling → Bidding → Evaluating → Awarded), countdown to 17:00 close (Africa/Lagos), reference price, *Estimated* saving range, fallback choice. Buyers never see bids or supplier names before award.

### Badges & status

Pill shape, 14px medium (12px in dense tables), soft-tint background + coloured text + 1px tinted border. Always include the word.

| State family | Colour |
| --- | --- |
| Live, Paid, Delivered, Approved, Accepted | success |
| Pending QC, Under review, Awaiting dispatch, Expiring soon | warning |
| Rejected, Failed, Disputed, Cancelled, Suspended | error |
| Pooling, Bidding, Evaluating, Info | pale-blue / cyan-text |
| Draft, Inactive | outline (gray) |

**TEST tag:** amber (`warning` fill, white 11px bold uppercase "TEST"), shown on every simulated payment, receipt and ledger line. Must be visible without scrolling on payment screens.

### Forms

Use the kit components (Input, Select, Textarea, Checkbox, RadioGroup, Switch, DateField, FileDropzone) — never raw HTML inputs. Inputs are 36px (44px on phones for buyer flows), 6px radius, `border` hairline, cyan focus ring. Labels above fields, 14px medium; help text 12px muted; errors in `error` text below the field with an icon. Naira inputs show a fixed "₦" prefix.

### Tables (Seller Centre, Admin)

White card, hairline row rules, no zebra striping, 14px text, sticky header row in `muted`. Money right-aligned in mono tabular figures. On phones, tables become stacked cards with label–value pairs.

### Feedback

Toasts bottom-centre on phones, top-right on desktop; success/error/info variants with icon + text. Skeletons (muted shimmer) for loading lists; spinners only inside buttons. Empty states: icon, one sentence, one action.

### Media

Max 8 photos + 1 video + optional audio per listing. Thumbnails lazy-load; video/audio show a poster and a "Tap to play" control; nothing autoplays or preloads on cellular.

---

## 8. Workspaces

| Workspace | Primary colour | Notes |
| --- | --- | --- |
| Storefront & buyer account | Orange CTA, cyan for pools | Jumia layout above |
| Seller Centre | Navy primary | Navy sidebar; overview cards (sales, open orders, pending QC, low stock, open RFQs); bids are confidential — never show competitor data |
| Admin | Navy primary | Dense tables, audit-friendly; destructive actions need a reason field |
| Fulfilment Hub / Dispatch | Navy primary | Large 44px+ actions, scan/photo proof steps, readable on a phone in a yard |

---

## 9. Iconography & imagery

- Line icons (Lucide style), 1.5–2px stroke, 16px in buttons, 20–24px in navigation. Category icons from the shared category-icon map.
- Product photos on plain light backgrounds, no watermarks or phone numbers (QC rule).
- Marketing imagery: real Nigerian sites, materials and the Ushafa fulfilment centre; avoid stock photos of foreign construction scenes.

---

## 10. Accessibility checklist

- Text contrast ≥ 4.5:1 (check every new colour pair, especially anything on cyan or orange).
- Touch targets ≥ 44 × 44px; spacing between adjacent targets ≥ 8px.
- Visible focus on every control; keyboard-reachable dialogs and menus.
- Status never by colour alone; icons have text labels or `aria-label`.
- Forms announce errors; images have alt text (product name + key spec).
- Respect `prefers-reduced-motion`.

---

## 11. Voice & copy

Plain English with the terms builders use: *bags, tonnes, trips, lengths, pieces, site, yard*. Short, direct, friendly. Use "Pool & Save" and "Buy Direct" consistently. Never promise a saving before award. Times in Lagos time ("Pool closes 5:00 pm today").

---

## 12. Do / Don't summary

**Do:** gray ground with white cards · orange only for spending · cyan only for pooling and savings · navy for structure · ₦ with tabular numerals · 44px targets · TEST tags on simulated payments.

**Don't:** white text on cyan or logo orange · orange Pool buttons · dark mode · autoplay media · heavy shadows or bubbly radii above 10px (except pills) · construction-themed decoration.
