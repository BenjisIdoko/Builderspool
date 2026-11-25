# BuildersPool: Product Requirements Document for QA

| | |
| --- | --- |
| **Product** | BuildersPool, collaborative procurement for construction materials in Abuja (FCT), Nigeria |
| **Document type** | Product requirements and test guide, written for a QA tester |
| **Version** | 1.2 |
| **Date** | 25 November 2026 |
| **Live site** | https://builderspool.vercel.app |
| **Source of truth** | `docs/floot-port-notes.md` (business rules), `docs/user-journeys.md` (journeys), `DESIGN.md` (design system). Where the code and the rulebook disagree, the rulebook wins and the code is the bug. |

---

## 1. How to use this document

You do not need prior knowledge of the product. Read sections 2 to 5 first, then test one module at a time from section 7.

- **Section 3** tells you what is in and out of scope, and which things are known gaps and **not bugs**. Read it before you file anything.
- **Section 4** tells you how to set up safely. The test database is the live database. Read it twice.
- **Section 7** lists the requirements by module. Each has an ID (for example `BUY-CHK-3`) and acceptance criteria you can test directly. Please quote the ID in every bug report.
- **Section 8** is the money and pooling rulebook with exact numbers. Use it to check calculations.
- **Section 9** gives end-to-end scenarios and a smoke test to run after every deployment.
- **Section 11** says how to report a bug.

---

## 2. Product overview

### 2.1 What it is

BuildersPool helps builders buy construction materials (cement, blocks, rebar, roofing, fittings, paint) in Abuja. A buyer can order in one of two ways:

- **Buy Direct.** The buyer picks a specific seller's listing and price. The seller has 24 hours to accept.
- **Pool & Save.** The buyer's order joins a daily pool with other buyers' orders. Verified suppliers bid blindly for the combined order. The buyer keeps **50% of any verified saving** as a savings credit.

Goods go to a BuildersPool **fulfilment centre** (also called a pickup station) first. The centre receives and checks them. Buyers then collect them free, or have them delivered to site for a fee per delivery zone. Seller payment follows receipt.

### 2.2 Who uses it

| Role | Who | What they do |
| --- | --- | --- |
| **Buyer** | Contractor or site manager | Browses, orders, pays, collects or receives, tracks savings credit |
| **Seller owner** | Supplier, manufacturer or distributor | Registers, passes KYC, lists products, bids on pools, supplies, gets paid |
| **Seller staff** | Employee of a seller | Bids, works orders and allocations. Cannot change KYC, bank details, terms or the team |
| **Admin** | BuildersPool operations team | Verifies sellers, sets areas, fees and settings, runs the pool day, receives goods, pays sellers |
| Other internal roles | QC officer, fulfilment operator, delivery partner | Exist in the data model. Their own consoles are not built yet |

### 2.3 Three areas of the application

| Area | Address | Audience |
| --- | --- | --- |
| Storefront | `/` and everything not listed below | Buyers |
| Seller Centre | `/seller/...` | Sellers and their staff |
| Ops admin | `/admin/...` | BuildersPool staff |

### 2.4 Current stage

The product is live in test mode. In particular:

- **Paystack payments run in test mode.** No real money moves. A TEST tag shows at checkout.
- **Seller payouts and savings withdrawals are switched off** by design.
- **The new category-sheet pooling engine is built but switched off** for buyers. Real orders still use the older per-material pools. See section 6.
- No seller has a live listing yet at the time of writing, so Buy Direct may show as unavailable until test listings exist. Confirm current state with the product owner.

---

## 3. Scope for QA

### 3.1 In scope

All user-facing behaviour of the storefront, Seller Centre and Ops admin; the pooling, bidding, award, fallback and refund rules; money calculations and the ledger; authentication, sessions and access control; responsive layout, accessibility and time zone display.

### 3.2 Out of scope

Real card charging and bank movement (test mode only); load and penetration testing unless agreed; email deliverability (only verification and password-reset emails exist); the internal consoles for QC officer, fulfilment operator and delivery partner (not built).

### 3.3 Known gaps (please do **not** file these as bugs)

These are acknowledged and tracked by the product owner. Report them only if the behaviour differs from what is written here.

| # | Known gap |
| --- | --- |
| G1 | **No delivery code.** The home page promises one ("share it only when goods arrive"). It is not built. |
| G2 | **No dispute or "Report a problem" flow.** The home page mentions reporting within 3 days. Admin can only hold a payout. |
| G3 | **Notifications work in the app and by email only.** Buyers and sellers have an in-app bell and, for buyers, a notifications page. Email needs a verified Resend sending domain to reach every user. SMS and WhatsApp send only when a provider is configured, and none is yet, so those deliveries are logged as skipped. |
| G4 | **Refunds are bookkeeping only.** A refund is recorded as "refund due". No money is returned automatically, and there is no refund payout tool. |
| G5 | **Seller payouts are off** (`money.sellerPayoutsEnabled`). Savings withdrawals are off (`money.walletWithdrawalsEnabled`). The server must refuse both, and the buttons must say why. |
| G6 | **Five zones have no delivery fee yet** (decided 13 Nov): AMAC City Centre, AMAC Jabi / Utako / Gwarinpa corridor, Kuje, Kwali and Abaji. Every locality is now in a zone, but in these five buyers can only pick up until a fee is set. No seller has approved coverage for them either. |
| G7 | **Two bidding models sit side by side in the seller menu.** Open cycles, My bids and Allocations are the older per-material flow. RFQs is the new category flow. |
| G8 | **Pickup stations.** Decided 13 Nov 2026: the buyer chooses the station nearest their site, and the home page no longer names one centre. The seeded Abuja station ("Abuja Central, Plot 12, Idu Industrial Area") is seed data until the team replaces it. Only one station per region exists until admin adds more. |
| G9 | **Photo size cap mismatch.** The site rejects photos over 4 MB while the written rule says 5 MB. |
| G10 | **No live delivery tracking.** Dispatch status is typed in by hand. No GPS. |
| G11 | **No estimated delivery date** on orders. |
| G12 | **The seller terms text** says "will be published before the pilot". It is a placeholder. |
| G13 | **The map on pickup stations is a link** ("View on map") that opens an external map. There is no embedded map, and stations have no opening hours yet. |
| G14 | **A removed (disabled) staff or admin email cannot be reused** for a new account. |
| G15 | **Distance-based delivery pricing is fully built but switched off.** The admin page, settings, calculation and the checkout side (address search, fee quote, fee stored on the order) exist (decisions D10 to D14 and D23 to D26 in `docs/decisions.md`). The Google Maps key, vehicle rates, station coordinates and confirmed item weights do not exist yet, so the switch cannot be turned on and checkout still charges the zone fee. Test the admin side (ADM-DLV) and that checkout is unchanged; BUY-CHK-18 to 21 can only be tested once the four prerequisites are in and the switch is on, ideally on a test deployment. |
| G16 | **Credo Pay is built but not configured.** No Credo keys exist in production, so the "Credo Pay" option shows "Not configured yet". Its webhook has not been tested against Credo. Test Credo only if the product owner gives you demo keys. |
| G17 | **Savings credit is locked when an order is placed**, not when it is paid. An unpaid order keeps the credit tied to it until it is paid, and nothing releases it automatically. Report it only if credit disappears from an order that was paid or cancelled in a way that should have released it. |
| G18 | **Refunds ignore savings credit.** A line refund shows the full line price even when part of it was paid with credit. Known and awaiting a decision. |

---

## 4. Environments, accounts and test safety

### 4.1 Environment

- **One environment**: the production site at https://builderspool.vercel.app, backed by one shared database. **Anything you write is real data in production.**
- The cron/clock runs on Vercel plus a per-minute `pg_cron` ticker (`/api/pool/tick`). Daily cron endpoints are `/api/cron/close-cycles` (scheduled 18:05 UTC, which is 19:05 in Lagos) and `/api/cron/notify-closing-soon` (16:30 UTC, 17:30 in Lagos). Everything the user sees is in **Africa/Lagos time (WAT, UTC+1)**.
- Region: `dub1` (Dublin). Expect slightly slower responses from Nigeria.

### 4.2 Accounts

Test accounts are issued by the product owner separately. This document does not contain credentials. Ask for at least:

1. Two **buyer** accounts (one fresh, one with orders).
2. One **seller owner** and one **seller staff** account, ideally one KYC-approved seller and one not yet submitted.
3. One **admin** account.

You can create buyer and seller accounts yourself through sign-up. Admin accounts cannot be self-registered (there is no sign-up route).

### 4.3 Payments (Paystack test mode)

