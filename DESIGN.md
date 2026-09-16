# Builders Pool — Design System

This is a **reverse-documented** design spec: every value below is pulled directly from the live
codebase (`app/globals.css`, `components/ui/*`, and the pages that use them), not invented for this
file. Use it to rebuild or extend the UI in Figma, Sketch, Google Stitch, or Fable with pixel-accurate
tokens — if a design tool produces something that doesn't match a value here, the code is the source of
truth, not this document.

Stack: Next.js 16 (App Router) · Tailwind CSS v4 (CSS-first `@theme`) · shadcn/ui (Radix primitives) ·
Phosphor Icons · Plus Jakarta Sans.

---

## 1. Design philosophy

Three rules govern every screen in this app, in priority order:

1. **Hairline borders over shadows.** No `box-shadow`, no `ring` on static surfaces. Every card, table,
   input, and dialog is separated from its background with a single `1px` `border-border` line. This was
   an explicit, repeated correction during development — shadcn's default `Card` ships with
   `ring-1 ring-foreground/10`; it was patched out (see `components/ui/card.tsx`). Treat any shadow on a
   static (non-hover, non-modal-overlay) element as a bug — **with one narrow, deliberate exception**: the
   buyer homepage's hero card, trust badges, and category tiles use a single, very subtle shadow value
   (`shadow-[0_1px_2px_rgba(16,24,40,0.04)]` for cards; the hero itself additionally gets
   `shadow-[0_32px_64px_-12px_rgba(41,84,229,0.35),0_8px_24px_rgba(15,23,42,0.12)]`), adopted from the
   Fable design handoff for buyer-marketing surfaces only. Don't extend this to admin/seller tables,
   dialogs, or routine controls — it's scoped to `app/(shop)/page.tsx`'s marketing sections, not a change
   to the base rule.
2. **Real data only.** Nothing in this app shows a number, chip, or chart it can't honestly derive from
   stored data. There is no fabricated "+12% vs last week," no placeholder avatar photo, no invented
   delivery ETA. When a value truly isn't known yet, the UI says so explicitly (an empty state, a "verify
   live" note, a "needs review" flag) rather than inventing something plausible-looking.
3. **Dense, restrained, "engineered B2B."** Closer to Stripe/Linear/Mercury than a consumer storefront.
   Generous but not loose spacing, small type at high information density in tables/dashboards, color
   used functionally (status, brand actions) rather than decoratively.

---

## 2. Color tokens

All colors are CSS custom properties defined once in `app/globals.css` under `:root`, then re-exposed to
Tailwind via `@theme inline` so they're usable as utilities (`bg-ink`, `text-brand`, `border-border`,
etc.). There is no dark mode yet — every screen is light-only.

### Core palette

| Token | Hex | Utility | Usage |
|---|---|---|---|
| `--color-canvas` | `#fafafa` | `bg-canvas` | Fallback flat background color |
| `--gradient-canvas` | `linear-gradient(180deg, #eef3fd 0%, #f6f8fc 45%, #fafbfc 100%)` | applied to `<body>` | **The actual sitewide background** — a soft blue-to-neutral wash, not a flat color. Fixed attachment. |
| `--color-surface` | `#ffffff` | `bg-surface` | Cards, headers, sidebars, table backgrounds — anything that sits "on top of" the canvas |
| `--color-well` | `#f1f3f5` | `bg-well` | Inactive table headers, input backdrops, inset/recessed blocks — one step darker than surface |
| `--color-ink` | `#15181c` | `text-ink`, `bg-ink` | Primary text; also the "active/selected" solid-fill color for pills and filters |
| `--color-slate` | `#5b6068` | `text-slate` | Secondary headings, icon-adjacent labels |
| `--color-muted-text` | `#8a8f97` | `text-muted-foreground` | Tertiary text, captions, placeholder-adjacent copy |
| `--color-border` | `#e6e7ea` | `border-border` | The one hairline border color used everywhere |
| `--color-border-strong` | `#c2cad3` | `border-input` (via `--input`) | Input/select boundaries, active tab underlines, hover states |

### Brand

| Token | Hex | Usage |
|---|---|---|
| `--color-brand` | `#2954e5` | Primary buttons, links, active nav states, focus ring (`--ring`). The one confident accent color — used functionally, never decoratively. |
| `--color-brand-ink` | `#ffffff` | Text/icon color on top of a brand-filled surface |
| `--color-brand-deep` | `#3730a3` | Mid-stop of the signature gradient (steel blue → indigo) |
| `--color-brand-warm` | `#ea580c` | Construction-amber counterpoint. Reserved for a **small number of high-impact spots only** — hero, headline accent, one stat card. Never on routine controls, never as a status color. |

