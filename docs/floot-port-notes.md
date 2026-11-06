# BuildersPool: port notes for the Floot build

Written 5 Nov 2026. Updated 6 Nov 2026 (sections 1b and 1c, the founder's call transcript and the resolved rules; section 2.11, service areas; scenarios 13 to 22). Source: the Next.js repo (`BenjisIdoko/Builderspool`, Phases 1 and 2, commits `e33cf81` to `20987c3`) compared with `BuildersPool_Technical_Requirements.docx` v1.0, which describes the Floot app as built.

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

### 1b. The founder's own description of the bidding and pooling flow (voice call transcript)

The founder explained the flow aloud and the recording was transcribed. This section turns it into rules and sets them against both builds. "Needs confirming" means the transcript is ambiguous or silent, so it is a question for the founder, not an assumption.

| Topic | What the founder said | Next.js build | Floot spec | Status |
|---|---|---|---|---|
| Two ways to buy | **Buy Direct**: pick items, cart, checkout; the system adds item cost and transport; last-mile delivery, or pickup at the fulfilment centre. **Pool & Save**: the buyer is willing to wait while other Pool & Save buyers are aggregated. | Same two ideas, but one fixed catalogue price and no visible seller | Same as the founder, with a per-seller offers list | Settled |
| What the buyer sees | On Buy Direct the buyer sees which seller's listing they are picking ("from Ushafa Builders Ltd"). Choosing Pool & Save means giving up the right to choose the supplier. | Never shows a seller to a buyer | Offers list per seller | Settled. **This build cannot express it** (one catalogue price per material). |
| Aggregation | All Pool & Save lines go into one pool, then are split by category (plumbing, reinforcement, electrical, cement, and so on). | Per material per region | Per category per zone | Settled: category-level RFQs |
| RFQ | Sent to every vendor registered for that category, as an Excel-style sheet **with pictures**: item, total quantity, reference price, and a bid price (and a minimum or maximum) to fill in. One submit per vendor. | Cycle per material; no sheet | Per spec, check for the sheet and pictures | Settled. Needs confirming: per-item or whole-sheet award (below). |
| Reference price | The **lowest price of that material across sellers' listings on the platform**, recalculated as buyers join, **until the pool closes**. Bidders see it on the RFQ; sellers do not see it while listing. | Fixed catalogue price | Lowest Buy Direct price "in your area" at 12:00 | Settled in principle. Needs confirming: platform-wide or per zone, and that it freezes at pool close. |
| Scoring | Best price, cost to deliver, quality (matches the specification), and past performance (right quantity, right quality, on time). New suppliers have no record at first. Highest percentage wins, then second, then third. | Six weights (30/20/20/15/10/5) | Four weights (60/20/15/5) | The criteria are settled; **the weights were not stated**. Needs confirming. |
| If the winner doesn't accept | Re-award to the second, then the third, each within a time limit. After the third: the RFQ is **cancelled**. | Passes once, then final | Re-awarded to the next best, no stated limit | **New rule: a bounded cascade of three ranks.** |
| If the RFQ is cancelled | The lines **revert to the sellers whose listings the buyers originally picked**, who fulfil them as an ordinary Buy Direct order. "We are not leaving you without products." | Refund, nothing is bought | Buyer authorises a fallback purchase in advance | **A third model.** Needs confirming: price, stock, and when the buyer pays. |
| Timing | Pool closes at **3pm** (leaning; 12, 3 or 5 were considered); as one pool closes the next opens. RFQ goes out at once; accept windows of about an hour each (3 to 4, 4 to 5, 5 to 6); everything settled by **6pm**. | 17:00 close, 18:00 award, 19:00 accept, 19:50 final | 12:00 / 16:00 / 17:00 | Leaning 15:00. Needs confirming: when bids close (the transcript lets vendors bid and be awarded "immediately"). |
| Delivery | Pool & Save arrives the next day or two (24, 48 or 72 hours), depending on volume, bulk and distance. Suppliers are allocated near the site, except national products. | Not modelled | Per-km last mile from the nearest centre | Settled |
| Money | Buyer's money is in escrow. The seller is paid **only after delivery and the fulfilment centre's quality check** against the specification. | Same (GRN releases escrow) | Same | Settled |
| Why sellers join | Bulk volume and liquidity: a pooled award can empty a warehouse, and the cash is already in escrow. | n/a | n/a | Context |
| Seller uploads | Sellers set their own prices in their dashboard and are not shown the reference price while listing. Image and price quality need validating on upload. | Admin-edited catalogue | Seller listings with QC | Settled. Needs confirming: what the quality checks reject. |

**What this changes**
1. The founder's model is a **multi-seller marketplace with Pool & Save on top**. That is the Floot shape, not the Next.js shape. This repo stays a reference for the engine rules (ledger, stage safety, scoring reasons, escrow release), but its buyer-facing model (one catalogue price, no seller listings) is not what the founder described. Do not copy this repo's storefront rules into Floot.
2. Three decisions in the table above are now answered: category-level RFQs, the three-rank cascade, and revert-to-original-seller instead of refund or pre-authorised purchase. Three are leaning: 15:00 pool close, reference price from the lowest listing, and the four criteria.
3. The "fallback" is no longer the choice between a refund and an authorised purchase. It is a **revert to the originally picked seller's listing**. Floot's pre-ticked authorisation checkbox is then unnecessary, and the join form should say so.

**Questions only the founder can answer**
1. Is the award per line item or per category sheet? The transcript says "the most responsive bidder" for the category, but vendors bid per item.
2. Does the reference price count the whole platform or only sellers who serve the buyer's zone? It must freeze at pool close.
3. When do bids close, and how long is each accept window? The transcript gives about an hour per rank, ending at 18:00.
4. When a pool is cancelled and lines revert to the picked seller: at the listing price when the buyer picked it, or today's? What if that seller no longer has stock? When does the buyer pay: at pool join, or on revert?
5. What are the scoring weights for the four criteria, and what score does a new supplier with no history get?
6. What does the quality check on seller uploads reject (image size, missing photo, price outside a band of the reference price)?

**Prompt for Floot (cascade and revert).** Paste into Floot:

> Implement this pool outcome. After the pool closes, send each category's RFQ to every vendor registered for that category, with item pictures, total quantity and the reference price (the lowest seller listing price for that material, frozen at pool close). Each vendor submits bid prices once. Score every bid on price, cost to deliver, quality against the specification and past performance. Award to the top-ranked bid; the vendor has a fixed time to accept. If they do not accept, award to rank two, then rank three, each with its own fixed time. If rank three does not accept, cancel the RFQ and revert each line to the seller whose listing the buyer originally picked, to be fulfilled as a normal Buy Direct order, and tell the buyer. Never loop beyond three ranks. Each step must be safe to run twice and must write an audit entry.

### 1c. Resolved rules: the founder's answers and the choices made for them

These are the answers to the six questions in 1b. Rows marked **Founder** are the founder's own words. Rows marked **Chosen** were delegated ("you choose", "suggest for me") and are proposals for the founder to approve. Rows marked **Reading** are my interpretation of a short answer; correct them if wrong. Every value is an admin setting, so none of this is permanent.

| # | Question | Resolution | Source |
|---|---|---|---|
| 1 | Award per line or per sheet? | **Both, as a setting per category.** *Line mode* (default): each line goes to the highest-scoring bid on that line, and a vendor may bid on some lines only. *Sheet mode*: a vendor must bid every line; the highest total score wins the whole sheet and the cascade runs on the sheet. | Founder ("both for now"); default Chosen |
| 2 | Reference price scope | The **lowest listing price among sellers who can serve the buyer's delivery zone**, i.e. what the buyer could actually have bought at. Recalculated while the pool is open and **frozen at pool close**. | Reading of "the buyer's platform"; freeze from the earlier call |
| 3 | When does it all end? | **Final result at 18:00.** Timeline that fits (all values are settings): pool closes **15:00**, bids close **15:45**, accept windows of **45 minutes** for rank 1 (15:45 to 16:30), rank 2 (16:30 to 17:15), rank 3 (17:15 to 18:00). The system must reject any settings where bids close plus three windows does not equal the final time. | 18:00 Founder; split of the day Chosen |
| 4 | Revert price | **The price the buyer picked** (the listing price when they added it). | Founder |
| 4b | Revert when the picked seller cannot supply (out of stock, suspended) | The line is **refunded**; nothing is substituted without the buyer's consent. | Chosen |
| 4c | When does the buyer pay? | **At checkout, into escrow**, for Pool & Save as for Buy Direct, because the founder said the money is already in escrow when the pool is awarded. If the RFQ is cancelled, the same escrow carries over to the picked seller. | Founder's call plus Chosen. **This conflicts with Floot's "No payment now. Pay after the award" text; that text should change.** |
| 5 | Scoring | Four criteria, **weights 40 / 15 / 20 / 25**: unit price 40, delivery cost 15, quality (match to the specification) 20, past performance 25. A new supplier with fewer than 5 completed orders gets a neutral performance score of **50 out of 100**. A bid **above the reference price is ineligible** (the founder's point: a bulk bid that cannot beat the reference has no purpose). | Chosen; "must beat reference" inferred from the call |
| 6 | Seller upload checks | See below. | Chosen |

**Quality check on seller uploads (Chosen).** Each listing is checked on save and gets one of three outcomes: *pass*, *needs review* (held out of the catalogue until ops approve) or *reject*, always with a reason code.
- **Photos.** At least one. JPEG, PNG or WebP, up to 5 MB, at least 1000 px on the long edge. Reject watermarks, phone numbers and contact details in the image (visual check by ops), and a photo that is clearly a screenshot or a stock image.
- **Required fields.** Name, category, unit (and pack size), specification, brand or grade, applicable standard, minimum order quantity, stock on hand, lead time, and the delivery zones served. Missing fields reject.
- **Price.** A positive whole-naira price in the stated unit. If it is below 50% or above 150% of the median of other sellers' prices for the same material, or exactly ten times or one tenth of it, the listing goes to *needs review* (likely a typo), never straight to live.
- **Shelf life.** For cement, paint, adhesives and similar, a production or expiry date is required. A product with under 30 days of life left is rejected. This addresses the founder's point about expired stock; the fulfilment-centre check at delivery remains the final gate.
- **Duplicates.** A second listing with the same seller, name and unit goes to *needs review*.
- **Never shown to sellers while listing:** the reference price. They see their own price and platform guidance only.

**What changes in the other sections of these notes**
- Section 1 table: cascade is now three ranks, then revert; fallback is revert to the picked seller at the picked price (refund only if that seller cannot supply); times follow 1c (pool 15:00, final 18:00).
- Section 2.4 (fallback) and the Floot join form: no fallback-purchase checkbox is needed, and the "no payment now" line must go.

**Single prompt for Floot (replaces the cascade prompt in 1b).** Paste into Floot:

> Set up the Pool & Save cycle with these admin-editable settings and rules. Times (Lagos): pool closes 15:00, bids close 15:45, accept windows of 45 minutes, final result 18:00; reject settings where bids-close plus three windows does not equal the final time. At pool close, freeze each line's reference price as the lowest listing price among sellers serving that buyer's delivery zone. Group lines by category and send each category an RFQ to every approved vendor registered for it, with item pictures, total quantity and the reference price. A bid above the reference price is ineligible. Score eligible bids on unit price (40), delivery cost (15), quality against the specification (20) and past performance (25); a supplier with fewer than 5 completed orders gets a neutral performance score of 50. Award mode is a per-category setting: "line" (each line to its best-scoring bid) or "sheet" (the vendor bidding every line with the best total wins the sheet); default line. The winner has one accept window; if they do not accept, award to rank two with their own window, then rank three. If rank three does not accept, cancel and revert each line to the seller whose listing the buyer picked, at the price the buyer picked, as an ordinary Buy Direct order; if that seller cannot supply, refund that line. Buyers pay into escrow at checkout; remove any "no payment now" wording. Sellers are paid only after delivery and the fulfilment centre's quality check. Every step must be safe to run twice and write an audit entry. Validate seller listings on save: at least one photo (1000 px long edge, up to 5 MB, JPEG/PNG/WebP), all required fields, a price within 50% to 150% of the median of other listings for that material (otherwise "needs review"), a production or expiry date for perishables with at least 30 days left, and duplicate detection; return pass, needs review or reject with reason codes.

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

### 2.11 Service areas: Local Government Area, then city or district, then delivery zone

**Decision (6 Nov 2026, founder).** Fulfilment regions narrow from whole states to Local Government Areas (LGAs) and cities. The first list covers the FCT (Abuja) only. The Floot spec lists "placeholder delivery zones" as an open gap; this replaces them.

**Rule.** Three levels, each with one parent:

| Level | Examples | Used for |
|---|---|---|
| Area Council (LGA) | AMAC, Bwari, Gwagwalada, Kuje, Kwali, Abaji | Reporting, address validation, ops filters, where a seller is based |
| Locality (city, town or district) | Garki, Maitama, Lugbe, Ushafa, Kubwa | The buyer's address and "Deliver to" choice, nearest fulfilment centre |
| Delivery zone (admin-defined group of localities) | "AMAC – Lugbe / Airport Road corridor" | **The pool key** (one cycle per material per zone per day), the delivery fee, seller coverage, the supplier cap |

A locality belongs to exactly one LGA and to at most one active zone. A zone may cross LGA lines (Floot's "Nyanya / Karu / Jikwoyi corridor" does). Pools are formed at **zone** level, never at locality level: many tiny pools would leave one or two sellers per pool, and blind competition needs the supplier cap (default 5) to be reachable.

**Starting data (ops to confirm before use).**
- Six Area Councils: AMAC, Bwari, Gwagwalada, Kuje, Kwali, Abaji.
- Five zones already in Floot: AMAC – Lugbe / Airport Road; AMAC – Nyanya / Karu / Jikwoyi; AMAC – Lokogoma / Wumba / Kabusa; Bwari Area Council; Gwagwalada Area Council.
- Localities to seed, grouped by LGA: AMAC (Garki, Wuse, Maitama, Asokoro, Jabi, Utako, Gwarinpa, Lugbe, Nyanya, Jikwoyi, Lokogoma, Kabusa, Wumba, Apo); Bwari (Bwari town, Ushafa, Kubwa, Dutse); Gwagwalada (Gwagwalada town); Kuje, Kwali and Abaji (their council towns). Kuje, Kwali and Abaji have no zone yet, so delivery there shows as "not available yet".
- **Open: Karu.** Karu is a Nasarawa State LGA, but Floot's corridor name includes it. Decide whether border towns in Nasarawa (Karu, Mararaba) are in scope. If yes, the model needs a state level above the LGA.

**Behaviour.**
- **Buyer address.** Delivery needs an LGA and a locality (searchable lists, grouped by LGA), a free-text street, and an optional landmark. Pickup is unaffected. The choice is remembered on the account.
- **No zone, no delivery.** A locality with no active zone cannot be delivered to: show pickup and a "Tell us you want delivery here" capture (phone plus locality, one per pair).
- **Product page.** "Deliver to" shows the buyer's locality. "N sellers deliver here" counts sellers covering that zone; never names them.
- **Sellers.** Coverage is declared per zone (multi-select). The geography filter at award means "covers the order's zone". Suspending coverage for a zone removes that seller from its cycles from the next cycle date.
- **Fulfilment centres.** Each has a locality, an LGA, an address, opening hours and the zones it serves. Pickup shows the centre's details (Ushafa: Bwari Area Council, Mon to Sat, 8am to 6pm).
- **Delivery fee.** Set per zone in admin by the business, not by engineering. One flat fee per seller, shown before payment.
- **History is never rewritten.** Moving a locality to another zone changes nothing for paid orders or open cycles; it applies from the next cycle date.
- **Audit.** Every create, rename, move or disable of an LGA, locality, zone or mapping writes an audit entry (who, when, before, after).

**Decisions (chosen on the founder's behalf, 6 Nov 2026; the founder approves by accepting this note).**
1. **Pool grain: the delivery zone.** One RFQ sheet per category per zone. Not per LGA (zones can cross LGAs) and not per locality (too few bidders). This matches the call: suppliers are allocated near the site.
2. **Nasarawa border towns (Karu, Mararaba): not in the first list.** The first list contains FCT localities only. The model carries a **state** field above the LGA from day one, so Nasarawa localities can be added later without remodelling. Floot's existing zone name "Nyanya / Karu / Jikwoyi corridor" stays; ops confirm which of its localities are inside the FCT.
3. **Who maintains the lists: an admin screen.** No code or database change should be needed to add a locality or move it to another zone.
4. **Delivery fees: per zone, entered by the business in admin, never by engineering.** A zone with no fee set cannot offer delivery (pickup only) until a fee is entered. This note sets no fee values.
5. **Seller coverage: by zone.** A seller flagged **national supply** covers every zone (the call's "except national products"). Coverage is edited by the seller, approved by ops.
6. **Locality-level detail stays on the order** (address, landmark) for the driver; it never decides pooling or pricing.

**Check.** In Floot admin, can you see LGA, locality and zone as three linked lists? Move a locality to another zone: does tomorrow's pool change while today's and every paid order stay as they were?

**Prompt.** Paste into Floot:

> Replace the placeholder delivery zones with a three-level service-area model for the FCT (Abuja). Level 1: Area Council (LGA), seeded with AMAC, Bwari, Gwagwalada, Kuje, Kwali, Abaji. Level 2: locality (city, town or district), each belonging to exactly one LGA; seed the localities I give you. Level 3: delivery zone, an admin-defined group of localities (a zone may span LGAs); a locality is in at most one active zone. Use the zone as the key for pool cycles (one cycle per material per zone per day), the delivery fee, seller coverage and the supplier cap. Buyer delivery addresses must pick an LGA and a locality from searchable lists, plus a street and an optional landmark; pickup is unaffected. A locality with no active zone cannot be delivered to: offer pickup and a "tell us you want delivery here" request (phone plus locality, deduplicated). Sellers declare coverage per zone. Each fulfilment centre records its locality, LGA, address, hours and the zones it serves. Add an admin screen to manage LGAs, localities, zones, mappings and per-zone delivery fees. Moving a locality to another zone must not change paid orders or open cycles; it applies from the next cycle date. Audit-log every change with who, when, before and after. Do not rename or delete existing zone rows that orders or cycles reference; deactivate them instead.

---

## 3. Floot has these; the Next.js build does not (do not port back)

Last-mile delivery priced per km from the nearest centre, Hub and Dispatch screens, 4-digit proof-of-delivery codes (lock after 5 wrong tries), bulk upload from Excel templates, in-app notification bell for every event, a 30-minute housekeeping job, one order per seller with a 24-hour accept window, 30-minute stock hold during checkout, sitemap and share previews, 32 automated test files. The Floot spec's own open gaps (placeholder delivery zones, which section 2.11 now replaces; no partial refunds, search index needed past about 5,000 listings, no live truck tracking, independent security review before real money) stand.

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
13. **Address rules.** A delivery order with no locality is refused. A locality with no active zone: delivery is unavailable, pickup works, and the "want delivery here" request is stored once per phone and locality.
14. **Zone move.** Move a locality to another zone mid-day: paid orders and open cycles are unchanged, tomorrow's order uses the new zone, and an audit entry exists.
15. **Coverage and pooling.** A seller covering Zone A only cannot see or bid in Zone B. Two orders from different localities of the same zone join one cycle.
16. **Three-rank cascade.** Rank one declines, rank two lets the time lapse, rank three declines: the RFQ is cancelled once, and every line reverts to the seller the buyer picked. Running the job twice changes nothing.
17. **Reference price.** Add a cheaper listing while the pool is open: the reference price drops. After pool close it no longer changes. Bidders see it on the RFQ; sellers do not see it on their listing screens.
18. **Pooled by category.** Orders for PPR pipes and cement in the same pool produce two RFQs, each sent only to vendors registered for that category, and each with item pictures.
19. **Beat the reference.** A bid above the frozen reference price is excluded with a reason code; a bid at or below it is scored.
20. **Timeline guard.** Saving settings where bids close plus three accept windows does not equal the final time is refused with a clear message.
21. **Revert.** After rank three declines, each line goes to the picked seller at the price the buyer picked. If that seller is out of stock or suspended, only that line is refunded.
22. **Upload checks.** A listing with no photo is rejected; a price ten times the median goes to "needs review"; cement with 20 days of life left is rejected; an identical second listing from the same seller goes to "needs review".

## 5. Lessons from testing (apply to Floot too)

- **Scope every test to rows the test created.** One Next.js test released a real demo award because it targeted a seller by role rather than by its own test data. It was restored, but it should not have been possible.
- **Never write test entries to the live ledger.** It is append-only, so a test entry is permanent. Test the ledger in a rolled-back transaction or a separate database.
- **Long multi-step database transactions can hit time limits.** The cascade needed a longer transaction timeout than the default. If Floot's functions time out mid-award, split the work or raise the limit.
- **The scheduled job needs the right hosting plan.** On the Next.js host a daily cron was the cap. Floot needs a paid plan and a published app for its 30-minute job.
- **Show lock-outs and switched-off features on screen.** Two real support moments came from silence: a rate-limited sign-in and a hidden payout button.