At checkout, card payments run against Paystack's **test mode**. Use Paystack's published test card:

- Card: `4084 0840 8408 4081`, CVV `408`, any future expiry, PIN `0000`, OTP `123456`.
- See Paystack's documentation for failure and decline test cases.
- Bank transfer and USSD also open Paystack. Paystack's test mode shows how each behaves.

**Credo Pay** is a second gateway. It appears at checkout only when the Credo keys are set (see G16). Until then the option is disabled with "Not configured yet" and Paystack is used.

If a payment fails at the start (a Paystack error) the order is still created and the buyer can retry payment from the order page. This is intended.

### 4.4 Safety rules for testing on live data

1. **Tag your test data.** Prefix names with `QA-` (for example "QA-Test Cement Listing", "QA Buyer"). Tell the product owner what you created so it can be cleaned up.
2. **Never test the ledger destructively.** The money ledger is append-only. A test entry is permanent. Do not try to edit or delete ledger rows.
3. **Do not run "Disburse" or "Mark paid" on real records.** Payouts are switched off. Confirm the refusal and stop.
4. **Do not change admin Settings** (times, weights, switches) unless a test requires it and the product owner agrees. Restore the original value straight after, and note the time.
5. **Scope each test to rows you created.** An earlier test once released a real award because it targeted a seller by role. Always act on QA-tagged data.
6. **Do not remove or edit real pickup stations, zones or materials.**

### 4.5 Switches that change what you will see

Confirm the current value of each with the product owner before testing, because they change behaviour.

| Setting | Default | Effect |
| --- | --- | --- |
| `sheets.enabled` | off | Off: paid pool orders use the older per-material cycles. On: orders pool onto category sheets and the RFQ flow runs. |
| `areas.checkoutPickerEnabled` | off | On: checkout asks for locality and zone and uses zone delivery fees. Off: older region-based delivery charge. |
| `money.sellerPayoutsEnabled` | off | Seller payouts. Server must refuse when off. |
| `money.walletWithdrawalsEnabled` | off | Savings-credit withdrawals. Server must refuse when off. |
| `notifications.smsEnabled` / `notifications.whatsappEnabled` | on / **off** | Platform switches for text-message alerts (Admin > Settings > Alerts by text message). |
| `TERMII_SMS_CHANNEL` | not set (`generic`) | `dnd` also reaches numbers on the Do Not Disturb list. |
| Credo keys (`CREDO_PUBLIC_KEY`, `CREDO_SECRET_KEY`) | not set | Credo Pay is offered at checkout only when both exist. |
| SMS and WhatsApp provider keys | not set | Without them, SMS and WhatsApp deliveries are logged as skipped. Email needs `RESEND_API_KEY` and a verified domain. |

---

## 5. Roles, access and navigation

### 5.1 Navigation map

**Storefront.** Header: hamburger mega menu (all categories with products), search, "Hi, Name" account menu (or Log in), cart. Category strip under the header. Footer. On phones a bottom tab bar (Home, Catalogue, Cart, Account).

**Buyer account** (`/account`, left menu on desktop, tabs on phone): Overview, Orders (`/orders`), Savings credit, Address book, Price alerts, Profile.

**Seller Centre** sidebar: Dashboard, My listings, RFQs, My bids, Orders, Allocations, Payouts, KYC verification, Team (owner only), Settings. Top bar: notification bell and "Hi, Name" menu (Settings, KYC verification, Payouts, Team for owners, Log out).

**Ops admin** sidebar: Dashboard; Orders, Sellers, Materials, Catalogue reference, Listing review, Buy Direct orders, Service areas, Pickup stations, Pool sheets, Haulage and dispatch, Escrow settlement, Savings settlement; Users, Operations team, Vendor verification; Settings, Audit log.

### 5.2 Access rules to verify

| Rule | Expected |
| --- | --- |
| Signed-out visitor opens `/account`, `/orders`, `/checkout` | Redirected to `/login` |
| Signed-out visitor opens `/seller/...` or `/admin/...` | Redirected to the matching login |
| Buyer opens `/seller/...` or `/admin/...` | Refused or redirected. No data shown. |
| Seller staff opens KYC, bank details, terms, Team | Refused or redirected |
| Unapproved seller (KYC not approved) | Cannot see cycles or RFQs, cannot bid or accept awards |
| Suspended seller | Keeps login, cannot bid or be awarded. Unaccepted awards are released |
| Disabled user | Cannot sign in anywhere. Sessions revoked. |
| Forged cookie with a real user id | Rejected |
| `POST /api/checkout` with a different `buyerId` in the body | Ignored. Order is created for the signed-in buyer only |
| Order line quantity of 0, negative, decimal, over 100,000, or a duplicate product in one order | Rejected by the server |
| Cron/tick endpoint without the correct `Authorization: Bearer` secret | Rejected. A secret in the query string must not work |

---

## 6. Pooling concepts you must understand

A short glossary first.

| Term | Meaning |
| --- | --- |
| **Pool** | A daily collection of paid orders. |
| **Sheet / RFQ** | Under the new engine, one request for quotation per **category x delivery zone x day**, listing every item pooled. Vendors bid on the whole sheet. |
| **Cycle** | The older per-material pool. Still used while `sheets.enabled` is off. |
| **Reference price** | The lowest live listing price among sellers who serve the buyer's zone. Freezes at pool close, before bidding. |
| **Rank 1/2/3** | The top three scored bids. Each is offered the whole sheet in turn. |
| **Cascade** | If rank 1 declines or times out, rank 2 is offered, then rank 3. |
| **Revert** | If all three decline, each line reverts to the seller the buyer picked, at the price they picked. If that seller cannot supply, the line is refunded. |
| **GRN** | Goods Received Note. Issued by the fulfilment centre. Makes the seller payable and credits the buyer's saving. |
| **Escrow** | The buyer's payment is held until goods are received. |
| **Savings credit** | The buyer's 50% share of any verified saving. Not cash while withdrawals are off. |
| **KYC** | Seller identity and business verification, done by Admin. |
| **Fulfilment centre / pickup station** | A BuildersPool place that receives goods. Buyers can collect there. |
| **Zone** | A group of localities with one delivery fee. Zones decide pooling, fee and which sellers can supply. |

### 6.1 The daily timeline (new category-sheet engine)

| Time (Lagos) | Event |
| --- | --- |
| Before 12:00 | Buyers order and pay. Paid lines join today's pool. After 12:00 they join tomorrow's. |
| **12:00** | Pool closes. Sheets freeze. Reference prices fix. RFQs open to approved vendors. |
| 12:00 to 15:00 | Vendors price every item and send one blind bid. |
| **15:00** | Bids close. Bids above the reference are ruled out. The rest are scored. Top three ranked. |
| 15:00 to 16:00 | Rank 1 may accept. |
| 16:00 to 17:00 | Rank 2 may accept. |
| 17:00 to 18:00 | Rank 3 may accept. |
| **18:00** | Final result. No taker: lines revert to the picked seller, or are refunded. |

The older per-material cycles run at 17:00 (pool close), 18:00 (bids close), 19:00 (accept deadline) and 19:50 (final). The settings guard requires that bids close plus three accept windows equals the final time.

---

## 7. Functional requirements by module

Each requirement has an acceptance criterion you can test. "Expected" means the product must behave this way. IDs are stable. Quote them in bug reports.

### 7.1 Buyer: authentication (`BUY-AUTH`)

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| BUY-AUTH-1 | Sign up | Name, email and password (minimum 8 characters) are required. A duplicate email is refused with a clear message. After sign-up the buyer lands on `/account`. |
| BUY-AUTH-2 | Log in and out | Valid credentials sign in. Wrong credentials show a generic error. "Log out" ends the session server-side. Back button after logout does not show private data. |
| BUY-AUTH-3 | Rate limiting | After 5 failed sign-ins for one identifier within 15 minutes the sixth is locked, with a message that says so. |
| BUY-AUTH-4 | Email verification | A link is emailed. Opening it verifies the account. Until then a dismissible banner shows on `/account`. It never blocks any action. "Resend verification email" works and shows its result. |
| BUY-AUTH-5 | Forgot and reset password | Request returns the same response for registered and unknown emails. The reset link works once, requires 8+ characters, and **revokes all existing sessions**. |
| BUY-AUTH-6 | Remember me | Session lasts 7 days, or 30 days with "remember me". |

