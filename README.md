# Builders Pool

Collaborative procurement for construction materials in Abuja (FCT), Nigeria. Buyers either **Buy Direct** from a
seller's listing or choose **Pool & Save**: their order joins a pool, vendors bid for the combined order, and the buyer
keeps half of any verified saving. Live at <https://builderspool.vercel.app>.

> **Status (2026-11-06):** this repository is the product and where every build happens, with Claude Code.
> The founder first prototyped the idea on Floot. The team is **not using Floot any more**; it is kept only as a source
> of ideas and design patterns. Earlier notes calling this repo a "frozen reference" are obsolete.

## Where the rules live

| File | What it is |
| --- | --- |
| [`docs/floot-port-notes.md`](docs/floot-port-notes.md) | **The product rulebook.** The founder's own description of pooling and bidding (1b), the resolved rules (1c), the engine rules proven in earlier phases (section 2), service areas (2.11) and 26 acceptance scenarios (section 4). "Floot" in the name means the old prototype. |
| [`docs/user-journeys.md`](docs/user-journeys.md) | **User journey map.** What a buyer, a seller and the ops team each go through, stage by stage, a day-in-the-pool timeline, what the product promises versus what exists today, and the plan for the onboarding checklists. |
| [`DESIGN.md`](DESIGN.md) | Design system v3.0 (typography, layout, colour, motion, imagery, accessibility). |
| `BUILDERSPOOL_PROJECT_BRIEF.md` | Original project brief. |
| `docs/floot-prompts.md` | Obsolete: prompts written for a Floot handover. Kept for history. |

Where the code and the rulebook disagree, **the rulebook wins** and the code is changed. Pricing is owned by the business,
not by engineering.

## Working rules

- Money is whole kobo, the ledger is append-only and idempotent, and every money switch defaults to **off**. Paystack
  runs in **test mode** until the founder says otherwise.
- `DATABASE_URL` in `.env` points at one shared Supabase database, so a local write is a production write. The team
  chose to build on it (not on a separate development database), so these safeguards apply to every change:
  1. **Additive migrations only**: new tables, and new columns that are nullable or have a default. Never drop, rename
     or retype anything that holds data. Backfills are a separate, reviewed step.
  2. **Show the SQL first.** Generate it with `prisma migrate diff`, review it, and get the user's approval before
     `prisma migrate deploy`. Each migration folder carries a `rollback.sql` that Prisma does not run.
  3. **Test data is tagged and removed.** Nothing fake is left in the live database.
  4. **New code must tolerate the old database and the old code must tolerate the new one**, because deploys and
     migrations are not atomic.
- Read `node_modules/next/dist/docs/` before changing framework behaviour: this Next.js version has breaking changes.

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
