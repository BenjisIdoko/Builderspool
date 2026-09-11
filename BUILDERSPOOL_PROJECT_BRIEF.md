# Builders Pool — Project Brief & Build Log

This document exists to carry full context from planning into the actual build — read this first before making architectural changes, so decisions already reasoned through don't get silently re-litigated.

## What This Is

A marketplace platform for construction materials (cement, blocks, rebar, roofing, fittings) in the Nigerian market. This is a **rebuild** of an existing live site, builderspool.com.ng, which currently runs a fund-pooling/bulk-procurement model (buyers join a pool, contribute funds, admin procures in bulk). The rebuild replaces that with a **reverse-auction demand-pooling model**, styled as an Amazon/Jumia-like ecommerce experience.

## Core Business Model

- Buyers browse a catalog and check out at a **fixed price, immediately** — like any normal ecommerce site.
- Behind the scenes, demand pools daily until a cutoff time, then sellers submit **blind bids** to supply that pooled demand.
- **Bidding is invisible to the buyer at all times.** This was confirmed repeatedly and explicitly as non-negotiable — no bidding language, no countdown timers, no visible seller identities anywhere in the buyer app, even though a business partner's developer brief proposed a customer-visible "Collaborate & Save" dual-mode UX. That proposal was rejected for the buyer experience; only its backend bidding sophistication was adopted (see below).
- Builders Pool absorbs the margin variance between the listed catalog price and the actual winning bid — **monetization is margin-based**, not commission-based.
- **Buyers and sellers never interact or see each other's identity.** Builders Pool mediates all delivery communication itself.
- Sourcing model: **REGIONAL** pooling (materials only available from certain locations) and **NATIONAL** pooling (materials sourceable anywhere) both exist side by side.

## Fulfillment

- Builders Pool operates **fulfillment centers**.
- At checkout, buyers choose **PICKUP** (bring their own truck to a center) or **DELIVERY** (to their construction site, cost calculated at checkout).
- Every order routes through a fulfillment center regardless of method — delivery just adds a final hop from center to site.
- **GRN (Goods Received Note)** concept, borrowed from the partner's brief: a center confirming a seller's drop-off is the trigger point for seller payout. Modeled as `Allocation.receivedAt`.

## Payment

- MVP uses **direct payment gateway capture** — no escrow, no wallet, for now.
- Existing partnership with **e-Transact**, planned partnership with **Flutterwave**.
- A buyer wallet with escrow-held funds was designed (hold at checkout → capture on delivery confirmation, or refund on dispute/cancellation) but **deferred post-MVP**. Worth revisiting once it's confirmed whether e-Transact/Flutterwave's infrastructure supports an authorize-then-capture flow natively — if so, the wallet becomes a thin ledger over their custody rather than something Builders Pool holds itself.

## Tech Stack

**Current (custom stack, decided after moving off WordPress):**
- **Next.js** (App Router) — intended as one codebase serving the buyer app, seller portal, and admin dashboard via role-gated routing
- **PostgreSQL** via Neon or Supabase
- **Prisma** ORM
- **Tailwind CSS**, with **shadcn/ui** as the intended component library
- Deployed on **Vercel**

**Superseded plan** (built out in detail before the pivot, kept here for reference only): WordPress + FluentCart + Bricks Builder + ACF + a custom PHP bidding plugin + a React seller portal + extended WP-Admin. Abandoned once it became clear the developer's skillset spans both WordPress and a Next.js/Vercel + AI-assisted coding workflow equally well (two live platforms already shipped that way: cngconnect.com, ttcushafa.vercel.app) — so the WordPress-for-speed argument no longer held a decisive advantage.

## Design Direction