### 7.2 Buyer: browse, product and price alerts (`BUY-CAT`)

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| BUY-CAT-1 | Home page | Hero promise, live pool countdown, four-step "How Pool & Save works", category strip. Countdown matches the next pool close in Lagos time. |
| BUY-CAT-2 | Category mega menu | The hamburger before the logo opens all categories. Pointing at or focusing a category shows up to 8 of its products and a "Shop all in..." link. On phones only the category list shows. Escape closes it. Every item is reachable by keyboard. |
| BUY-CAT-3 | Catalogue | Filters by category and sourcing scope, sorting, pagination, text search. Only non-retired materials with a reviewed price appear. Empty results show a helpful message. |
| BUY-CAT-4 | Search | Header search suggests materials and goes to results. Special characters do not break it. |
| BUY-CAT-5 | Product page | Shows spec, unit, price per unit, gallery, the Pool & Save panel (when the pool closes, units pooled today, 50% savings share) with only real figures. |
| BUY-CAT-6 | Seller offers | When sellers have live listings, offers show cheapest first with seller name, verified badge, price per unit, lead time and shelf life. Selecting an offer changes the displayed price. With no listings, a clear "Buy Direct isn't available" message shows. |
| BUY-CAT-7 | Price alerts | A buyer can set a target price from a product page. It appears under Account > Price alerts as "Watching", or "Target reached" when the catalogue price is at or below target. "Cancel alert" removes it. A target must be a valid price. |

### 7.3 Buyer: cart (`BUY-CART`)

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| BUY-CART-1 | Add, edit, remove | Quantities are whole numbers from 1 to 100,000. Totals update with rolling numbers. Removing a line works, including by swipe on touch devices. |
| BUY-CART-2 | Persistence | A signed-in cart follows the account across devices and browsers. |
| BUY-CART-3 | Seller choice | If sellers have listed, the cheapest offer is the default. A quick-add with no seller adds at the catalogue price. |
| BUY-CART-4 | Reorder | "Reorder" on a past order re-adds its items at **today's** catalogue price. |
| BUY-CART-5 | Empty state | An empty cart shows an empty state with a way back to the catalogue. |

### 7.4 Buyer: checkout and payment (`BUY-CHK`)

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| BUY-CHK-1 | Sign-in required | A signed-out visitor is sent to log in and returns to checkout. |
| BUY-CHK-2 | Area and zone | With `areas.checkoutPickerEnabled` on, the buyer picks a locality. The zone, seller count and delivery fee are shown. A locality with no zone or no fee shows "tell us you want delivery" and forces pickup. The request stores once per phone and locality. |
| BUY-CHK-3 | How to buy | **Pool & Save** works for any cart. **Buy Direct** is available when at least one line has a picked seller. With a mixed cart, lines with a seller go direct and the rest pool, and each line has its own toggle. The summary says "N direct, M pooled". A line with no picked seller cannot be set to Buy Direct, and the server refuses it. |
| BUY-CHK-4 | Delivery or pickup | Delivery needs site address, contact name, contact phone. Needed-by date is tomorrow or later in Lagos time. Delivery fee equals the zone fee (default seeded fee is N15,000 per zone). Pickup is free. |
| BUY-CHK-5 | Saved addresses | The default saved delivery address fills the site, landmark, contact and area. A "Deliver to" list switches between saved addresses or "A different address". "Manage your saved addresses" links to the address book. |
| BUY-CHK-6 | Pickup station | Pickup shows the chosen station's name, address and directions. The buyer's default station is preselected and their saved stations are listed first. If the region has more than one station the buyer can choose for this order. The order records the chosen station. A station from another region is refused by the server. |
| BUY-CHK-7 | Disabled pay button | The pay button names the first missing required field. It enables only when valid. |
| BUY-CHK-8 | Payment | Bank transfer, card or USSD through the chosen gateway. A TEST tag shows in test mode for that gateway. After payment the buyer lands on the order page. |
| BUY-CHK-18 | Distance pricing is invisible while off | With `delivery.distancePricingEnabled` off, or no Google key, checkout shows no "Find your site on the map" box and delivery costs exactly the zone or region fee. (Always test this first.) |
| BUY-CHK-19 | Site search (needs the switch on) | Typing three or more letters shows up to six Nigerian address suggestions. Arrow keys and Enter choose one. A search that returns nothing shows nothing. If Google is down the buyer sees "Address search is unavailable" and the standard area rate applies. A site outside Nigeria is never accepted. |
| BUY-CHK-20 | Distance fee shown | After a site is chosen the Delivery line shows the distance fee and a note such as "12.3 km from Ikeja Hub, 1 trip (Pickup / small van)". The fee is base fare + rate per km per trip, rounded up to the next N50. Changing the cart quantities re-prices it. A site that cannot be priced shows the zone fee and says so; an area with no zone fee tells the buyer to choose pickup. Delivery needs a pinned site, so the pay button says "your site on the map" until one is chosen. |
| BUY-CHK-21 | Price is checked at order time | The order stores the same fee on every line, the site and the working (`deliveryQuote`). If the price changed between the quote and "Pay", the order is refused with the new price and nothing is charged. Pickup orders store no site and no distance fee. |
| BUY-CHK-9 | Payment start failure | If Paystack cannot start, the order still exists as "Awaiting payment". The order page offers a retry. No error page appears. |
| BUY-CHK-10 | Webhook | A successful payment webhook marks the order paid exactly once and joins the right pool (see BUY-ORD-4). A repeated webhook changes nothing. A webhook with a bad signature is rejected. |
| BUY-CHK-11 | After-pool-close payment | A payment confirmed after the pool close joins the **next day's** pool. |
| BUY-CHK-12 | Payment gateway | A "Payment gateway" choice offers Paystack and Credo Pay. A gateway that is not configured is disabled with "Not configured yet". The order records the chosen gateway, and "Pay now" on the order page uses the same gateway. |
| BUY-CHK-13 | Savings credit | A buyer with an available balance sees "Apply savings credit", ticked by default, with the amount. Total due falls by the credit, never below zero. The server applies credit oldest first and only what the order needs: a part-used entry is split and the remainder stays available. The order page shows "Savings credit applied" and the amount due. Placing two orders at once cannot spend the same credit twice. |
| BUY-CHK-14 | Fully covered order | When credit covers the whole total, the button reads "Place order with savings credit", no gateway opens, and the order is confirmed as paid at once and joins the pool or goes to the seller as normal. |
| BUY-CHK-15 | Amount charged | The gateway is asked for the total **after** credit, and the payment is accepted only when the paid amount equals that total exactly. |
| BUY-CHK-16 | Delivery not available | With the area picker on, the Delivery option shows why it is unavailable ("Select your area first" or "Pickup only in this area") and checkout defaults to Pickup when the chosen area has no delivery. |
| BUY-CHK-17 | One payment, one order | The redirect back from Credo confirms an order only when the paid transaction was started for that order. Using another order's transaction reference leaves the order unpaid. |

### 7.5 Buyer: orders (`BUY-ORD`)

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| BUY-ORD-1 | Order list | `/orders` lists orders newest first with number, status, date, item count and total, inside the account menu. |
| BUY-ORD-2 | Order detail | Shows a progress tracker, line items, fulfilment details and a plain-language status per line. |
| BUY-ORD-3 | Line statuses | Pool & Save: "In today's pool", "Suppliers are bidding", "Choosing a supplier", "Supplier confirmed". Buy Direct: "Waiting for the seller to accept" with the deadline. |
| BUY-ORD-4 | Pool membership | A paid Pool & Save line joins the pool for its category and zone for the day. Two orders from different localities in the same zone join one sheet. |
| BUY-ORD-5 | Fallback wording | When no supplier takes a pooled line the buyer is told plainly what happened. The accepted wording is: if no supplier takes the pool, the order goes to the seller the buyer chose at the price they paid. Only if that seller cannot supply is the line refunded. The old wording "the unfilled amount is refunded" must not appear for the new engine. |
| BUY-ORD-6 | Refund due | A refund due shows the amount and reason. It is recorded only. |
| BUY-ORD-7 | Receipt | When the fulfilment centre issues the GRN, the receipt number shows on the tracker. |
| BUY-ORD-8 | Ownership | A buyer can only open their own orders. Another buyer's order id returns not found. |

