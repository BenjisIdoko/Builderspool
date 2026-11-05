# BuildersPool: port notes for the Floot build

Written 5 Nov 2026. Source: the Next.js repo (`BenjisIdoko/Builderspool`, Phases 1 and 2, commits `e33cf81` to `20987c3`) compared with `BuildersPool_Technical_Requirements.docx` v1.0, which describes the Floot app as built.

**Purpose.** Floot is now the product. The Next.js build solved some problems the Floot spec does not mention. This file lists them as rules and tests, so they can be checked in Floot (or pasted into it as prompts) without anyone reading the old code.

**How to use it.**
1. Settle the decisions in section 1 first. Several rules below depend on them.
2. For each item in section 2, either check that Floot already behaves this way (use the *Check* line) or paste the *Prompt* into Floot.
3. Run the acceptance scenarios in section 4 once everything is in.

Nothing here is a claim about Floot's internals. Where the Floot spec is silent, the item says "not stated in the spec", which means check it, not that it is missing.

---

## 1. Decisions to settle before porting

These are real differences between the two builds. The Transfer File (4 Nov) and the Floot spec (5 Nov) disagree, and only the founder can choose.

| Rule | Transfer File / Next.js build | Floot spec ("live app") | Why it matters |
|---|---|---|---|
| Scoring weights | 30/20/20/15/10/5 (price, performance, delivery, geography, responsiveness, reliability) | 60/20/15/5 | Changes who wins every pool. |
| Daily times (Lagos) | Pool closes 17:00; bidding to 18:00; award 18:00; unaccepted awards pass 19:00; fallback 19:50 | 12:00 / 16:00 / 17:00 | Sellers and buyers plan around these. |
| Split awards | Allowed (one line can go to several suppliers) | Not yet: one supplier takes a whole line | Affects cascade and partial fill. |
| Supplier cap | Setting, default 5 per category per zone | 5 per category per zone | Same default, check it is a setting. |
| If a winner declines | Passes **once** to the next-ranked eligible bids, who have until the fallback time. A second miss is final. | Re-awarded to the next-best eligible bid | Whether the cascade can loop. |
| If still uncovered | Units are marked unfilled, the buyer is **not charged**, a refund-due entry is posted. Nothing is bought from an unauthorised supplier. | "Buyers authorise any fallback purchase in advance" | Two different promises to the buyer. Pick one. |
| Buy Direct commission | 3% (setting) | 3% | Matches. |
| Savings split | 50/50 (setting) | 50/50 | Matches. |

Recommendation: keep every row above as an admin setting in Floot (the spec says all live settings are editable at Admin > Settings), so changing a choice later needs no code.

---

## 2. Rules to port or verify

Each item has the rule, the edge cases that cost time in the Next.js build, a *Check* (how to see whether Floot already does it) and a paste-ready *Prompt*.

### 2.1 Pool cycle stages must be safe to run twice

**Rule.** The cycle moves OPEN, then BIDDING, then CLOSED, then AWARDED. Every move is a guarded update: "set status to X **where status is currently Y**". If two runs overlap (the scheduled job, a page load, an admin button), only one of them changes anything.

**Edge cases.**
- Several things can advance the cycle: a scheduled job, a throttled nudge on page load, and admin buttons (Freeze now, Award now). All must go through the same function.
- A payment confirmed after the pool closes, or into a pool that is not open, joins **the next day's** cycle. It never joins a closed pool.
- Floot's job runs every 30 minutes, 06:00 to 22:00. That is fine as long as a stage that is already done does nothing, and the 17:00 to 19:50 boundaries are checked against the clock rather than assumed from the run time.

**Check.** Trigger the housekeeping job twice at once and press Award now during it. The pool must be awarded exactly once, with no duplicate awards.

**Prompt.** "Make every pool cycle status change a compare-and-swap: update the cycle only if its status is still the one we expect, and do nothing if it already moved. Route the scheduled job, admin buttons and any page-load nudge through one `advanceCycles` function that runs freeze, then award, then expire overdue awards, then fallback. A payment confirmed after pool close must join the next day's cycle."

### 2.2 Eligibility and scoring (settings driven, with reason codes)