The signature gradient (`brand` → `brand-deep` → `brand-warm`) appears in exactly one place: the
storefront homepage hero. Don't reuse it as a generic decorative background elsewhere.

### Status (4-category pill system)

One shared system (`lib/statusColors.ts`) maps every real status enum in the app — `OrderStatus`,
`CycleStatus`, `BidStatus`, `AllocationStatus`, `PayoutStatus`, plus derived fulfillment-stage strings —
onto four tones. Every status anywhere in the app uses one of these four; nothing invents a fifth.

| Tone | Text | Soft background | Meaning |
|---|---|---|---|
| `success` | `#2e6b45` | `#eaf3ec` | Paid, filled, delivered, confirmed-good |
| `warning` | `#8a5a20` | `#fbf1e4` | Pending, awaiting action, needs attention |
| `danger` | `#a0432c` | `#f7e9e6` | Cancelled, rejected, on hold |
| `info` | same as `--color-brand` | `#e9edfb` | Neutral-active, in-progress, informational |
| `neutral` | `--color-slate` | transparent, `border-border` outline | Default/unclassified |

Rendering rule: **light background + saturated text, never a solid fill**, via `Badge variant="outline"`
plus the tone's soft-background class (`pillClass(tone)` in `lib/statusColors.ts`). A status pill is
never a solid-colored chip with white text — that's reserved for the "active filter" pattern (see §5).

---

## 3. Typography

**Single typeface: Plus Jakarta Sans**, loaded via `next/font/google` in `app/layout.tsx`, applied
globally as `font-sans`. There is deliberately no second/monospace typeface anywhere — an earlier pass
added JetBrains Mono for prices/quantities/IDs and it was fully removed; don't reintroduce a numeric
monospace face without an explicit decision to do so.

- **Base size is fluid**: `clamp(1rem, 0.9561rem + 0.1876vw, 1.125rem)` on `<html>` — 16px on narrow
  viewports scaling up to 18px on wide ones. Every `rem`-based size in the app scales with this.
- **Body line-height**: `1.6` (relaxed, for reading comfort in descriptions/paragraphs).
- **Every heading is bold (700)** — no medium-weight headings anywhere.
  - `h1`: bold + tight tracking (`tracking-tight`). The homepage hero `h1` additionally goes
    `font-extrabold` (800) at a large explicit size — the one deliberate exception to the shared `h1` rule.
  - `h2`: bold + `letter-spacing: -0.025em`.
  - `h3` and below aren't used yet in this app — if you add one, keep it bold, matching the pattern.
- **Section eyebrows / overline labels**: `text-xs font-bold tracking-wide text-slate uppercase` (e.g.
  "QUICK STATS", "ALL ORDERS · 9 MATCHING" on admin pages).
- **Page kicker**: `text-xs text-muted-foreground` above an `h1` (e.g. "Admin · ops desk").

---

## 4. Spacing, radius, layout grid

- **Radius scale**: `--radius-sm: 0.375rem` (6px) · `--radius-md: 0.5rem` (8px, inputs/selects) ·
  `--radius-lg: 0.875rem` (14px, cards/containers) · `--radius-xl: 1.25rem` (20px, large panels).
  **Buttons and badges are always fully pill-shaped** (`rounded-full`) regardless of this scale — that's
  a separate, deliberate rule, not token-driven.
- **Page container**: `mx-auto w-full max-w-6xl px-6 py-10` — the standard wrapper for every
  buyer/seller/admin content page. Detail/edit pages that don't need a wide table narrow this to
  `max-w-3xl` (e.g. the material edit form).
- **Card padding**: `p-6` for a standalone content card, `p-4`–`p-5` for a denser KPI/stat card.
- **Table row height**: `py-3` per cell (not the shadcn default `py-2`) — deliberately slightly taller
  for readability at this app's data density.

---

## 5. Core components

All components live in `components/ui/` (shadcn-installed, then patched to match this system) or
`components/` (hand-built, following the same rules). Install additional shadcn components the same
way: `npx shadcn@latest add <name>`, then strip any shadow/ring and confirm radius matches §4.

### Button (`components/ui/button.tsx`)
- Always `rounded-full`, bold text, no shadow.
- Variants: `default` (brand-filled, white text — primary actions), `outline` (bordered, transparent —
  secondary actions), `secondary`, `ghost` (icon-only rows, kebab triggers), `destructive` (soft-red fill,
  red text — never a solid red button), `link`.