- **Typeface**: Plus Jakarta Sans, 16px/1rem base.
- **Target feel**: mature B2B SaaS — closer to Stripe, Linear, or Mercury than a consumer marketplace. Clean, mature, professional, minimal, with subtle gradients used functionally, not decoratively. The hero section is the one deliberate exception to "restraint" — big, bold (font-bold, not just semibold) headline type and a subtle radial gradient backdrop, so the storefront doesn't read as flat/sterile.
- **Explicitly avoid** ("AI slop" tells): identical rounded cards with the same soft grey shadow on every one, ALL-CAPS eyebrow labels, decorative gradients with no function, warm-cream-background-plus-serif-font combos, decorative numbered markers.
- **Use instead**: hairline borders over shadows, sentence case everywhere, one confident accent color used sparingly, generous whitespace, restraint over decoration.
- **Established color tokens** (refined 2026-09-11 against a Stitch-generated reference design, see below): off-white canvas `#FAFAFB`, near-black ink `#0F172A`, blue brand `#0F62FE`, slate secondary text `#475569`, muted text `#64748B`, hairline border `#E2E8F0`, strong hairline border (inputs, hover) `#CBD5E1`, well/muted background `#F1F3F5`, plus semantic status colors success `#059669` / warning `#D97706` / danger `#DC2626`.
- **Shape**: buttons and badges are fully pill-shaped (`rounded-full`, not token-driven — see 2026-09-11 update below); inputs/selects use `--radius-md` (10px); cards/containers/modals use `--radius-lg`/`--radius-xl` (14px/20px). Superseded the original Stitch spec's tight 4px controls per explicit user preference for a softer, rounder feel.
- **Primary button color**: brand blue (`--primary: var(--color-brand)`), not ink — explicit user preference, applies everywhere via the single token (no component hardcodes a button color directly).
- **Logo**: reuse the existing mark — blue gradient "B" monogram with a building-skyline icon and a wave swoosh, grey wordmark. Evolve, don't replace.
- Reference HTML mockups were built for home/catalog, listing, and checkout screens establishing this token system — useful as a visual anchor when building the real Next.js/Tailwind/shadcn pages.

### Stitch reference design import (2026-09-11)

The user supplied a Stitch-generated design export (`stitch_builders_pool_buyer_app.zip`) covering home, category listing, product detail, cart, checkout, order confirmation, order tracking, and account settings — plus a `DESIGN.md` design system doc (the refined color/type/radius values above come from it) and real product photography (cement pallet, rebar bundle, CMU block pallet).

**Two things this import could not be taken at face value:**
1. **The home and category-listing screens surfaced pooling directly to the buyer** — a live "Active Corridor" pool-capacity widget with a countdown ("Next Flatbed Pool closing in 3hrs 42mins") and a "Flatbed Freight Pool Active — Claim Freight Slot" banner. Both were dropped entirely rather than adapted — they contradict this doc's own firm, repeatedly-confirmed rule that bidding/pooling stays invisible to the buyer.
2. **Most of the mockups describe a much larger enterprise product than what's built**: reviews/Q&A, ASTM certification tables, Net-30 trade credit, PO/job-cost codes, GPS driver telemetry, "frequently bought together" bundling, multi-facet filters (steel grade, bar size, sourcing origin). None of that exists in this schema. The visual language (typography, color, card/spacing system, hero treatment) was adopted; the content was rebuilt against only the real fields this app actually has, not fabricated.

**What was applied**: full re-skin of home, catalog, product detail, cart, and checkout against the refined tokens above, plus a genuinely new order confirmation page at `app/(shop)/orders/[id]/page.tsx` (real order data — items, fulfillment center, status — not a mockup). Header gained a real (wired, not decorative) search box backed by a `name: { contains }` query in `lib/queries/materials.ts`. Product cards gained a quantity stepper before "Add to cart," matching the reference pattern and matching how bulk-material buyers actually shop.

**Product photography**: cropped from the Stitch screenshots (`sips --cropOffset`) into `public/materials/{cement,blocks,rebar}.jpg` and wired to the matching materials via `Material.imageUrl`. No source photo existed for Fittings or Roofing — those categories still render the category-icon placeholder (`components/material-image.tsx`) rather than a fabricated stock photo. `prisma/seed.ts`'s `seedMaterials()` now backfills `imageUrl` onto already-existing rows (previously pure skip-if-exists), so re-running the seed stays safe to use for future asset additions too.

