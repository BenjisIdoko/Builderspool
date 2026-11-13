# Builders Pool user journeys

Based on the live product. The category-sheet pooling engine is built and has run twice on production as a test, but it is switched off for buyers. Today real orders still use the older per-material pools.

Last checked against the product on 10 November 2026. Changes since are listed under [Changes since 10 November](#changes-since-10-november); the stage write-ups below have not been re-walked. Stage feelings (1 frustrating to 5 delighted) are a design judgement from walking the product, not survey data. Everything else was checked in the code or the live database. Where this document and the product disagree, fix whichever is wrong and update the date above.

Contents: [Changes since 10 November](#changes-since-10-november) · [Buyer](#buyer) · [Seller](#seller) · [Operations](#operations) · [A day in the pool](#a-day-in-the-pool) · [What the product says, and what exists](#what-the-product-says-and-what-exists) · [The onboarding helper](#the-onboarding-helper)

## Changes since 10 November

Built and live on 12 November 2026. None of these closes a gap in the promises table; they improve the journeys above.

- **Buyer account.** `/account` is now an overview with a left menu: Orders, Savings credit, Address book, Price alerts, Profile. The header has a category mega menu and a "Hi, Name" account menu.
- **Address book.** A buyer saves pickup stations (from the ones BuildersPool runs) and up to 10 delivery addresses, each with a default. Checkout fills in the default delivery address and lists saved stations first. This eases stage 4 (Checkout).
- **Pickup stations.** Admin can add, edit and delete stations at `/admin/pickup-stations`. A station that orders used cannot be deleted. Only one station per region exists until the team adds more; the Ushafa-versus-Idu question is still open.
- **Errors and confirmations.** Failed actions now show a message beside the button instead of an error page. Money-moving and irreversible admin actions ask first.
- **Dates** show in Lagos time everywhere.
- **Seller pages** (listings, bids, RFQs list, payouts, settings, KYC, team, allocations) were polished. The KYC form no longer loses typed answers on an error. The payouts page now counts Buy Direct and RFQ payouts as well as older bids.
- **QA guide.** `docs/PRD-QA.md` describes requirements and test scenarios for a QA tester.

## Buyer

**Who.** A contractor or site manager in Abuja ordering cement, blocks, rebar, roofing or fittings for a site.

**Wants.** The right material at a fair price, delivered or collected on time, with no risk of paying and not receiving.

**Context.** Mostly on a phone, often on site, comparing prices against what a local dealer would charge.

### 1. Discover  (feels 3/5)

Screens: `/`, `/catalog`, `search`

**They do**
- Lands on the home page and reads the promise: "Build smarter. Save more."
- Sees the live pool countdown and the four-step "How Pool & Save works".
- Searches, or browses by category.

**Works today**
- One clear promise and a real, live countdown.
- Pool & Save is explained in four short steps.

**Friction and gaps**
- Several product photos repeat or look soft, and two categories have no photo at all.
- The "Lowest prices" rail leads with ₦150 fittings, which is not what a contractor shops for.
- The home page says collect at the Ushafa centre in Bwari; checkout says Abuja Central, Plot 12, Idu.

**Where a helper fits.** A short first-visit explainer: what Pool & Save is, and how it differs from Buy Direct.

### 2. Evaluate a product  (feels 3/5)

Screens: `/catalog/[id]`

**They do**
- Reads the spec, the price per unit and the Pool & Save panel (when the pool closes, units pooled today, the 50% savings share).
- Sees seller offers when sellers have listed, cheapest first, each with a verified badge and lead time.
- Can set a price alert.

**Works today**
- The pool panel states only real figures.
- Offers show seller, price, stock and lead time.

**Friction and gaps**
- No seller has a live listing yet, so the Buy Direct card says it is not available.
- The difference between Buy Direct and Pool & Save only becomes clear at checkout.

**Where a helper fits.** A "Pool & Save or Buy Direct?" comparison beside the price, in two sentences each.

### 3. Cart and account  (feels 3/5)

Screens: `cart drawer`, `/signup`, `/login`, `/verify-email`, `/forgot-password`

**They do**
- Adds items and quantities; if sellers have listed, the cheapest offer is picked by default.
- Must create an account to check out: name, email, password.
- Verifies the email from a link; a banner nags but does not block.

**Works today**
- The cart follows the account across devices.
- Reorder re-adds a past order at today's catalogue price.

**Friction and gaps**
- Quick-add buttons add at the catalogue price with no seller picked, which can make Buy Direct unavailable later.
- The phone number is not asked at sign-up; it is asked again at checkout.

**Where a helper fits.** Ask for the phone number once, at sign-up, and explain why (delivery contact).

### 4. Checkout  (feels 2/5)

Screens: `/checkout`

**They do**
- Picks an area: the three AMAC corridors, Bwari or Gwagwalada. Other places show a "tell us you want delivery" box.
- Chooses how to buy: Buy Direct (needs a seller on every item) or Pool & Save.
- Chooses delivery to site (₦15,000 per zone) or free pickup at the centre, then fills site address, contact, needed-by date and notes.
- Pays by bank transfer, card or USSD through Paystack, currently in test mode.

**Works today**
- The fee is shown before paying.
- Pickup shows the centre, its address and directions.
- The pay button names what is still missing.

**Friction and gaps**
- Eleven places, mostly central Abuja (Wuse, Garki, Maitama, Asokoro, Gwarinpa and others), have no zone, so those buyers can only pick up.
- A flat ₦15,000 delivery is heavy on a small order.
- Buy Direct is greyed out until a seller lists.
- A TEST tag shows because payments are not live.

**Where a helper fits.** A "what happens after you pay" note beside the pay button, so the pool timeline is clear before committing.

### 5. Waiting on the pool  (feels 2/5)

Screens: `/orders/[id]`

**They do**
- Opens the order page: a progress tracker and a plain line status for each item ("In today's pool", "Suppliers are bidding", "Choosing a supplier", "Supplier confirmed").
- On Buy Direct, sees "Waiting for the seller to accept", with their deadline.
- Money sits in escrow until the goods are received.

**Works today**
- Plain-language line status.
- A refund due is shown with the reason.

**Friction and gaps**
- The buyer gets no notification of any kind. Only the verification and password reset emails exist, so they must keep checking the page.
- No estimated delivery date.

**Where a helper fits.** A "what happens next" timeline right after payment, and email or SMS alerts at each step (a gap to build).

### 6. Receive  (feels 3/5)

Screens: `/orders/[id]`, `delivery tracking`

**They do**
- Collects free at the fulfilment centre (name, address, directions) or waits for delivery.
- Ops log the dispatch status by hand: assigned, at pickup, in transit, delivered.
- The centre receives and checks the goods, then escrow can release to the seller.

**Works today**
- Pickup card with directions.
- The receipt number appears on the tracker.

**Friction and gaps**
- The home page promises a delivery code ("share it only when goods arrive"). It is not built.
- No live GPS, and the buyer cannot confirm receipt themselves.

**Where a helper fits.** A pickup checklist: what to bring, opening hours, who to ask for.

### 7. After the order  (feels 2/5)

Screens: `/account`, `/orders`

**They do**
- Sees the savings wallet: 50% of any verified saving is credited once the goods are received.
- Reviews order history, reorders, prints, manages price alerts.

**Works today**
- The savings credit is exact to the kobo.
- Reorder is one tap.

**Friction and gaps**
- Savings cannot be withdrawn yet; the switch is off, so it is a credit, not cash.
- The home page promises "Report within 3 days". There is no dispute model or flow.
- A refund is recorded as "refund due", but nothing sends the money back automatically.

**Where a helper fits.** Explain "savings credit" in one line where the balance is shown, and add a Report a problem button.

## Seller

**Who.** A supplier, manufacturer or distributor who wants to reach builders and win pooled orders. The owner does everything; staff can work orders and bids but not KYC, bank details, terms or the team.

**Wants.** Win volume, be paid reliably, and not lose time to admin.

**Context.** Desktop in an office, phone in the yard. Used to dealers and phone calls, not marketplaces.

### 1. Join  (feels 3/5)

Screens: `/seller/signup`, `/seller/login`, `verify email`

**They do**
- Creates a business account and verifies the email.
- Lands on the dashboard, which opens on "Open cycles".

**Works today**
- A separate seller portal.
- Staff accounts by one-time invite link (72 hours).

**Friction and gaps**
- The first screen is the older per-material "Open cycles" view, not "what to do first".
- The menu carries two bidding models: Open cycles, My bids and Allocations are the older flow; RFQs is the new one.

**Where a helper fits.** A "Get ready to sell" checklist at the top of the dashboard.

### 2. Get verified  (feels 2/5)

Screens: `/seller/kyc`

**They do**
- Submits business registration, CAC number, ID type and number, TIN, address, bank details, and a document with its expiry.
- Accepts the seller terms as part of submitting.
- Waits for ops review: approved, rejected with a reason, or later suspended.

**Works today**
- The reviewer sees whether the bank account name matches the company.
- Clear statuses.

**Friction and gaps**
- No indication of how long review takes.
- Staff cannot do KYC; only the owner can.
- It is not obvious that selling needs three more approvals after this.

**Where a helper fits.** Show the whole path up front: KYC, then zones, then categories, then a listing.

### 3. Set up to sell  (feels 2/5)

Screens: `/seller/settings`, `/seller/listings`

**They do**
- Requests the delivery zones and the product categories they supply; ops approve each.
- Creates a listing per product: price, stock, lead time, shelf life for perishables, photos.
- Automated checks pass it live, hold it for ops (price outside 50 to 150% of the median), or reject it (no photo, photo under 1000px).

**Works today**
- Checks explain themselves with a reason code.
- A rejected listing keeps the reason.

**Friction and gaps**
- Three separate asks (zones, categories, listings) with no order and no progress indicator.
- A rejected listing leaves the seller to guess. Real case: a cement listing was rejected for a small photo.
- The site caps photos at 4 MB while the rule says 5 MB.

**Where a helper fits.** One checklist that shows which approvals are waiting on BuildersPool and which on the seller.

### 4. Buy Direct orders  (feels 3/5)

Screens: `/seller/orders`

**They do**
- A buyer picks the seller's listing; the line arrives with a 24-hour accept window.
- Accepts or declines; stock is reserved while it waits.
- Sends the goods to the fulfilment centre.

**Works today**
- Accept and decline with a visible deadline.
- A decline or a timeout refunds the buyer in the ledger.

**Friction and gaps**
- No alert when a Direct order arrives; the in-app bell covers pools only.

**Where a helper fits.** An alert and a badge on Orders when a Direct order needs an answer.

### 5. Bid on a pool  (feels 4/5)

Screens: `/seller/rfqs`, `/seller/rfqs/[id]`

**They do**
- At pool close a sheet opens for each category and zone, with item photos, quantities and a price limit.
- Prices every item, reviews, and sends one bid. It cannot be edited.
- At bids close the bid is checked and scored: price 30, performance 20, capacity 20, delivery 15, geography 10, responsiveness 5, each with a reason.
- The top three are offered the whole sheet in turn, one hour each. Accept or decline.

**Works today**
- A warning before a price above the limit.
- The score is explained criterion by criterion.
- A waiting vendor sees their rank and the latest time they could be offered.

**Friction and gaps**
- One bid and no edits, so a typo is permanent. The review step softens this.
- A vendor who ranks gets no notification until the sheet is offered to them.
- The older Open cycles pages still sit next to RFQs.

**Where a helper fits.** A first-bid walkthrough on the first RFQ: the limit, the one-bid rule, how scoring works.

### 6. Supply  (feels 3/5)

Screens: `/seller/rfqs/[id]`, `What you supply`

**They do**
- Sees each line at their bid price, the quantity, and the fulfilment centre address.
- Delivers to the centre, which receives and quality-checks the goods.

**Works today**
- Amounts are exact.
- No buyer identity is shown.

**Friction and gaps**
- No delivery slip to print and no status until the goods received note.

**Where a helper fits.** A printable delivery slip with the order lines and the centre address.

### 7. Get paid  (feels 2/5)

Screens: `/seller/payouts`

**They do**
- After the goods received note the payout is due: bid price times quantity on a pool, less the 3% commission on Buy Direct.
- Ops can hold a payout; ops pays it.

**Works today**
- Statuses run from awaiting receipt to cleared to paid, with a payout reference.

**Friction and gaps**
- Seller payouts are switched off until Paystack is live and reviewed, so no real payout can happen yet.

**Where a helper fits.** State the payout rule and timing on the payouts page, so sellers know what to expect.

## Operations

**Who.** The BuildersPool team: vetting vendors, setting up areas and fees, running the day, receiving goods and paying out.

**Wants.** A pooling day that runs on time, with every naira accounted for and nobody stuck waiting on an approval.

**Context.** Desktop. Works from queues and needs to see at a glance what is waiting on them.

### 1. Configure the platform  (feels 3/5)

Screens: `/admin/settings`, `/admin/areas`, `/admin/materials`

**They do**
- Sets the daily timelines, scoring weights (they must total 100), fees and the money switches.
- Creates zones, sets their delivery fees and assigns localities to zones.
- Curates the materials and catalogue prices.

**Works today**
- Guards on invalid settings: the sheet timeline must satisfy bids close plus three windows equals the final time.
- Every change is audited.

**Friction and gaps**
- Nothing says what is left before go-live: 11 places with no zone, vendor approvals, live listings.
- Two timelines (older cycles and sheets) sit side by side in Settings.

**Where a helper fits.** A go-live readiness checklist on the admin dashboard.

### 2. Onboard vendors  (feels 3/5)

Screens: `/admin/verification`, `/admin/sellers`, `/admin/areas`, `/admin/sheets`, `/admin/listings`

**They do**
- Reviews KYC documents, then approves, rejects or suspends.
- Approves zone requests and category requests.
- Reviews listings the automated checks flagged.

**Works today**
- Decisions keep reasons and an audit entry.

**Friction and gaps**
- Four queues in four places, and no single "vendors waiting on me" view.
- Approving is silent: the seller is not told.

**Where a helper fits.** One approvals inbox, and a notification to the seller on each decision.

### 3. Run the pool day  (feels 3/5)

Screens: `/admin/sheets`, `/admin/orders`, `/admin/cycles`

**They do**
- Watches sheets freeze, take bids, score, offer and settle. A per-minute clock runs them.
- Sees bids and awards for each sheet.

**Works today**
- The clock was proven to run each step within a second of its deadline.
- Every step is audited and safe to repeat.

**Friction and gaps**
- No warning when a sheet has no approved vendor for its category and zone; it would just cancel.
- The clock's health lives in the database, not in the admin.

**Where a helper fits.** A "today's sheets" strip with a flag for sheets nobody can bid on.

### 4. Receive and pay  (feels 3/5)

Screens: `/admin/sheets`, `/admin/direct`, `/admin/escrow`, `/admin/haulage`, `/admin/savings`

**They do**
- When the centre has received and checked goods, issues the goods received note. That makes the vendor payable and credits the buyer's saving.
- Pays the vendor (when the switch is on), holds a payout, or marks a line not supplied so it reverts or refunds.
- Logs dispatch status for delivery orders.

**Works today**
- Money moves are idempotent, in whole kobo, in an append-only ledger.

**Friction and gaps**
- Three receive-and-pay screens: pool allocations, Direct lines and sheet lines.
- Refunds are recorded but there is no refund payout action.

**Where a helper fits.** One "goods to receive and vendors to pay" worklist across all three.

### 5. Handle exceptions  (feels 1/5)

Screens: `/admin/sellers`, `/admin/users`

**They do**
- Holds a payout, suspends a seller, disables a user, follows up refunds due.

**Works today**
- Holds and suspensions are reversible and audited.

**Friction and gaps**
- There is no dispute model or queue, so the promised dispute process cannot be run.
- No tool to pay out a refund.

**Where a helper fits.** A simple Report a problem flow with an ops queue.

### 6. Account for it all  (feels 4/5)

Screens: `/admin/audit-log`, `/admin/users`, `/admin/team`

**They do**
- Reads the append-only audit log, manages users and the operations team, exports orders as CSV.

**Works today**
- Every important action is recorded, and the ledger cannot be edited.

## A day in the pool

The intended timeline once the sheet engine is on: pool closes 12:00, bids close 15:00, three one-hour accept windows, final result 18:00. Until then the older per-material pools run at 17:00, 18:00, 19:00 and 19:50.

| | Before 12:00 | 12:00 pool closes | 12:00 to 15:00 | 15:00 bids close | 15:00 to 18:00 | 18:00 final | After |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Buyer** | Orders and pays. The line joins today's sheet for its category and zone. | Sees "Suppliers are bidding". | Waiting. Nothing to do. | Sees "Choosing a supplier". | Sees "Supplier confirmed" when a vendor accepts. | Sees the result: supplier confirmed, or the order went to the seller they chose, or a refund is due. | Collects or receives the goods. Gets 50% of any saving as a credit. |
| **Vendor** | Keeps listings and stock current. | Gets an alert that an RFQ is open. | Prices every item and sends one bid, blind. | Rank 1 is offered the sheet and has an hour. Others see their rank. | Accepts or declines. A decline or a timeout offers the next rank at once. | If they won: sees what to supply. | Delivers to the centre. Is paid after the goods received note. |
| **Platform** | Lines add up by category, zone and day. | Freezes the sheets. Fixes each item's reference price: the lowest live listing among vendors serving the zone. | Hides every bid from every other vendor. | Rules out bids above the reference. Scores the rest on six criteria. Ranks the top three. | First acceptance wins the whole sheet at that vendor's bid prices. | No taker: the sheet cancels and each line goes back to the seller the buyer picked, at the price paid (24 hours to accept), or is refunded. | Goods received note makes the vendor payable and credits the saving. |
| **Ops** | Approves vendors, categories and zones ahead of time. | Nothing to do. The clock runs the step. | Watches /admin/sheets. | Nothing to do unless a sheet had no eligible vendor. | Watches offers. | Checks cancelled sheets and refunds due. | Issues goods received notes, pays vendors, holds exceptions. |

## What the product says, and what exists

Seven claims on the storefront, each checked against the code.

### Delivery code: share it only when goods arrive

_Home page, trust strip. Status: Not built._

- **What exists.** No delivery code exists anywhere. Nothing proves a drop-off happened.
- **Fix.** Build it (a code issued at dispatch and confirmed at the drop) or remove the claim.

### Fair disputes: report within 3 days

_Home page, trust strip. Status: Not built._

- **What exists.** There is no dispute model, screen or queue. Ops can only hold a payout.
- **Fix.** Add a Report a problem button on the order page and an ops queue, or remove the claim.

### Secure payment: sellers paid after delivery

_Home page, trust strip. Status: Partly true._

- **What exists.** True in logic: payouts follow the goods received note. But payouts are switched off until Paystack is live.
- **Fix.** Keep the claim; switch payouts on only after the Paystack review.

### Verified suppliers: CAC, ID and address checked

_Home page, trust strip. Status: Partly true._

- **What exists.** KYC review by ops exists. The automated CAC lookup only runs when its keys are configured, which I have not confirmed.
- **Fix.** Confirm whether the CAC lookup is configured, then word the claim to match.

### 50% of the verified saving comes back to you

_Hero, product page, checkout. Status: Partly true._

- **What exists.** Implemented exactly, to the kobo. But withdrawals are off, so it is a savings credit, not cash.
- **Fix.** Call it a savings credit wherever it appears, and say when it can be used.

### Collect free at the Ushafa Fulfilment Centre, Bwari

_Home page. Status: Does not match._

- **What exists.** Checkout and orders read the database centre: Abuja Central, Plot 12, Idu Industrial Area. The two do not match.
- **Fix.** Get the true name and address, update the centre record and the home copy.

### Delivery: one flat fee per seller

_Home page, delivery caption. Status: Does not match._

- **What exists.** Fees are now per delivery zone (₦15,000 in each of the five zones).
- **Fix.** Reword to a per-zone fee, ideally reading the live fees.

### Other gaps the map exposes

- **Buyers get no notifications** (Buyer). Only the verification and password reset emails exist. Sellers have an in-app bell for pools; buyers have nothing.
- **Refunds are bookkeeping only** (Buyer, Ops). A refund is recorded as "refund due" in the ledger. The payment webhook ignores refund events and there is no payout tool, so the money return is manual.
- **Four vendor approvals in four places** (Seller, Ops). KYC, zone requests, category requests and listing review each have their own screen, and none notifies the seller.
- **Two bidding models in the seller menu** (Seller). Open cycles, My bids and Allocations are the older per-material flow; RFQs is the new one. A new seller cannot tell which to use.
- **Three receive-and-pay screens** (Ops). Pool allocations, Buy Direct lines and sheet lines each have their own receive and pay controls.
- **Central Abuja has no delivery zone** (Buyer). Wuse, Garki, Maitama, Asokoro, Gwarinpa, Jabi, Utako and Apo, plus Kuje, Kwali and Abaji, are unzoned, so those buyers can only pick up.
- **No live tracking** (Buyer, Ops). Dispatch status is logged by hand. There is no GPS and no coordinates on the centre, so a real map needs data first.
- **Photos** (Buyer, Seller). Repeated and soft product photos, two blank categories, and a 4 MB upload cap against a 5 MB rule.

## The onboarding helper

Three helpers, one per audience. They use real data, never a generic tour, and hide themselves when the job is done.

### Get ready to sell (Seller)

_Top of the seller dashboard, until complete._ A new seller must clear five gates in order, three of them waiting on BuildersPool, and today nothing shows where they are.

1. Verify your email
2. Submit your business details (KYC) and accept the terms
3. Wait for KYC approval, or fix what was rejected
4. Ask for the delivery zones you supply
5. Ask for the product categories you supply
6. Add your first listing with a photo of at least 1000px
7. Ready: your first RFQ opens at pool close

Each step shows its live status from the database, links to the right page, and says who it is waiting on (you or BuildersPool).

### Go-live readiness (Operations)

_Admin dashboard, until everything is green._ The sheet engine is built and tested, but turning it on needs a short list of business setup that nothing currently tracks.

1. Every active zone has a delivery fee
2. Every locality is assigned to a zone
3. At least one vendor is approved for a category and a zone
4. At least one live listing exists
5. The per-minute clock has run recently
6. The area picker is on
7. Seller payouts: switched on or off, stated clearly
8. The sheet engine is on

Computed from the live data. A step that needs a person to judge, such as a test checkout, stays a manual tick.

### How buying works (Buyer)

_First checkout, and the order page after payment._ Buyers must choose between two ways to buy before they understand either, and then they get no notification.

1. Pool & Save or Buy Direct, in two sentences each
2. What happens after you pay: pool closes, suppliers bid, result by 18:00
3. Where and when to collect, or when delivery is expected
4. What the savings credit is and when you can use it

Dismissible, shown once, and never a blocking tour.