**Rule.**
- Weights, the neutral score for new suppliers (and the order threshold that ends "new"), the supplier cap and the minimum eligible bids per line all come from admin settings.
- Settings are validated on save: weights must sum to 100 and the cycle times must be in order.
- A bid that is excluded gets a **reason code**, shown to admins on the cycle page: `NOT_APPROVED`, `OUTSIDE_SERVICE_AREA`, `INVALID_BID`, `OVER_WINNER_CAP`, `BELOW_MIN_BIDS`, plus later `AWARD_DECLINED`, `AWARD_EXPIRED`, `SELLER_SUSPENDED`.
- Ties break in this order: lowest price, then better performance, then earliest submission.
- Only sellers with **approved** KYC can see cycles or bid, and an unapproved or suspended seller's bid is dropped at award time even if it was placed earlier.
- Suppliers never see competitors' prices, identities, ranks or bid counts; buyers never see bids before the award.

**Known placeholders.** In the Next.js build the geography score is 100 if the seller serves the region, and responsiveness is 100 for every complete bid. Both were stand-ins until delivery zones and response data exist. If Floot has real zones, use them.

**Check.** Put an unapproved seller's bid in a cycle: it must be excluded with `NOT_APPROVED` and the admin page must say why. Make two bids tie on score and confirm the tie-break order.

**Prompt.** "Drive scoring from admin settings (weights summing to 100, neutral new-supplier score and threshold, winners cap, minimum eligible bids). Exclude ineligible bids with a stored reason code (NOT_APPROVED, OUTSIDE_SERVICE_AREA, INVALID_BID, OVER_WINNER_CAP, BELOW_MIN_BIDS) and show it on the admin cycle page. Break ties by price, then performance, then earliest submission. Unapproved or suspended sellers cannot see or win cycles."

### 2.3 Award acceptance, decline and one-pass cascade

**Rule.**
- An award starts PENDING. The seller accepts (CONFIRMED) or declines. Accepting is a guarded update, allowed only before the accept deadline, and only for a seller whose KYC is approved.
- A decline, a missed deadline, or the seller being **suspended** while the award waits releases the award: it becomes CANCELLED with the reason DECLINED, EXPIRED or SELLER_SUSPENDED.
- Releasing passes the quantity **once** to the next-ranked eligible bids. Eligible means approved, not already declined in this cycle, and within the winner cap. They get until the fallback time to accept.
- A passed award that is not accepted is final. It is not passed again.
- The release itself is a guarded update on "status is PENDING", so a decline, a timeout and a suspension arriving together release it only once.
- Receiving goods (GRN) needs an accepted award.
- Suspending a seller releases their **unaccepted** awards. Accepted ones are left for ops.

**Edge cases.** A bid whose award was released goes back to REJECTED (or PARTIALLY_FILLED if it still holds another award). A bid that picks up a pass moves to FILLED or PARTIALLY_FILLED and clears its earlier rejection reason.

**Check.** Seller A declines: B receives it. B ignores it past the deadline: it ends there, with no third award. Accept twice in a row: the second does nothing.

**Prompt.** "Add the award lifecycle: PENDING, then CONFIRMED on seller accept (only before the accept deadline, only for approved sellers) or CANCELLED with reason DECLINED, EXPIRED or SELLER_SUSPENDED. Releasing an award is a guarded update on status PENDING and passes the quantity once to the next-ranked eligible bids (approved, not already declined this cycle, within the winner cap) with the fallback time as their deadline. A second miss is final. Goods receipt requires an accepted award. Suspending a seller releases their pending awards."

### 2.4 Fallback: refund due, never a surprise purchase

**Rule.** At the fallback time, for each order line the units not covered by any accepted award are written to `unfilledQuantity`, and one refund-due ledger entry is posted for them. The buyer's order page says plainly that no supplier took those units, they were **not charged**, and a refund is due. This runs once per cycle (a guarded update on `fallbackProcessedAt`).

**Refund amount (whole kobo).**
`refund = priceLocked × unfilled + round(deliveryCost × unfilled ÷ quantity)`
That is the goods at the locked unit price plus the delivery charge in proportion to the unfilled share.

**Open choice.** The Floot spec says buyers authorise fallback purchases in advance. If you keep that, say so on the checkout and the order page, and make the authorisation an explicit, recorded buyer choice per line. Do not mix the two models.

**Check.** Award only part of a line, let the cycle pass its fallback time, run the job twice. One refund entry, correct amount, buyer message shown, no second entry.