### 7.6 Buyer: account (`BUY-ACC`)

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| BUY-ACC-1 | Overview | Cards for account details, address book (default pickup station and delivery address), savings credit balance, price alerts count, and the 5 most recent orders with "View all". |
| BUY-ACC-2 | Left menu | Overview, Orders, Savings credit, Address book, Price alerts, Profile, Log out. The current page is marked. On phones the menu is a scrollable row of tabs and the page has no horizontal scroll. |
| BUY-ACC-3 | Account menu (header) | "Hi, FirstName" opens My account, Orders, Savings credit, Address book, Price alerts, Log out. Works by mouse and keyboard. Shown from the tablet width up. |
| BUY-ACC-4 | Profile | Name (required), phone, business name, job-site location are editable. Email is read-only. "Saved." shows on success. An empty name shows "Name is required." beside the button, not an error page. |
| BUY-ACC-5 | Savings credit | Shows Available, Withdrawal requested, Paid out so far (when withdrawals are enabled) or one balance plus "Withdrawals aren't available yet" (when disabled). Entries show "You paid X, actual cost Y" and the buyer's share. |
| BUY-ACC-6 | Withdrawal | Only offered when enabled and the balance is above zero. It asks for confirmation first. When disabled, the server refuses even if called directly. |
| BUY-ACC-7 | Price alerts page | Lists alerts with target, current price, status and "Cancel alert". Empty state links to the catalogue. |

### 7.6a Buyer: notifications (`BUY-NOT`)

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| BUY-NOT-1 | Bell | A signed-in buyer sees a bell in the header with an unread count, the latest notifications, "Mark all read" and a link to the full page. Each item links to the order or page it is about. |
| BUY-NOT-2 | Page | `/account/notifications` lists notifications newest first with an icon per type, "Mark read" on each and "Mark all as read (N)". The empty state reads "No notifications yet". Notifications is in the account left menu. |
| BUY-NOT-3 | Events | A buyer is notified when: an order is placed, payment is confirmed, a supplier confirms or is assigned, goods are received at the centre, savings credit is added, a delivery status changes, a line is refunded, or a price alert target is reached. |
| BUY-NOT-4 | Reminders | An unpaid order gets one reminder 30 minutes to 24 hours after it was placed. A cart left for 2 to 48 hours gets at most one reminder per day. A seller gets one reminder before an award, Buy Direct order or sheet offer expires. A repeated run never sends a second copy. |
| BUY-NOT-5 | Channels | Every notification shows in the app. It is also emailed when email is set up and the person has email on. **SMS and WhatsApp are used only for key events**: payment confirmed, order updates, delivery updates, payment reminders, and for sellers an award, a sheet offer, a Buy Direct order and the reminder before one expires. Cart reminders, price alerts, savings credit, order placed and broadcast pool notices never use them. A text goes out only when the platform switch is on, the person has that channel on, they have a phone number, and a provider key is set; otherwise the attempt is logged as skipped. A disabled user gets nothing. |
| BUY-NOT-6 | Never blocks | A notification failure must not stop checkout, payment confirmation, goods receipt, a seller accepting, or the pool clock. |
| BUY-NOT-7 | Ownership | A buyer can mark only their own notifications read. |
| BUY-NOT-8 | Choose channels | `/account/notifications` has "How we reach you" with Email, Text message (SMS) and, when the platform allows it, WhatsApp. Unticking a box and saving stops that channel (in-app alerts stay). "Saved." shows beside the button. A channel the platform has switched off is not shown. Without a phone number the page says so and links to the profile. A seller owner sees the same choices on Settings, with a phone number field (10 to 16 digits, otherwise an error beside the button). Staff see their owner's choices read-only. |
| BUY-NOT-9 | Message format | A text message is plain characters only (no naira sign, no em dash), at most 160 characters, with a link to the order or page. Numbers typed as 08012345678, +2348012345678 or 8012345678 all work. |

### 7.7 Buyer: address book (`BUY-ADDR`)

Two tabs: **Pickup station** and **Door delivery**.

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| BUY-ADDR-1 | Save a pickup station | "Add pickup station" lists stations the buyer has not saved, filterable by region. A buyer can only save stations the company runs. The first saved station becomes the default. |
| BUY-ADDR-2 | Default and remove | "Set as default" changes the default (only among saved stations). "Remove" asks first. Removing the default makes the next saved station the default, or none. |
| BUY-ADDR-3 | Add a delivery address | Fields: receiver name (2 to 80 characters), phone (10 to 15 digits, optional +), address (8 to 200 characters), landmark (optional, up to 120), area (when the area picker is on). Name and phone are prefilled from the profile. Errors appear inside the dialog. |
| BUY-ADDR-4 | Limits and defaults | At most 10 addresses. The first address is the default. "Set as default" moves the default. Edit and Delete work. Deleting the default makes the oldest remaining address the default. Delete asks first. |
| BUY-ADDR-5 | Empty states | Each tab shows an empty state with a button when nothing is saved. |
| BUY-ADDR-6 | Ownership | A buyer cannot edit or delete another buyer's address or station by changing an id. |
| BUY-ADDR-7 | Old link | `/account/pickup` redirects to `/account/addresses`. |

### 7.8 Seller: join and verification (`SEL-KYC`)

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| SEL-KYC-1 | Sign-up | Business name, owner name, email, password (8+) required. Email verification link works. Seller sign-up is separate from buyer sign-up. |
| SEL-KYC-2 | Submit KYC | The form has sections Business, Identity, Bank account for payouts and Supporting document, plus the terms checkbox. Required: business registration number, TIN (6 to 20 letters, digits or hyphens), business address (10+ characters), CAC number, ID type and number, bank name, 10-digit account number, account name. Document: PDF, JPEG or PNG up to 4 MB, optional expiry date (today or later). |
| SEL-KYC-3 | Validation keeps answers | A validation failure (for example a 9-digit account number) shows a message beside Submit and **keeps every typed answer**. Clicking "Verify CAC number" also keeps the other fields. |
| SEL-KYC-4 | CAC check | "Verify CAC number" checks the number against the registry when keys are configured. Success shows the company name. A failure shows the reason. Changing the number clears the old result. |
| SEL-KYC-5 | Statuses | Not started, Pending review, Verified, Rejected (with reason and "Fix them below and resubmit"), Suspended (with reason). After submission the form becomes a read-only "Your details" summary. |
| SEL-KYC-6 | Terms | Accepting terms is part of submission and is recorded by version. If the terms version changes, an owner sees a banner and re-accepts. |
| SEL-KYC-7 | Staff | Seller staff cannot submit or change KYC. They see "Only the account owner can submit these details" or the read-only summary. |
| SEL-KYC-8 | Expiry warning | A supporting document near or past its expiry shows a warning on the page. |
| SEL-KYC-9 | Change bank details | An approved owner sees "Payout bank account" (account number masked) with "Change bank details". Submitting a bank, a 10-digit account number and an account name sends a 6-digit code to the owner's email. The code works for 10 minutes, allows 5 wrong tries (then the request cancels), and at most 3 codes per request (60 seconds apart). Entering it moves the request to "Your change is under review". Staff cannot see or use this. Only one request can be open at a time. The owner can cancel. A rejected change shows its reason for 14 days and payouts stay with the old account. |

### 7.9 Seller: settings, zones and categories (`SEL-SET`)

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| SEL-SET-1 | Business profile | Shows business name, registration number, location, "Category you bid in most", regions served, contact email. |
| SEL-SET-2 | Request zones and categories | The owner ticks delivery zones and product categories. New ticks become "Waiting for approval". Approved rows are locked and stay ticked ("Approved rows stay ticked"). Unticking a pending request withdraws it. Staff see the lists read-only. |
| SEL-SET-3 | National supply | A seller flagged national supply sees "supplies every delivery zone" and nothing to choose. |
| SEL-SET-4 | Verification card | Shows the status badge (including Suspended) and a link whose text follows the status (Start verification, View your submission, Resubmit your documents, View your details). |

### 7.10 Seller: listings (`SEL-LST`)

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| SEL-LST-1 | Add a listing | Choose a product (grouped by category), price, stock, lead time, shelf life (required for perishables), photos. The chosen category shows under the picker. One listing per seller and product. |
| SEL-LST-2 | Upload checks | Outcome is Pass (goes live if the seller is KYC-approved), Needs review (held for admin), or Reject (with reason). Rules: no photo rejects; a photo under 1000 px on the shorter side rejects; a price outside 50% to 150% of other sellers' median goes to review; perishable items need a shelf life of at least 30 days; a duplicate goes to review. The seller sees the reasons. |
| SEL-LST-3 | Unapproved seller | A listing that passes but belongs to a seller without KYC approval stays **Draft** with the note "It goes live once your KYC is verified". |
| SEL-LST-4 | Draft explanation | A Draft with no reasons says "Not live yet. Save changes to run the checks and put it live." |
| SEL-LST-5 | Photo removal | Removing a photo re-runs the checks. A live listing that still has a good photo **stays live**. A listing left with none says what to fix. Paused, flagged and admin-decided listings keep their status. |
| SEL-LST-6 | Pause and resume | A live listing can be paused and resumed. Only a live listing can be paused. |
| SEL-LST-7 | Buyer visibility | A listing appears to buyers only when it is Live, in stock (stock above zero) and its seller is KYC-approved, active and not suspended. |
| SEL-LST-8 | Reference price | Sellers never see the reference price on listing screens. |