- Sizes: `default` (h-8), `sm` (h-7), `lg` (h-9), plus square icon variants `icon` / `icon-sm` / `icon-xs`
  / `icon-lg` for icon-only buttons (kebab menus, close buttons).

### Input / Label / Select (`components/ui/input.tsx`, `label.tsx`, `select.tsx`)
- Inputs: `h-8`, `rounded-md`, `border-input` (the `--border-strong` token), transparent background,
  focus ring in brand color.
- Plain native `<select>` elements (styled to match `Input`) are used for simple in-page filters instead
  of the shadcn `Select` primitive where no rich popover behavior is needed — see any admin filter bar.

### Badge / status pill (`components/ui/badge.tsx` + `lib/statusColors.ts`)
- `variant="outline"` + a tone class from `pillClass()` is the standard status pill — see §2.
- A **solid** pill (`bg-ink text-canvas`) is reserved for the "currently active" state of a filter chip
  (e.g. the selected status tab on the Orders page) — visually distinct from a status badge on purpose,
  so users never confuse "this is the active filter" with "this row's status is X."

### Card (`components/ui/card.tsx`)
- `rounded-lg`, `border border-border`, `bg-card` (white), no shadow/ring. This is the patched version —
  never reintroduce the shadcn default's `ring-1 ring-foreground/10`.