**Prompt.** "At the cycle's fallback time, once only, record each order line's uncovered quantity as unfilled and post one BUYER_REFUND_DUE ledger entry for goods at the locked price plus delivery charge pro rata, rounded to whole kobo. Show the buyer 'No winning supplier for N of M units, not charged, refund due'. Never buy from a supplier the buyer did not authorise."

### 2.5 Append-only integer ledger with idempotent postings

The Floot spec already says money is whole kobo and financial records are append-only. These are the details that matter in practice.

- **Enforce append-only in the database**, not just in code. In the Next.js build a database trigger refuses UPDATE and DELETE on the ledger table. Corrections are new, opposite entries.
- **Every posting carries a unique `entryKey`** built from the business event (for example `refund-due:<orderItemId>`). Posting the same event twice must do nothing.
- **Post "insert, ignore if the key exists"** rather than "insert, catch the duplicate error". In Postgres, catching a unique-violation inside a transaction aborts the whole transaction. Use `ON CONFLICT DO NOTHING` semantics.
- **Post inside the same transaction as the event.** Goods receipt posts the seller payable and the savings split together with the receipt itself. A payout posts the settling negative.
- **Savings split:** by the settings percentage, with any odd kobo going to the buyer, so the two shares always sum exactly to the gross saving. Commission and savings share are separate lines.
- **Show the wallet as "savings credit"** and keep withdrawals off (see 2.6).

**Check.** Try to UPDATE and DELETE a ledger row directly in the database: both must fail. Post the same key twice: one row. Split an odd-kobo saving: shares add up exactly.

**Prompt.** "Make the ledger table append-only with a database trigger that rejects UPDATE and DELETE. Give every posting a unique entryKey derived from the business event and insert with ON CONFLICT DO NOTHING. Post goods-receipt entries (seller payable, buyer savings credit, platform savings share) in the same transaction as the receipt, splitting savings by the settings percentage with odd kobo to the buyer."

### 2.6 Money switches default off

`money.walletWithdrawalsEnabled` and `money.sellerPayoutsEnabled`, both off. When off, the server refuses the action **and** the UI hides the button and says why ("Withdrawals aren't available yet", "payouts switched off"). Refusing only in the UI is not enough.

The Floot spec says seller payouts are "not built" and disabled; confirm the server refuses a payout call regardless.

### 2.7 Authentication, sessions and access

- **Server-side sessions.** The cookie holds a random 256-bit token; only its SHA-256 hash is stored, with user, role and expiry. Cookies are httpOnly, sameSite=lax, Secure in production. Lifetimes in the Next.js build: buyer 7 days (30 with "remember me"), seller 7 days, admin 1 day.
- **Revocation.** Sign-out deletes the server row. A password reset revokes all of that user's sessions. A fresh token is issued on every sign-in.
- **Rate limit** on sign-in: 5 failed attempts per 15 minutes per identifier, then locked. (This caught the founder out once: a wrong password plus the lock looks like "can't access the admin page". Say how long the lock lasts on the sign-in screen.)
- **Admin accounts are a closed system.** No signup route. Admins are created or reset through a script or an existing admin, password minimum 12 characters, never shown.
- **Never trust ids from the browser.** An early bug let `POST /api/checkout` take `buyerId` from the request body, so anyone could order as any buyer. The server must take the buyer from the session only.
- **Validate order quantities on the server:** whole numbers 1 to 100,000 per line, no duplicate products in one order, and a database check constraint as a backstop. A negative quantity once reduced the amount charged.
- **Cron endpoint auth:** accept only `Authorization: Bearer <secret>` (never a query-string secret, it leaks into logs), compare with a constant-time function, and fail closed if no secret is set.
- Headers: no framing (`frame-ancestors 'none'`), `nosniff`, strict referrer policy, camera/microphone/geolocation/payment off.

**Check.** Send a forged cookie carrying a real user id: rejected. Place an order with a spoofed buyer id in the body: it is created for the signed-in buyer. Order -1 of anything: rejected.

### 2.8 Seller KYC

