# Builders Pool — Next.js reference implementation

> **Status (2026-11-06): reference implementation, feature-frozen.**
> The product direction is the Floot build at <https://builderspool.floot.app>. This repository
> is no longer where new product features are built. It stays alive for three reasons only.

## What this repo is for

1. **Source of truth for the proven engine rules.** The cycle stage machine (compare-and-swap
   stages), eligibility and scoring with reason codes, the award lifecycle (accept, decline,
   one-pass cascade, refund due), the append-only integer-kobo ledger, the money switches, and
   the auth and audit rules were built and tested here. When Floot and this code disagree, the
   decisions table in [`docs/floot-port-notes.md`](docs/floot-port-notes.md) says which wins
   and why. Port from here; do not re-invent.
2. **A comparison and QA surface.** <https://builderspool.vercel.app> stays deployed so Floot's
   behaviour can be checked against a working implementation, using the twelve acceptance
   scenarios in the port notes.
3. **The design system's reference build.** [`DESIGN.md`](DESIGN.md) (v3.0) was applied here end
   to end, so it shows what the spec looks like in code.

## What this repo is not for

- New features, new pages, or new business rules. Those go into Floot.
- Real customers or real money. Paystack runs in **test mode**, the money switches default to
  **off**, and no live payment keys should be added here.
- A second source of product copy. The storefront text here follows the engine's real flow
  (catalogue price now, blind bids, 50% of any verified saving to the savings wallet), which
  differs from Floot's in places. Do not copy it back to Floot without checking the port notes.

## What changes are still accepted

- Security fixes and data-integrity fixes.
- Bug fixes that make the reference behave the way its own spec says.
- Updates to the port notes or `DESIGN.md` when Floot's decisions change them.

## When this repo is retired

Archive it (read-only, with this README pointing to Floot) once Floot passes the twelve
acceptance scenarios in `docs/floot-port-notes.md` and the founder confirms the decisions
table is settled. Until then, keep it deployed and frozen.

## Stack

Next.js 16 (App Router), React 19, Prisma, Supabase Postgres, Tailwind CSS v4 with shadcn/ui,
deployed on Vercel. Read `node_modules/next/dist/docs/` before changing framework behaviour:
this Next.js version has breaking changes.

## Running it locally

```bash
npm install            # also runs prisma generate
npm run dev            # http://localhost:3000 (or the next free port)
npm run lint
npm run build
```

`DATABASE_URL` in `.env` points at the shared Supabase database. Local development and the
Vercel deployment use the same data, so treat local writes as production writes.

Create or reset an admin account (you will be prompted for the password; it is never echoed or
stored in the repo):

```bash
npm run create-admin -- <email> "<Display name>"            # new admin
npm run create-admin -- <email> "<Display name>" --reset-password
```

## Where things are

| Path | What lives there |
| --- | --- |
| `app/(shop)` | Storefront: home, catalogue, product, cart, checkout, orders, account |
| `app/seller`, `app/admin` | Seller Centre and Ops admin (the control rooms) |
| `lib/bidding` | Cycle schedule, join, tick, scoring, award, fallback, refund |
| `lib/ledger.ts` | Append-only money ledger (idempotent by `entryKey`) |
| `lib/settings` | Admin-editable settings (cycle times, scoring weights, money switches) |
| `docs/floot-port-notes.md` | Decisions, rules to port, acceptance scenarios, testing lessons |
| `DESIGN.md` | Design system v3.0 |
| `BUILDERSPOOL_PROJECT_BRIEF.md` | Original project brief |