### Table (`components/ui/table.tsx`)
- Full-bleed inside a `rounded-lg border border-border bg-surface` wrapper `div`, not bordered itself.
- Header row: `border-b`, muted/small text, often uppercase section label above it (not in the header
  row itself — see §3's "eyebrow" pattern).
- Row hover: subtle `bg-muted/50`.
- Sortable columns (introduced on the admin Orders table): each header is a `<Link>` toggling `asc`/`desc`
  via URL search params, with a `CaretUp`/`CaretDown`/`CaretUpDown` (unsorted) icon from Phosphor.

### Dialog (`components/ui/dialog.tsx`)
- Centered modal, `rounded-lg`, `border border-border`, **no shadow** (patched from the shadcn default),
  backdrop blur (`supports-backdrop-filter:backdrop-blur-xs`) over a light `bg-black/10` overlay.
- Used for: image lightboxes (PDP gallery zoom), and admin view/edit/delete flows (e.g. the catalogue
  reference library's per-row actions).

### Dropdown menu (`components/ui/dropdown-menu.tsx`)
- A local Radix wrapper (shadcn's own `dropdown-menu` isn't installed — this project uses the `radix-ui`
  umbrella package directly and re-skins it to match). `rounded-md border border-border bg-popover`, no
  shadow, `DotsThreeVerticalIcon` kebab trigger. Used for per-row actions in tables (e.g. admin Orders'
  "View details / Copy order ID" menu) in place of a bare text link once a row has more than one action.

### Avatar (`components/avatar.tsx`)
- **Initials-only, always** — `bg-brand text-brand-ink`, a circle sized by the `className` prop. There is
  no photo upload anywhere in this system, so a stock/placeholder photo would misrepresent a real person;
  don't add one without building real photo upload first.

### Tabs (`components/ui/tabs.tsx`)
- `variant="line"` — an underline-indicator tab style, not a boxed/pill tab style. Used on the PDP
  (Description / Details / Pricing & delivery) where content sections are mutually exclusive.

---

## 6. Icons

**Phosphor Icons exclusively**, imported from `@phosphor-icons/react/ssr` (the server-renderable variant
— always use the `Icon` suffix, e.g. `ReceiptIcon`, not the bare `Receipt`). Default weight (regular),
sized via `size-4`/`size-4.5`/`size-5` Tailwind utilities matching the surrounding text size. No other
icon set is used anywhere in the app.

---

## 7. Layout patterns by portal

### Buyer storefront (`app/(shop)/`)
- **Floating pill header** (`components/site-header.tsx`): NOT a full-width bar. Outer wrapper is
  `sticky top-4 px-4 sm:px-6`; inner bar is `rounded-full border border-border bg-surface/80
  backdrop-blur-md` — a rounded, blurred, inset "pill" that floats over the page content beneath it, with
  visible canvas gradient in the gutters around it. No shadow.
  - Contains: logo, nav links, `HeaderSearch` (icon-first expandable search — see below), cart icon,
    account `Avatar`.
- **Search** (`components/header-search.tsx`): starts as a bare magnifying-glass icon; click expands it
  into a bounded input inline in the header (not a full-width takeover), submits to `/catalog?q=...`.
  Built this way specifically to avoid an earlier regression where a permanent search field broke the
  header layout at 1024px — any change to this component must be checked at 1024px before shipping.
- **Hero**: real photo + the brand gradient (§2) as a duotone overlay, not the flat/textured version some
  reference designs use.
- No sidebar on the buyer side at any viewport — navigation is entirely in the floating header, with a
  slide-over `Sheet`-based mobile menu below the header's own breakpoint.

### Seller & Admin portals (`app/seller/`, `app/admin/`)
- **Fixed left sidebar** (`components/seller/seller-sidebar.tsx`, `components/admin/admin-sidebar.tsx`):
  `hidden lg:flex`, `w-60`, `border-r border-border bg-surface`. Logo + product name at top, nav links
  grouped under uppercase section labels (`text-[10.5px] font-bold tracking-wide text-muted-foreground
  uppercase`, e.g. "Overview" / "Commerce" / "Account" — group by what the links are *for*, not one flat
  list) with active-state highlight (`bg-brand/10 text-brand` on the current route, via `usePathname()`),
  profile block + sign-out pinned to the bottom via `mt-auto`.
- **Mobile**: sidebar is replaced below `lg` by a `h-16` topbar (logo + `MobileNav` hamburger triggering a
  slide-over) — see `components/mobile-nav.tsx`'s `footer` prop for how sign-out surfaces in the mobile
  menu without duplicating the desktop sidebar's markup.
- **Top-right avatar bar** (admin only, added most recently): a slim `hidden lg:flex h-16 justify-end
  border-b border-border bg-surface` row above the page content, admin name + `Avatar` at the far right,
  persistent across every admin page. The mobile topbar carries the same `Avatar` at its right edge.
- **Page template** (list pages: Orders, Materials, Catalogue reference): kicker → `h1` → one-line
  description → optional KPI/quick-stats card row → filter bar (category/status pills + search, sortable
  table headers where applicable) → `Table` in a bordered `rounded-lg` wrapper → pagination footer.
- **Page template** (detail/edit pages): back-link → kicker → `h1` → grouped `border border-border
  rounded-lg p-6` sections, each with an uppercase eyebrow label, form fields inside → right-aligned
  Cancel/Save button row.

---

## 8. Interaction & state conventions

- **Loading**: real Next.js route-level `loading.tsx` skeletons that mirror the actual page's shape
  (KPI-card placeholders + table-row placeholders), not a generic spinner.
- **Error**: real route-level `error.tsx` boundaries with a specific, honest message (this app's most
  common real failure is a Postgres connection-pool exhaustion, so admin error copy says "usually a
  transient database connection issue" rather than a generic "something went wrong") plus a `reset()`
  retry button.
- **Empty states**: an icon (Phosphor, `size-8 text-muted-foreground`) + one sentence, inside the same
  bordered card treatment as a populated table would use — never a blank white area.
- **Long text**: table cells that can overflow (buyer names, fulfillment-stage labels) get an explicit
  `max-w-*` + `truncate`, with the full value in a `title` attribute — not a fixed-width clip with no
  fallback.
- **Destructive actions**: a confirm `Dialog` stating exactly what will happen and any real caveat (e.g.
  "this has no effect on the live buyer catalog — these are separate records"), never a bare browser
  `confirm()`.
- **Placeholder/incomplete data**: flagged explicitly and visibly (a `WarningIcon` + soft-warning-colored
  banner), never silently hidden or dressed up to look complete. Example: materials bulk-imported without
  a real researched price show an unmistakable ₦1 placeholder plus a "needs price review" banner — not a
  plausible-looking invented price.

---

## 9. What NOT to do

- Don't add a shadow to a static element. Ever. Borders only.
- Don't introduce a second typeface (display serif, monospace-for-numbers, etc.) without an explicit
  decision — both have been tried and reverted this project.
- Don't use `--color-brand-warm` (the amber) as a routine UI color — it's a hero/headline accent, not a
  warning color (that's `--color-warning`) or a secondary brand color.
- Don't invent a fifth status tone — every status fits success/warning/danger/info/neutral.
- Don't show a stock or placeholder photo for a person — use the initials `Avatar`.
- Don't build a table without a real empty state, and don't paginate/filter/sort a table without the
  filter state living in the URL (search params), so it's shareable and survives a refresh.