**Deferred, not built**: order tracking history (needs order-status-over-time, which the schema doesn't track distinctly from the single `status` field) and account/job-site settings (needs buyer auth, which doesn't exist — see TODOs).

### Rounded shape language + typography scale (2026-09-11, later same day)

Two follow-up preferences on top of the Stitch import, both applied globally via tokens/vendored `components/ui/*` files rather than per-page overrides:

- **Buttons and badges are now fully pill-shaped** (`rounded-full` in `components/ui/button.tsx` and `badge.tsx`), replacing the Stitch spec's tight 4px control radius — explicit user preference, inspired by `https://ttcushafa.vercel.app` (a reference the user pointed to; see typography note below). The `--radius-sm/md/lg/xl` scale in `app/globals.css` also softened (10px/14px/20px+ instead of the original tight-industrial 4px/8px) so cards/inputs don't look mismatched next to fully-rounded buttons. Composed controls (the quantity stepper's `rounded-l-none`/`rounded-r-none` pair) still work correctly against a `rounded-full` base — verified in-browser via computed `border-radius`.
- **Typography weight scale adopted from the Church HR Manager project** (`/Users/apple/Desktop/Church HR Manager/src/styles/globals.css` and `tailwind.config.cjs` — the `ttcushafa.vercel.app` reference above is that project's deployment). That project's base `text-*` size scale turned out to already match Tailwind's own defaults exactly (nothing to port there), but its semantic heading rule was worth adopting: h1 = extrabold + tight tracking (true display/hero text only), h2 = bold (page-level headings), h3-equivalent card/section labels = semibold. Encoded as base-layer `h1`/`h2` defaults in `app/globals.css`, and applied explicitly to every page's heading `className` (base-layer element rules don't override utility classes already setting a weight, so each page's h1/h2 usage was updated directly — home hero to `font-extrabold`, all page-level h1s — catalog, cart, checkout, order confirmation, seller portal — to `font-bold`, card/section-label h2s left at the `font-semibold` they already had). Body `line-height` bumped to 1.6 to match that project's reading rhythm too.

## Bidding Engine Design

- **Weighted award scoring**, not simple lowest-price-wins: Price 40%, seller reliability/trust score 25%, capacity fit 20%, delivery speed 15%.
- **Geography is a hard eligibility filter, not a scored dimension** — a seller who doesn't serve a regional cycle's region is excluded before scoring runs at all, not merely penalized in the score. (This was a refinement made during implementation — hard constraints belong as filters, soft tradeoffs as weighted scores.)
- **Full or split awards** — one cycle's demand can be split across multiple ranked sellers if the top bid alone can't cover it.
- **Backup-supplier fallback cascade** — if an awarded seller fails to fulfill, the shortfall cascades to the next-ranked un-awarded bid. If bids are exhausted, it's flagged for manual ops handling — there's no automated final fallback yet (no backup-supplier relationship modeled).
- **Daily cutoff**: currently hardcoded at 6pm (`CUTOFF_HOUR` constant in `lib/bidding/cycleWindow.ts`), easy to change.
- **An order only joins a bid cycle's demand pool once payment is confirmed** (via webhook) — never at checkout submission. This prevents abandoned or failed payments from inflating demand pools.

## Data Model

Full detail in `schema.prisma`. Key entities and why they're shaped this way:

- **User** (`role`: BUYER / SELLER / ADMIN)
- **SellerProfile** — `regionsServed`, `trustScore` (feeds the reliability scoring weight)
- **FulfillmentCenter**
- **Material** — `catalogPrice` is the buyer-facing fixed price; `sourcingScope` is REGIONAL or NATIONAL
- **BidCycle** — one per material, per region (null = national), per day; `status`: OPEN / CLOSED / AWARDED
- **Bid** — `unitPrice`, `quantityOffered`, `estimatedDeliveryDays`, `score`/`rank` (filled in at award time), `status`
- **Allocation** — the award record; supports split awards (multiple allocations per bid cycle) and the fallback cascade (a failed allocation's quantity becomes a new allocation against the next bid); `receivedAt` is the GRN trigger
- **Order** — the buyer's checkout transaction; `region` is persisted here specifically so bid-cycle assignment can read it back after payment confirms
- **OrderItem** — `priceLocked` at checkout time is what guarantees the fixed-price promise holds regardless of what the eventual winning bid comes in at; each item can independently join a different bid cycle and route to a different fulfillment center

## What's Been Built So Far

1. **`schema.prisma`** — full data model. `npx prisma validate` and `npx prisma generate` both run clean against the real client (v6.4.0).
2. **Bidding engine** (`lib/bidding/`):
   - `scoring.ts` — weighted scoring + hard eligibility filtering
   - `award.ts` — full/split award engine, distributes awarded quantity across real fulfillment-center demand
   - `fallback.ts` — cascades a failed allocation to the next-ranked bid
   - `cycleWindow.ts` — daily cutoff window calculation
   - `joinCycle.ts` — assigns a paid order item to its bid cycle (creating the cycle if it doesn't exist yet)
   - `app/api/cron/close-cycles/route.ts` — Vercel Cron entry point that finds due cycles and closes them
3. **Checkout flow** (`lib/checkout/`):
   - `createOrder.ts` — validates the cart, locks prices, creates `Order`/`OrderItem` rows in `PENDING` payment state
   - `deliveryCost.ts` — flat-rate delivery pricing by region (placeholder for a future distance-based calculation)
   - `findServingCenter.ts` — routes an order to a fulfillment center by region
   - `app/api/checkout/route.ts` — checkout API route
   - `app/api/webhooks/payment/route.ts` — payment confirmation webhook
4. **Buyer UI** — home, catalog (with category filter), material detail, cart, and a checkout shell, built against the Design Direction tokens (off-white canvas, near-black ink, blue accent, hairline borders, Plus Jakarta Sans) rather than from separate static mockups — those still don't exist (see TODOs). Cart state lives in `localStorage` (`lib/cart/CartContext.tsx`) since there's no buyer auth yet; checkout attaches every order to a single seeded demo buyer (`lib/demoBuyer.ts` / `prisma/seed.ts`) for the same reason — swap both for real accounts once auth exists. Buyer-facing queries (`lib/queries/materials.ts`) deliberately select only buyer-safe fields — `sourcingScope`, bid cycles, and anything else that would leak the pooling/bidding mechanism are excluded at the query layer, not just hidden in the UI. Buyer routes now live under `app/(shop)/` (a route group) so the buyer chrome (cart, catalog nav) doesn't leak into the seller portal, which has its own header. Walked the full golden path in-browser (browse → filter → add to cart → checkout → order created in `PENDING_PAYMENT`) against the live database; `npm run lint`, `npx tsc --noEmit`, and `npx next build` all pass clean.
5. **Seller portal** (`app/seller/`) — open-cycle listing with an inline bid form (submit/update in place, one active bid per seller per cycle), a bid history page with withdraw, and an allocations page with pickup/drop-off instructions (the fulfillment center each allocation's order item routes to). Blind bidding is enforced the same way buyer invisibility is — `lib/queries/sellerPortal.ts` never returns competitor bids or buyer identity, only the seller's own bid and the cycle's aggregated demand; geography eligibility reuses `lib/bidding/scoring.ts`'s `isSellerEligible` so a seller never sees a cycle they're excluded from anyway. No seller auth exists either — `lib/seller/session.ts` is a plain cookie set by picking one of the seeded sellers at `/seller/login`, gated by `app/seller/(dashboard)/layout.tsx`; same TODO-and-replace-later pattern as the buyer side. **Building this surfaced a real bug**: `createOrder.ts` only resolved a fulfillment center for `DELIVERY` orders, leaving `PICKUP` orders with none — contradicts this doc's own Fulfillment section ("every order routes through a fulfillment center regardless of method"). Fixed to always resolve one. Walked the full loop in-browser and via the live database: seeded a demo order → simulated payment confirmation (`joinCycleForOrderItem`, the real function, not a DB hack) → signed into the seller portal → submitted a bid → ran `awardCycle` → confirmed the allocation and its real pickup address rendered correctly. `lint`, `tsc`, and `build` all pass clean.
6. **shadcn/ui** — installed for real (`npx shadcn@latest init -b radix -p nova`; Radix primitives, Nova preset) and wired to the brand tokens rather than left on its own default neutral palette. This required resolving two silent naming collisions between shadcn's own semantic token names and tokens this project had already defined under the same names:
   - `--color-accent` — this project's brand blue (used via `text-accent`/`bg-accent` for links, the logo tile) collided with shadcn's own `accent`/`accent-foreground` (a neutral hover/highlight pair used inside its components). **Renamed the brand token to `--color-brand`** (`bg-brand`, `text-brand`, `text-brand-ink`) everywhere it was used, leaving `accent` for shadcn's own convention.
   - `--color-muted` — this project's secondary/de-emphasized text tone collided with shadcn's `muted`/`muted-foreground` pair (a light-background + text-on-it pair; `muted` alone means *background*, not text, in shadcn's convention). **Renamed the raw brand value to `--color-muted-text`** and pointed every `text-muted` call site at shadcn's own `text-muted-foreground` instead of inventing a third name — since that's exactly the semantic slot shadcn already has for it. `bg-muted` now correctly renders shadcn's intended near-white background wash instead of accidentally painting this project's darker text-gray as a background fill (visibly broke `CardFooter`/`Table` row backgrounds before this fix — worth remembering if a future token add produces an unexpectedly dark "subtle" background again).
   - Also patched `components/ui/card.tsx` post-install: its default `ring-1 ring-foreground/10` (a shadow-family treatment) and `rounded-xl` corners were overridden to `border border-border` and `rounded-lg` — matching this doc's explicit "hairline borders over shadows" rule and the corner radius every hand-rolled card in this app already used, rather than let the vendored default silently diverge from the rest of the UI.
   - Installed components: `button`, `input`, `label`, `select`, `badge`, `card`, `table`. Migrated the majority of the buyer and seller UI onto them (buttons, the checkout region `Select`, the seller bid form's `Input`/`Label`, status `Badge`s, the seller allocation `Card`s, the seller bids `Table`) — this was a real adoption pass, not just scaffolding left unused. `MaterialCard` uses `Card`/`CardContent`/`CardFooter`. A handful of plain text links (e.g. "Back to catalog") were deliberately left as plain `<Link>` — not every navigational link needs to be a `Button`.

`npx tsc --noEmit` and `npx next build` both pass clean against the real generated Prisma client — all three API routes (`checkout`, `webhooks/payment`, `cron/close-cycles`) compile and register correctly.

## Explicit TODOs / Open Seams

These are deliberate, clearly-marked placeholders — not oversights:

- [ ] `initiatePayment()` in `app/api/checkout/route.ts` throws a TODO — wire in the real Paystack/Flutterwave/e-Transact initialization call
- [ ] `verifySignature()` in `app/api/webhooks/payment/route.ts` throws a TODO — wire in real gateway-specific signature verification (Paystack: HMAC-SHA512 header; Flutterwave: verif-hash)
- [x] Run `npx prisma migrate dev --name init` against the real Supabase database — applied 2026-09-11. Note: `db.<ref>.supabase.co` (the "direct connection" host) is IPv6-only and unreachable from networks without IPv6 egress; `DATABASE_URL` now points at Supabase's session pooler (`aws-1-eu-west-1.pooler.supabase.com:5432`) instead, which is IPv4-reachable and is also the recommended host for serverless/Vercel deployments anyway.
- [x] Seed `Material` data — 10 materials in `prisma/seed.ts` spanning all five categories named in this brief (Cement, Blocks, Rebar, Roofing, Fittings), split between `NATIONAL` and `REGIONAL` sourcing scope so both pooling models have real catalog rows to check out against. Applied 2026-09-11.
- [ ] Build the design mockups (home/catalog, listing, checkout) that establish the Design Direction token system — still don't exist as separate artifacts; the buyer UI was built directly against the tokens instead (see "What's Been Built" above)
- [x] Install and adopt shadcn/ui — applied 2026-09-11 (see "What's Been Built" above for the token-collision fixes this required). `dropdown-menu`, `dialog`, `alert`, `tabs`, `textarea`, `checkbox`, and `avatar` aren't installed yet — add them as the admin dashboard and real-auth work need them, rather than installing everything speculatively now
- [ ] Build real buyer accounts/auth — checkout currently attaches every order to one seeded demo buyer (`lib/demoBuyer.ts`); replace that lookup and move the cart from `localStorage` to a real per-account store once auth exists
- [x] Add product images — applied 2026-09-11. Cement, Blocks, and Rebar have real photos (cropped from the Stitch reference screenshots, see above); Fittings and Roofing still have none (no source photo existed) and render the category-icon placeholder instead — add real photography for those two categories when available
- [ ] Build order tracking history — needs order-status-over-time, which `Order.status` alone doesn't capture; deferred during the Stitch design import (2026-09-11)
- [ ] Build account/job-site settings — needs buyer auth, which doesn't exist yet; deferred during the Stitch design import (2026-09-11), same blocker as the demo-buyer TODO above
- [x] Build the seller portal (bid submission UI, pickup instructions) — `app/seller/`, applied 2026-09-11. Uses a seeded-account cookie session (`lib/seller/session.ts`), same TODO-and-replace pattern as the buyer side — build real seller auth here too, eventually.
- [ ] Build real seller auth — `/seller/login` currently just lets you pick any seeded seller account with no credential check; replace `lib/seller/session.ts`'s cookie-only session
- [ ] Build the admin dashboard (materials, bid cycles, fulfillment centers, disputes)
- [ ] Upgrade delivery cost from flat-rate to distance-based once volume justifies the API cost
- [ ] `fallback.ts`'s exhausted-cascade case still only logs to console — no ops-facing flag/notification yet (unlike `award.ts`'s `needsAttention` field, which is now real)
- [x] Seed `FulfillmentCenter` and `SellerProfile` data — `prisma/seed.ts` (run via `npx prisma db seed`), applied 2026-09-11. 3 fulfillment centers (Abuja/Lagos/Kano, matching the flat-rate regions in `lib/checkout/deliveryCost.ts`) and 4 sellers spanning a deliberate trust-score/region spread (one national high-trust, two regional mid-trust, one newly onboarded low-trust) so the award engine's scoring and geography filter both have real data to operate on. Idempotent — safe to re-run.

## Deferred / Explicitly Post-MVP

- **Wallet + escrow system** — design was sketched (`Wallet`/`WalletTransaction` tables, hold-at-checkout → capture-on-delivery-confirmation or refund-on-dispute). Revisit once e-Transact/Flutterwave's authorize-then-capture support is confirmed.
- **The partner's fuller "ten-layer procurement OS" vision** — construction intelligence/price-index engine, project/BOQ cost-management tools, equipment rental/labor marketplace/financing ecosystem expansion, a formal append-only audit ledger with compliance-officer governance. Only the bidding engine's award sophistication (weighted scoring, split awards, fallback cascade) was adopted from that document — the rest is intentionally out of scope for now, not forgotten.
- **Five fulfillment routes** from the partner's brief — only two are built (pickup, delivery-via-center). The schema doesn't yet have a `fulfillmentRoute` field, but adding one later is a low-cost extension, not a rebuild.

## Key Decisions Worth Remembering If Revisited

- Buyer-side bidding invisibility is a firm product requirement, confirmed multiple times — don't reintroduce visible pooling/countdown UI without an explicit decision to change it.
- The custom Next.js stack was chosen once the developer's skillset was clarified to span both WordPress and Next.js/Vercel equally — it wasn't a rejection of WordPress on technical merits alone.
- Geography-as-eligibility-filter (rather than geography-as-scored-weight) is a considered improvement made during implementation, not an oversight if it looks different from earlier planning conversations.