### 7.11 Seller: RFQs and bids (`SEL-RFQ`)

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| SEL-RFQ-1 | RFQ list | Shows only RFQs for categories and zones the seller is approved for (or all zones for national supply), plus any they have bid on. Rows show category, zone, item count, close time and one badge for the seller's own position (Bid sent, Ruled out, Offer waiting for you, Waiting your turn (rank N), You won this RFQ). |
| SEL-RFQ-2 | Blind bidding | A seller never sees another seller's price, identity, rank or bid count. A buyer never sees bids before the award. |
| SEL-RFQ-3 | Bid form | The seller prices **every** item, reviews, then sends **one** bid. It cannot be edited. A price above an item's limit warns, and any price above its limit rules out the whole bid at bids close. |
| SEL-RFQ-4 | Scoring | See 8.3. A winner's page shows points and a one-line reason for each of six criteria. |
| SEL-RFQ-5 | Offers | The ranked vendors are offered the whole sheet one hour each. Accept or decline. A waiting vendor sees their rank. |
| SEL-RFQ-6 | Supply | A winner sees each line at their bid price, the quantity and the fulfilment centre address. No buyer identity is shown. |
| SEL-RFQ-7 | Bid timing | A bid cannot be submitted after bids close. |

### 7.12 Seller: older per-material bids and allocations (`SEL-BID`, `SEL-ALC`)

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| SEL-BID-1 | My bids | Lists bids with status Open, Partly awarded, Awarded, Not awarded, Withdrawn, quantity, delivery days, time and price per unit. |
| SEL-BID-2 | Withdraw | An open bid can be withdrawn after a confirmation. A closed pool or a bid that is not open returns a message inside the dialog ("Bidding has closed for this pool, so the bid can't be withdrawn."). |
| SEL-ALC-1 | Allocations list | Shows material, status (Awaiting your reply, Accepted, Delivered, Cancelled), quantity, "Accept by" date and time in Lagos time, the fulfilment centre to deliver to, and payout status. |
| SEL-ALC-2 | Accept | Accept works only before the deadline and only for a KYC-approved seller. Accepting twice does nothing the second time. |
| SEL-ALC-3 | Decline | "Decline" asks "Decline this award? It goes to the next supplier and you can't undo this." The award then passes **once** to the next-ranked bid. A passed award that is not accepted is final and does not pass again. |
| SEL-ALC-4 | Release reasons | Cancelled awards say why: declined, not accepted in time, or released because the account was suspended. |

### 7.13 Seller: Buy Direct orders (`SEL-DIR`)

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| SEL-DIR-1 | Incoming order | A Buy Direct line arrives with a 24-hour accept window (`direct.acceptWindowHours`). Stock is reserved while it waits. |
| SEL-DIR-2 | Accept or decline | Accept and decline are available with a visible deadline. A decline or a timeout **refunds the buyer** in the ledger. |
| SEL-DIR-3 | Commission | Buy Direct commission is 3% (`fees.buyDirectCommissionPct`). The seller's payable is the line value less that commission. |

### 7.14 Seller: payouts (`SEL-PAY`)

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| SEL-PAY-1 | All sources | The payouts page counts payouts from the older bids, Buy Direct lines and RFQ awards. Lines the seller declined, let lapse, or that ops marked not supplied are excluded. |
| SEL-PAY-2 | Cards | Paid out, On its way (awaiting receipt or payment), On hold. Amounts are exact to the kobo. |
| SEL-PAY-3 | Status wording | Seller wording is Awaiting receipt, Being paid, Paid, On hold. Ops wording is Awaiting GRN, Cleared for payout, Disbursed, On hold. |
| SEL-PAY-4 | History | A filterable list with source (Pool bid, Buy Direct, RFQ), amount, status, paid-on date and reference. An empty state when there is nothing. |
| SEL-PAY-5 | Switch | With payouts disabled, no payout can be disbursed. |

### 7.15 Seller: team (`SEL-TEAM`)

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| SEL-TEAM-1 | Add staff | Owner adds a staff member (name, valid email). Up to 10 staff. An existing email is refused. A one-time invite link is shown **once**, with a copy button, valid for 72 hours. It lets the staff member choose their own password. |
| SEL-TEAM-2 | New invite link | For a staff member who has not used their invite, "New invite link" issues a fresh link and the old one stops working. Refused once they have a password. |
| SEL-TEAM-3 | Remove | Removal asks first. The person is signed out immediately and cannot sign in again. |
| SEL-TEAM-4 | Permissions | Staff can bid, manage listings and work orders and allocations. They cannot change KYC, bank details, terms or the team, and they cannot open the Team page. |

### 7.16 Seller: account menu and notifications (`SEL-UI`)

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| SEL-UI-1 | Top-bar menu | On large screens the avatar becomes "Hi, Name" with Settings, KYC verification, Payouts, Team (owner only) and Log out. |
| SEL-UI-2 | Bell | The in-app bell lists pool, sheet and Buy Direct notifications (new pool or request, closing soon, award, award passed on, order waiting for acceptance, reminder before an offer expires) and marks them read. Sellers also receive them by email, and by SMS and WhatsApp when a provider is configured. |