The Floot spec covers CAC certificate, director ID and proof of address, expiry flags 30 days ahead, and staff that cannot change bank details or terms. Also worth having, from the Next.js build:
- TIN, business address, bank name, 10-digit account number and account name, with an automatic match of the account name against the CAC-verified company name (falling back to the business name).
- **Versioned terms acceptance**: a table of who accepted which version; a re-accept banner when the version setting changes. The terms text itself still has to be written by the founder.
- **SUSPENDED status** with admin suspend and reactivate, a reason required. Approve and reject only act on a submission that is pending.
- **Registry check (MetaMap, Nigeria CAC lookup):** stores the verified company name, entity type, status and date, kept separate from the approval status as an aid to the human reviewer. If the seller changes the CAC number without re-verifying, clear the old result on submit so a "verified" badge can never describe a different number.
- **Flag a business-name mismatch** against the registry name for the reviewer (green, amber or red line).
- **Bank details:** open choice. Today an approved seller cannot edit them. Confirm that is wanted.
- Document links accepted only if `http` or `https`.

### 2.9 Audit log

Append-only, written for every admin mutation (KYC decisions, suspend or reactivate, awards, GRN, payouts, holds, price edits, settings, team changes) and seller owner actions. A failed audit write is logged but must not block the action. Store who, when, and before and after values.

### 2.10 Roles and staff

Six roles in the Floot spec match the Next.js build's: buyer, seller (owner and staff), admin, catalogue or QC officer, fulfilment operator, delivery partner. Details worth copying:
- Seller staff act on the owner's account (bids, orders, allocations) but are blocked from KYC, bank details, terms and the team page.
- A disabled account cannot sign in anywhere and its sessions are revoked.

---

## 3. Floot has these; the Next.js build does not (do not port back)

Last-mile delivery priced per km from the nearest centre, Hub and Dispatch screens, 4-digit proof-of-delivery codes (lock after 5 wrong tries), bulk upload from Excel templates, in-app notification bell for every event, a 30-minute housekeeping job, one order per seller with a 24-hour accept window, 30-minute stock hold during checkout, sitemap and share previews, 32 automated test files. The Floot spec's own open gaps (placeholder delivery zones, no partial refunds, search index needed past about 5,000 listings, no live truck tracking, independent security review before real money) stand.

---

## 4. Acceptance scenarios (run in Floot once ported)

1. **Idempotent stages.** Fire the housekeeping job twice at the same moment, and press Award now. The cycle is awarded once.
2. **Late payment.** Confirm a payment after pool close. The order joins tomorrow's cycle.
3. **Eligibility.** An unapproved seller's bid is excluded with `NOT_APPROVED`. A suspended seller sees no cycles.
4. **Blind bidding.** A seller cannot see another seller's price, rank or bid count. A buyer sees no bids before award.
5. **Decline cascade.** A declines, B receives the pass with the fallback time as deadline. B misses it: no third award.
6. **One-shot accept.** Accept the same award twice: second does nothing. Accept after the deadline: refused.
7. **Suspension.** Suspend a seller who holds one pending and one accepted award: only the pending one is released.
8. **Fallback.** Partial cover, pass the fallback time, run the job twice: one refund entry, correct kobo amount, buyer message shown.
9. **Ledger.** UPDATE or DELETE on a ledger row fails. Posting the same key twice makes one row. An odd-kobo saving splits exactly.
10. **Switches.** With withdrawals and payouts off, the server refuses both calls and the buttons are hidden.
11. **Security.** Forged cookie rejected, spoofed buyer id ignored, negative or duplicate quantities rejected, wrong cron secret rejected, sixth failed sign-in locked.
12. **Money check.** The trial balance still sums to zero after all of the above, and every captured payment reconciles to its ledger posting.

## 5. Lessons from testing (apply to Floot too)

- **Scope every test to rows the test created.** One Next.js test released a real demo award because it targeted a seller by role rather than by its own test data. It was restored, but it should not have been possible.
- **Never write test entries to the live ledger.** It is append-only, so a test entry is permanent. Test the ledger in a rolled-back transaction or a separate database.
- **Long multi-step database transactions can hit time limits.** The cascade needed a longer transaction timeout than the default. If Floot's functions time out mid-award, split the work or raise the limit.
- **The scheduled job needs the right hosting plan.** On the Next.js host a daily cron was the cap. Floot needs a paid plan and a published app for its 30-minute job.
- **Show lock-outs and switched-off features on screen.** Two real support moments came from silence: a rate-limited sign-in and a hidden payout button.