### 7.17 Admin: vendor verification and sellers (`ADM-VER`)

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| ADM-VER-1 | Review KYC | Approve, reject (reason required) or suspend (reason required) a seller. Approve and reject act only on a pending submission. Suspend and reactivate are reversible and audited. |
| ADM-VER-2 | Reviewer aids | The reviewer sees the bank-account-name match against the registry or business name, the CAC result and the document. |
| ADM-VER-3 | Errors | A failed decision shows its message inside the dialog. |
| ADM-VER-5 | Bank-detail changes | `/admin/verification` lists changes waiting for review, oldest first, with old and requested details side by side, the name-match result and when the code was confirmed. Ops can require a confirmation call (the owner's phone number is shown). A required call must be logged with a note (10+ characters) before **Approve** works. Approve asks first, replaces the details, and emails the seller. Reject needs a reason (5+ characters), keeps the old account and emails the seller. While a request is waiting for review, any payout to that seller is refused with a clear message. Everything is audited. |
| ADM-VER-4 | Coverage | Admin approves or revokes each zone request and each category request. National supply can be switched on or off (asks first). |

### 7.18 Admin: listings, materials, areas, pickup stations (`ADM-CAT`)

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| ADM-CAT-1 | Listing review | Only flagged listings wait here. Approve or reject with a note. Decisions are audited. |
| ADM-CAT-2 | Materials | Edit catalogue materials and prices. "Retire" asks first and removes the material from the buyer catalogue. "Restore to catalog" reverses it. |
| ADM-CAT-3 | Zones and localities | Create a zone, set its delivery fee (blank means no fee, so pickup only), activate or deactivate (deactivate asks first), assign a locality to at most one zone. Moving a locality never changes paid orders or open pools. |
| ADM-CAT-4 | Pickup stations | Add, edit and delete stations (name 3 to 80 characters, region Abuja, Lagos or Kano, address 8 to 200 characters). A duplicate name in a region is refused. A station used by an order can be edited but not deleted. The last station in a region cannot be deleted. A station cannot move region once orders exist. Deleting asks first and states how many buyers saved it. |
| ADM-CAT-5 | Visibility | A new station appears on buyers' address book and checkout straight away. |
| ADM-CAT-6 | Station map position | Latitude and longitude are optional, but both or neither. Latitude must be 4 to 14 and longitude 2.5 to 15 (Nigeria), or the save is refused with a message. A station without a position shows "No map position yet" in the list. |

### 7.18a Admin: delivery pricing (`ADM-DLV`)

Page: `/admin/delivery-pricing` (sidebar: "Delivery pricing"). Switched off; see known gap G15.

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| ADM-DLV-1 | Readiness checklist | Shows four checks with a tick or an open circle: Google Maps key set, a rate on every active vehicle class, a map position on every centre, a confirmed weight on every buyer-visible item. Shows "Off: checkout still uses the zone or region fee" while the switch is off. Counts (for example "28 of 28 items still need a confirmed weight") match the data. |
| ADM-DLV-2 | Vehicle classes | Four classes are listed: Cargo tricycle, Pickup / small van, Dropside truck, Flatbed truck. Each has maximum load (kg), longest item (m), rate per km (naira) and an "In use" tick. A class with no rate is never used. Switching "In use" on without a rate is refused with a message. Saving is audited. |
| ADM-DLV-3 | Item weights | Every buyer-visible item is listed with weight per unit (kg), longest side (m) and a "Confirmed" tick. Ticking "Confirmed" with no weight is refused. An estimate that is not confirmed never sets a fee. Saving is audited. |
| ADM-DLV-4 | Switch is guarded | In `/admin/settings`, group "Delivery pricing", turning on `delivery.distancePricingEnabled` is refused with "Delivery pricing is not ready" and the list of missing items until all four checks pass. Turning it off is always allowed. |
| ADM-DLV-5 | Settings validation | Base fare accepts whole naira from 0 to 1,000,000 (default 3,000). Rounding accepts 1 to 10,000 (default 50). |
| ADM-DLV-6 | Checkout unchanged | With the switch off, checkout shows the same delivery fees as before (zone fee, or region charge when the area picker is off). |

### 7.19 Admin: running the pool and paying out (`ADM-OPS`)

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| ADM-OPS-1 | Pool sheets | See sheets freeze, take bids, score, offer and settle. Every step is audited and safe to repeat. |
| ADM-OPS-2 | Freeze and award now | "Freeze pool now" and "Award this pool now" ask first. They run once even if triggered together with the scheduled job. |
| ADM-OPS-3 | GRN | Issuing a goods received note makes the seller payable and credits the buyer's saving in the same transaction. |
| ADM-OPS-4 | Hold and not supplied | Hold or release a payout. "Mark this line as not supplied" asks first and sends the line back or refunds it. |
| ADM-OPS-5 | Disburse | "Disburse" asks first. With payouts disabled it is refused. |
| ADM-OPS-6 | Savings settlement | "Mark this withdrawal as paid" asks first. |
| ADM-OPS-7 | Haulage | Assign, advance and cancel dispatch (cancel asks first). Status runs assigned, at pickup, in transit, delivered. |
| ADM-OPS-8 | Orders | List and detail views and a CSV export. Dates show Lagos time. |
| ADM-OPS-9 | Error handling | Any failed action shows its message beside the button. No raw error page. Database errors show a generic message, never raw text. |

### 7.20 Admin: settings, users, audit (`ADM-SYS`)

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| ADM-SYS-1 | Settings validation | Scoring weights must sum to 100. Times must be in order. Bids close plus three accept windows must equal the final time, or the save is refused with a clear message. |
| ADM-SYS-2 | Users and team | View users, disable or re-enable, manage the operations team. Disabling signs the person out immediately. Re-enable and disable ask first where destructive. |
| ADM-SYS-3 | Audit log | Append-only. Every important admin action records who, when and what. A failed audit write must not block the action. |
| ADM-SYS-4 | Closed system | Admin has no public sign-up. Admin passwords are 12+ characters. |

---

## 8. Business rules and calculations

### 8.1 Money

- **Whole kobo only.** Amounts are integers. Check that totals, splits and refunds add up exactly.
- **Ledger is append-only and idempotent.** Each posting has a unique key. Posting the same event twice makes one row. Updates and deletes are refused. Corrections are new opposite entries.
- **Savings split.** Buyer share is `fees.poolSavingsBuyerSharePct` (default 50%). BuildersPool keeps the rest. **Any odd kobo goes to the buyer**, so the two shares always sum exactly to the saving.
- **Buy Direct commission** is 3% of the line value.
- **Seller payable.** Pool: bid price x quantity. Buy Direct: line value less 3%.
- **Refund (whole kobo)** for unfilled quantity:
  `refund = locked unit price x unfilled units + round(delivery cost x unfilled units / ordered units)`
- **Savings credit at checkout.** Credit is spent oldest entry first. If an entry is larger than what is still needed, it is split: the used part is marked "Used at checkout" and the rest stays available. The amount used is stored on the order (`savingsApplied`) and posted to the money ledger as a negative credit entry, once per order. The amount due is `gross total - credit applied`, never below zero. A payment is accepted only for exactly that amount. Known limits: G17 and G18.
- **Delivery fee (today)** is a flat fee per zone (seeded at N15,000 in each of five zones). A zone with no fee offers pickup only.
- **Delivery fee (distance pricing, built but off, G15).** When switched on and a quote can be worked out:
  1. Load = sum of (quantity x weight per unit) over the order lines. Only confirmed weights count. A line with no confirmed weight makes the quote fail.
  2. Pick the smallest active vehicle class with a rate whose maximum load covers the load and whose longest-item limit covers the longest item.
  3. A load over the biggest class is split into full trips of the biggest class plus the smallest class that fits the remainder.
  4. Each trip costs base fare (default N3,000) + the class's rate per km x road km from the nearest fulfilment centre to the delivery address (Google Maps).
  5. Add the trips and round **up** to the next N50.
  6. The fee is stored as the same amount on every order line, so refunds pro-rate it as before.
  If the switch is off, the key is missing, a weight is unconfirmed, no centre has a position or the lookup fails, the zone fee applies. No estimated or straight-line fee is ever charged.
  Worked example (rates are made up for illustration): 20 bags of cement is 1,000 kg, so a Pickup / small van. At N200 per km and 12.3 km: 3,000 + 200 x 12.3 = 5,460, rounded up to N5,500.

### 8.2 Reference price and eligibility

1. Reference price per item = lowest live listing price among sellers who serve the buyer's zone. It freezes at pool close.
2. A vendor must bid **every** item on a sheet.
3. A bid above the reference price on **any** line rules out the whole bid (reason code recorded).
4. Only KYC-approved, non-suspended vendors registered for the category and zone can bid. A seller approved for Zone A only cannot see or bid in Zone B. National-supply sellers can bid in any zone.
5. Reason codes on ineligible or excluded bids include `NOT_APPROVED`, `OUTSIDE_SERVICE_AREA`, `INVALID_BID`, `OVER_WINNER_CAP`, `BELOW_MIN_BIDS`, `AWARD_DECLINED`, `AWARD_EXPIRED`, `SELLER_SUSPENDED`.

### 8.3 Scoring

Six criteria, weights editable by admin and always summing to 100. Defaults:

| Criterion | Weight |
| --- | --- |
| Competitive landed price (unit plus delivery) | 30 |
| Historical performance | 20 |
| Quantity and capacity | 20 |
| Delivery speed and SLA | 15 |
| Geographic suitability | 10 |
| Bid responsiveness and completeness | 5 |

- A new supplier scores a neutral **50 out of 100** on performance until **5 completed orders**.
- **Ties** break by lowest price, then better performance, then earliest submission.
- Every award stores points and a one-line reason per criterion. Changing a weight changes **only future awards**.
- Known placeholders: geography is 100 if the seller serves the region, and responsiveness is 100 for every complete bid.

### 8.4 Cascade and fallback

- The top three eligible sheets are offered in rank order, one hour each.
- Decline or timeout offers the next rank immediately. After rank 3, **the RFQ cancels once**.
- Every line then reverts to the seller the buyer picked at the price the buyer picked. If that seller is out of stock or suspended, **only that line** is refunded.
- Fallback processing runs once. Running the job twice produces one refund entry, not two.
- The system never buys from a supplier the buyer did not authorise.

### 8.5 Order and quantity rules

- Line quantity is a whole number from 1 to 100,000. No duplicate product in one order.
- A paid pooled line joins the pool for its category and zone for that day. Paid after pool close joins the next day.
- A delivery order with no locality is refused when the area picker is on.

### 8.6 Seller upload checks (listings)

See SEL-LST-2. Additional rule: sellers never see the reference price on listing screens.

### 8.7 Settings reference (defaults)

| Area | Setting | Default |
| --- | --- | --- |
| Older cycles | pool close / bids close / accept deadline / final | 17:00 / 18:00 / 19:00 / 19:50 |
| Sheets | `sheets.enabled` | off |
| Sheets | pool close / bids close / accept window / final | 12:00 / 15:00 / 60 minutes / 18:00 |
| Pool | max winners per category per zone | 5 |
| Pool | minimum eligible bids per line | 1 (open business decision: 1 or 2) |
| Direct | seller accept window | 24 hours |
| Delivery | `delivery.distancePricingEnabled` | off (cannot be switched on until ready) |
| Delivery | `delivery.baseFare` / `delivery.roundTo` | N3,000 / N50 |
| Fees | Buy Direct commission | 3% |
| Fees | buyer's savings share | 50% |
| Money | seller payouts / withdrawals | off / off |
| Accounts | terms version / document expiry warning | v1 / 30 days |

---

## 9. Test scenarios

### 9.1 Smoke test (run after every deployment, about 15 minutes)

1. Home page loads with a real countdown. Hamburger menu opens and shows categories and products.
2. Sign up a new buyer (`QA-Buyer-<date>`), log out, log in.
3. Add two items to the cart. Totals are correct.
4. Checkout with Pickup. Place the order. Complete payment with the Paystack test card. The order shows as paid.
5. Open Account > Address book. Add a delivery address. Return to checkout with Delivery: the address prefills.
6. Log in as the seller. Open Listings, RFQs, Allocations, Payouts, Settings. Each loads without errors and shows sensible empty states.
7. Log in as admin. Open Dashboard, Orders, Pickup stations, Settings. Each loads. Open the audit log: your actions appear.
8. Confirm a signed-out visitor is redirected away from `/account`, `/seller`, `/admin`.

### 9.2 End-to-end scenarios

| # | Scenario | Key checks |
| --- | --- | --- |
| E1 | **Buyer, Pool & Save, pickup.** Order, pay, wait for the pool, collect. | Line status progression, GRN receipt number, savings credit equals 50% of the verified saving, correct kobo. |
| E2 | **Buyer, Buy Direct, delivery.** Pick a seller listing, choose delivery, fill site, pay. | Delivery fee equals zone fee. Seller sees a 24-hour accept window. Buyer sees "Waiting for the seller to accept". |
| E3 | **Seller declines Buy Direct line.** | Buyer is refunded in the ledger. Order page shows the refund due with the reason. |
| E4 | **Seller does not respond in 24 hours.** | Line times out and is refunded. |
| E5 | **New seller onboarding.** Sign up, verify email, submit KYC, admin approves, request a zone and category, admin approves both, add a listing with a 1000 px+ photo. | Each step shows its status. The listing goes live. A buyer then sees it on the product page. |
| E6 | **Listing check outcomes.** Add listings that (a) have no photo, (b) have a 500 px photo, (c) price 10 times the median, (d) perishable with 20 days of life, (e) duplicate an existing listing. | Rejected, rejected, needs review, rejected, needs review. Reasons shown. |
| E7 | **RFQ end to end** (only when `sheets.enabled` is on; ask the product owner). Two pooled orders in one category and zone. Two vendors bid. | One sheet per category and zone. Bid above the reference is ruled out. Winner chosen by score with reasons. Rank 1 declines, rank 2 is offered. |
| E8 | **Cascade exhausted.** Rank 1 declines, rank 2 lapses, rank 3 declines. | RFQ cancels once. Lines revert to the picked seller at the picked price. If that seller is unavailable, only that line refunds. |
| E9 | **Late payment.** Confirm a payment after pool close. | Order joins tomorrow's pool. |
| E10 | **Receive and pay.** Admin issues a GRN on an accepted allocation. | Seller becomes payable. Buyer savings credit posts in the same moment. Disburse is refused because payouts are off, with a visible reason. |
| E11 | **Hold and not supplied.** Hold a payout. Mark a line not supplied. | Both ask first (not-supplied), both are audited, and the line reverts or refunds. |
| E12 | **Suspend a seller.** Suspend a seller holding one pending and one accepted award. | Only the pending award is released. The seller cannot bid. |
| E13 | **Address book to checkout.** Save two pickup stations and three delivery addresses, change defaults, delete the default. | Defaults update correctly and checkout reflects them. |
| E14 | **Admin adds a pickup station.** | It appears for buyers at once. Deleting it after an order used it is refused. |
| E16 | **Pay with savings credit.** Give a QA buyer credit, add items, leave "Apply savings credit" ticked, pay. | Total due falls by the credit. The credit entry shows "Used at checkout". The order page shows the credit line and the amount due. Cancelling the ticked box charges the full total. |
| E17 | **Credit covers the whole order.** Use a small cart and a larger credit. | Button reads "Place order with savings credit". No gateway opens. The order is paid at once. The unused part of the credit entry stays available. |
| E18 | **Mixed cart.** Pick a seller for one item only, use Buy Direct. | That line is Buy Direct, the other pools. The order page shows each line's own status. |
| E19 | **Notifications.** Place and pay an order. Open the bell and `/account/notifications`. | "Order placed" and "Payment confirmed" appear once each, link to the order, and mark read. Repeating the payment check adds nothing. |
| E20 | **Credo reuse (only with demo keys).** Pay one Credo order, then open a second unpaid order of the same total with the first order's `transRef` in the address. | The second order stays unpaid. |
| E15 | **Staff permissions.** Invite a staff member, use the link, sign in as staff. | Staff can bid and work orders. Staff cannot open KYC or Team. Removing staff signs them out. |

### 9.3 Business-rule scenarios (from the rulebook, abridged)

These come from the 26 acceptance scenarios in `docs/floot-port-notes.md` section 4. Run them with the product owner present for any that need the clock or admin settings.

1. **Idempotent stages.** Trigger the tick twice at once and press Award now. Awarded once, no duplicates.
2. **Late payment.** Joins the next day.
3. **Eligibility.** An unapproved seller's bid is excluded with `NOT_APPROVED`.
4. **Blind bidding.** No seller sees another's price, rank or bid count.
5. **Decline cascade.** A declines, B is offered, B lapses, no third award.
6. **One-shot accept.** Accept twice: the second does nothing. Accept after the deadline: refused.
7. **Suspension.** Only unaccepted awards release.
8. **Fallback.** One refund entry, correct kobo, buyer message shown, even if the job runs twice.
9. **Ledger.** Update or delete of a ledger row fails. The same key twice gives one row. An odd-kobo saving splits exactly.
10. **Switches.** With withdrawals and payouts off, the server refuses both and the buttons are hidden.
11. **Security.** Forged cookie, spoofed buyer id, negative or duplicate quantities, wrong cron secret, sixth failed sign-in.
12. **Money check.** The trial balance sums to zero after everything above.
13. **Address rules.** A delivery order with no locality is refused. A locality with no active zone offers pickup only.
14. **Zone move.** Moving a locality mid-day changes nothing for paid orders and open pools. Tomorrow's order uses the new zone. An audit entry exists.
15. **Coverage and pooling.** A seller covering Zone A only cannot see Zone B. Two localities in one zone share a sheet.
16. **Three-rank cascade.** See E8.
17. **Reference price.** A cheaper listing added while the pool is open lowers the reference. After pool close it no longer changes.
18. **Pooled by category.** PPR pipes and cement produce two RFQs, each sent only to vendors registered for that category.
19. **Beat the reference.** A bid above the reference is excluded with a reason. A bid at or below is scored.
20. **Timeline guard.** Settings where bids close plus three windows does not equal the final time are refused.
21. **Revert.** After rank 3 declines, lines go to the picked seller at the picked price.
22. **Upload checks.** See E6.
23. **No fee, no delivery.** A zone without a fee offers pickup only. Entering a fee enables delivery from the next page load. No paid order changes.
24. **National supply.** A national-supply seller appears in every zone's count and can bid anywhere.
25. **Sheet award.** A vendor who bids only some lines is ineligible. The best complete bid wins the whole sheet.
26. **Explainable score.** Every award shows points and a reason per criterion. Changing a weight affects only future awards.

---

## 10. Non-functional requirements

### 10.1 Responsive layout

Test at **375 px (phone), 768 px (tablet), 1280 px (desktop)**. Requirements:

- No horizontal page scroll at any width. (Tab rows and tables that scroll inside their own box are fine.)
- Phone: bottom tab bar on the storefront, tab row for the account menu, sidebar becomes a menu button in the Seller Centre and admin.
- Dialogs fit the screen and scroll inside themselves.

### 10.2 Accessibility (target WCAG 2.2 AA)

| Check | Expected |
| --- | --- |
| Touch targets | At least **44 px** high on phones for buttons, links in lists and form controls. Dense desktop tables may use smaller (never below 24 px). |
| Keyboard | Every interactive element is reachable and operable by keyboard. Menus, dialogs and the mega menu open and close with keys. Escape closes dialogs and menus. |
| Focus | A **visible focus ring** on every focusable element, including links and plain buttons. |
| Dialogs | Focus moves into the dialog and returns to the trigger on close. |
| Forms | Every field has a visible label. Errors are announced (`role="alert"`) and name the problem and the fix. Success messages use `role="status"`. |
| Contrast | Text 4.5:1 or better, large text and UI components 3:1 or better, in light and dark mode. |
| Images | Product images have meaningful alt text, decorative icons are hidden from assistive technology. |
| Motion | Respects `prefers-reduced-motion`. |
| Inputs on phones | Text inputs are 16 px so iOS does not zoom on focus. |

### 10.3 Localisation and formatting

- Currency is Naira with no decimals in the UI (for example `N1,650,000`). Check thousands separators and that rolling number animations settle on the exact value.
- **All times and dates display in Lagos time** (for example "10 Nov 2026, 5pm"). Verify with the device clock set to another time zone.
- Times use the short form "5pm", "7:50pm", "12pm".

### 10.4 Error handling

- No raw error page for a user-correctable problem. Failures appear as a message beside the control or inside its dialog.
- Database or framework errors show a generic line ("Something went wrong. Try again...") and never raw text.
- Destructive or money-moving actions ask for confirmation first (see the list in ADM-OPS, SEL-TEAM-3, BUY-ADDR-2).
- Network loss: the offline page appears for navigations. Forms keep what was typed after a failed submit.

### 10.5 Security (summary of what to verify)

Server-side sessions with httpOnly, sameSite=lax and Secure cookies. Sessions revoke on logout and on password reset. Sign-in rate limit. Server-side validation of every input and id (never trust ids from the browser). Security headers (no framing, nosniff, strict referrer policy). Cron endpoints fail closed without the bearer secret. Seller and admin data is never shown to buyers. Another user's ids in URLs or forms never expose or change their data.

### 10.6 Browsers and devices

Latest Chrome and Safari on desktop and mobile (iOS Safari and Android Chrome) as the minimum. Also check Firefox and Edge on desktop.

### 10.7 Performance (indicative)

Pages should become usable within a few seconds on a mid-range phone over 4G. Report anything that feels stuck, and note the connection used.

---

## 11. Reporting bugs

### 11.1 What to include

1. **Title** in one line.
2. **Requirement ID** (for example `BUY-CHK-6`) or "no matching requirement".
3. **Environment**: URL, role and account used, device, browser and version, viewport width.
4. **Steps to reproduce**, numbered, starting from a known state.
5. **Expected result** and **actual result**.
6. **Evidence**: screenshot or screen recording. For API issues, the request and response.
7. **Frequency** (always, sometimes, once) and the time of the occurrence in Lagos time.
8. **Data created** (the QA-tagged records involved).

### 11.2 Severity

| Severity | Meaning | Examples |
| --- | --- | --- |
| **S1 Blocker** | Money or data is wrong, security is broken, or a core flow cannot be completed. | A buyer charged the wrong amount. A buyer can open another buyer's order. Checkout cannot complete. |
| **S2 Major** | A feature is broken or a rule is wrongly applied, with no reasonable workaround. | Refund amount off by a kobo. An award passes twice. A required validation is missing. |
| **S3 Minor** | A feature works but with a defect or a poor experience. | Wrong wording, a missing empty state, a focus ring missing. |
| **S4 Cosmetic** | Visual only. | Misalignment, spacing, a typo. |

### 11.3 Priorities for testing time

1. Money, ledger and refund calculations.
2. Access control and the security items in section 5.2.
3. Checkout, payment and order creation.
4. Pooling, bidding, awards and fallback.
5. Seller and admin workflows.
6. Layout, accessibility and wording.

---

## 12. Open questions and assumptions

These are undecided by the business. Do not file them as bugs. If your test depends on one, ask the product owner.

See `docs/decisions.md` for decisions made. Still open or not yet built:

1. Final seller commission (3% is in use for testing).
2. The date of the supervised test day, after which the category-sheet engine (`sheets.enabled`) goes live.
3. Seller payouts and savings withdrawals stay off until Paystack is live and reviewed.
4. How long KYC review is expected to take (not stated in the product).
5. Bank-detail changes (OTP, ops review, optional call) are built. The OTP email needs a verified Resend sending domain to reach every seller, so ask the product owner whether it is set before testing SEL-KYC-9.
6. The seller terms text is a draft (`docs/seller-terms-draft.md`). The app still shows the placeholder line.
7. Minimum eligible bids per line is settled at 1.
8. Credit on abandoned orders, refunds where credit was used, SMS and WhatsApp rules, and Credo set-up are undecided (see `docs/decisions.md`, "Review on 25 November").
9. Distance-based delivery pricing waits on the founder: per-km rates, confirmed vehicle capacities, the Google Maps key, station coordinates and confirmed item weights (see `docs/decisions.md`). Its checkout side is built and waiting behind the switch.

---

## Appendix A. Route map

**Storefront:** `/`, `/catalog`, `/catalog/[id]`, `/cart`, `/checkout`, `/orders`, `/orders/[id]`, `/account`, `/account/addresses`, `/account/savings`, `/account/alerts`, `/account/notifications`, `/account/profile`, `/login`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password`, `/offline`.

**Seller Centre:** `/seller/login`, `/seller/signup`, `/seller` (dashboard), `/seller/listings`, `/seller/rfqs`, `/seller/rfqs/[sheetId]`, `/seller/bids`, `/seller/orders`, `/seller/allocations`, `/seller/payouts`, `/seller/kyc`, `/seller/settings`, `/seller/team`.

**Ops admin:** `/admin/login`, `/admin`, `/admin/orders`, `/admin/orders/[id]`, `/admin/sellers`, `/admin/materials`, `/admin/materials/[id]`, `/admin/catalogue-reference`, `/admin/listings`, `/admin/direct`, `/admin/areas`, `/admin/pickup-stations`, `/admin/delivery-pricing`, `/admin/sheets`, `/admin/cycles/[id]`, `/admin/haulage`, `/admin/escrow`, `/admin/savings`, `/admin/users`, `/admin/team`, `/admin/verification`, `/admin/settings`, `/admin/audit-log`.

**API and system:** `POST /api/checkout`, `POST /api/webhooks/payment`, `POST /api/webhooks/credo`, `/api/pool/tick`, `/api/cron/close-cycles`, `/api/cron/cycle-tick`, `/api/cron/notify-closing-soon`, `/api/materials/search`, `/api/seller/search`, `/api/admin/search`, `/api/admin/orders`.

## Appendix B. Status glossary

| Where | Status | Meaning |
| --- | --- | --- |
| Order | Awaiting payment | Created, payment not confirmed |
| Order | Paid | Payment confirmed |
| Order | Cancelled | Cancelled |
| Buyer line | In today's pool | Paid and waiting for pool close |
| Buyer line | Suppliers are bidding | Pool closed, bids open |
| Buyer line | Choosing a supplier | Bids closed, offers going out |
| Buyer line | Supplier confirmed | A vendor accepted |
| Allocation | Awaiting your reply / Accepted / Delivered / Cancelled | Seller's view of an award |
| Bid (older flow) | Open / Partly awarded / Awarded / Not awarded / Withdrawn | Seller's view of a per-material bid |
| Sheet | Collecting orders / Open for bids / Bids closed / Awarded / Cancelled | RFQ stage |
| Seller bid on a sheet | Bid sent / Ruled out / Offer waiting / Waiting your turn / You won | Seller's position |
| Listing | Draft / Being checked / Live / Paused / Needs a fix | Seller listing state |
| KYC | Not started / Pending review / Verified / Rejected / Suspended | Seller verification |
| Payout (seller wording) | Awaiting receipt / Being paid / Paid / On hold | Money due to the seller |
| Payout (ops wording) | Awaiting GRN / Cleared for payout / Disbursed / On hold | Same, in warehouse terms |
| Savings entry | Available / Used at checkout / Withdrawal requested / Paid out | Buyer's savings credit |
| Coverage request | Waiting for approval / Approved / Not approved | Zone or category request |

## Appendix C. Recent changes worth regression-testing

These areas changed most recently and deserve extra attention:

- Category **mega menu** and the header **account menu** (buyer) and **top-bar menu** (seller).
- Buyer **account area** with left menu, and the new **address book** (saved pickup stations and delivery addresses) with checkout prefill.
- **Checkout** changed a lot on 24 November: payment gateway choice (Paystack, Credo Pay), savings credit, mixed Buy Direct and pooled lines, and the clearer Delivery option (BUY-CHK-3, 12 to 17).
- **Notifications**: buyer bell and page, reminders, email, SMS and WhatsApp, with channel choices and key-events-only text messages (BUY-NOT-1 to 9).
- Admin **Pickup stations** screen and the buyer's pickup choice at checkout. Stations now take optional map coordinates (ADM-CAT-6).
- New admin **Delivery pricing** page and settings group (ADM-DLV), and the checkout side of it (site search, distance fee, BUY-CHK-18 to 21). Switched off: confirm that checkout delivery fees did not change.
- Error handling: failures now return a message beside the control, with confirmation dialogs on risky admin actions.
- **Lagos-time dates** everywhere.
- **Seller KYC form** that keeps answers on errors, **listing** re-check after photo removal, **payouts** from all three sources, **allocations** decline confirmation.
