# Decisions log

Business decisions made by the founder, newest first. Pricing and fees are the business's call; engineering only wires what is decided here. Where the code and this log disagree, this log wins and the code is changed.

## 13 November 2026

| # | Topic | Decision | Effect on the product |
| --- | --- | --- | --- |
| D1 | Pickup station | **The buyer chooses the pickup station**, by project location or the closest station. There is no single BuildersPool pickup address. | The home page no longer names Ushafa or opening hours. Admin adds the real stations at `/admin/pickup-stations`. The seeded "Abuja Central, Plot 12, Idu Industrial Area" station is seed data until the team replaces or confirms it. Choosing the nearest station by distance needs station coordinates, which do not exist yet (stations only link to an external map). |
| D2 | Minimum eligible bids per line | **1.** | Matches the existing default (`pool.minEligibleBidsPerLine` = 1). Settled. |
| D3 | Buy Direct commission | **Not decided yet.** Stays at 3% for testing. | The setting `fees.buyDirectCommissionPct` is unchanged. Stays on the open list. |
| D4 | Category-sheet engine go-live | **After one supervised test day.** | `sheets.enabled` stays off. Plan: a full pool day end to end with test orders and QA, with at least two vendors holding live listings, then switch on. |
| D5 | Seller payouts and savings withdrawals | **After Paystack is live and reviewed.** | `money.sellerPayoutsEnabled` and `money.walletWithdrawalsEnabled` stay off. |
| D6 | Seller terms text | **Claude drafts it for founder review.** | First draft in `docs/seller-terms-draft.md`. It is a plain-language draft, not legal advice. It is not published until reviewed. |
| D7 | Bank details after approval | **An approved seller may edit them. A change needs a one-time code (OTP) to the owner's email, then an operations review, and a confirmation call when ops want one** (clarified by the founder, 13 Nov). | Built 13 Nov. The owner starts a change on `/seller/kyc`, confirms a 6-digit emailed code (10 minutes, 5 tries, 3 codes), and the request goes to ops on `/admin/verification`. Ops can require a call and must log it before approving. Selling continues. Payouts to that seller are held while a request is waiting for review. The new details replace the old only when ops approve. The seller is emailed the decision. |

## 13 November 2026 (later): service-area zoning

| # | Topic | Decision | Effect |
| --- | --- | --- | --- |
| D8 | Zoning the 11 unzoned localities | **Two central zones and one zone per outer area council.** | Created `AMAC – City Centre` (Wuse, Garki, Maitama, Asokoro, Apo), `AMAC – Jabi / Utako / Gwarinpa corridor` (Jabi, Utako, Gwarinpa), `Kuje Area Council`, `Kwali Area Council` and `Abaji Area Council`. Every locality is now in a zone (0 unzoned). Audit entries were written for each change. |
| D9 | Fees for the new zones | **None yet.** The new zones are active with no fee, so buyers there can pick up but cannot choose delivery until a fee is set. The five original zones keep their N15,000 flat fee. | The founder asked whether delivery could be priced by distance (Google Maps) instead. That is a design question, not decided: see below. |

## 16 November 2026: distance-based delivery fee

The founder chose to price delivery by load, vehicle and distance (like a ride-hailing fare), not by flat zone fee. Time of day is out of scope for now. Built the same day, switched off, because it cannot be tested or used until the items under "Still owed" exist.

| # | Topic | Decision | Effect |
| --- | --- | --- | --- |
| D10 | Fee formula | **Base fare of N3,000, plus a per-kilometre rate for the vehicle, per trip.** Fee = sum over trips of (base fare + rate per km x road km). The total is rounded **up** to the next N50. | Settings `delivery.baseFare` (3000) and `delivery.roundTo` (50). Rates are the business's numbers and are not set yet. |
| D11 | Vehicle choice | **Automatic, no buyer effort.** The system adds up the weight of the ordered items and picks the **smallest vehicle class that can carry it**, and whose longest-item limit covers the longest item. A load over the biggest vehicle is split: full trips of the biggest class, plus the smallest class that fits the remainder. Each trip pays the base fare. | Four starting classes, all editable at `/admin/delivery-pricing`: Cargo tricycle (500 kg, 2.5 m), Pickup / small van (1,500 kg, 3.5 m), Dropside truck (5,000 kg, 6 m), Flatbed truck (10,000 kg, 12.5 m). Capacities and lengths are estimates for the founder to confirm. A class with no rate is never used. |
| D12 | Distance origin | **The fulfilment centre nearest to the buyer's delivery address.** | Needs latitude and longitude on each pickup station (new optional fields on `/admin/pickup-stations`). |
| D13 | Distance source | **Google Maps** (road distance, Routes API), looked up on the server. | Needs a Google Maps Platform key with billing (`GOOGLE_MAPS_API_KEY` on Vercel). The founder cannot yet reach the project email that owns it, so the key does not exist. **No estimated or straight-line fees are charged**: without a key the system does not price by distance. |
| D14 | Item weights | **Claude pre-fills estimates; the founder confirms.** | Estimates written for all 28 buyer-visible items (cement 50 kg a bag, rebar by diameter for a 12 m length, hollow, solid and interlocking blocks, PVC conduit and fittings, paint by 20 L drum, roofing per m2). An item counts only after an admin ticks "Confirmed". An item with no confirmed weight sends that order back to the zone or region fee. |

**Safety.** `delivery.distancePricingEnabled` is off by default and the settings save refuses to switch it on until all four checks pass: the Google key is set, every active vehicle class has a rate, every pickup station has coordinates, and every buyer-visible item has a confirmed weight. The checklist is shown on `/admin/delivery-pricing`. While it is off, or whenever a quote cannot be worked out, checkout keeps using the zone fee (or the region charge when the area picker is off).

**Zones still decide pooling and which sellers can bid.** Only the delivery fee changes.

### Still owed by the founder (delivery pricing)

1. A per-km rate for each of the four vehicle classes.
2. Confirmed capacities and longest-item lengths for each class.
3. The Google Maps Platform key, with billing, set on Vercel.
4. Latitude and longitude for each pickup station.
5. ~~Whether a paint "unit" is one litre or one 20 L drum~~ Settled 25 November: **one 20L drum** (D35). Still open: the length of a roofing sheet (the estimate is per m2).
6. A tick on "Confirmed" for each item weight after checking the estimate.

### Checkout side (built and pushed 25 November, commit abfb1e0, still switched off)

| # | Topic | Decision | Effect |
| --- | --- | --- | --- |
| D23 | Where the fee comes from | **The buyer pins the site, the server prices it.** At checkout the buyer searches an address (Google Places, restricted to Nigeria, through our own routes so the key stays on the server) and picks a suggestion. `/api/checkout/delivery-quote` shows the fee. `createOrder` then works the fee out again from the cart and the site; the price shown is never what is trusted. | The order stores the site (`deliveryLatitude`, `deliveryLongitude`) and the working (`deliveryQuote`: centre, km, load, trips, base fare, rounding). The fee is the same amount on every order line, as today, so refunds keep pro-rating it. |
| D24 | If the price moved | The checkout sends the fee the buyer saw. If the server's fee differs, the order is refused with the new price ("The delivery price is now N...") instead of charging something else. | No surprise charge if settings, rates or weights change between the quote and the pay button. |
| D25 | When it cannot be priced | A site that cannot be priced (no Google answer, an item with no confirmed weight, no vehicle fits) **falls back to the zone fee**, with a message at checkout. An area with no zone fee and no distance price has nothing to fall back to: the buyer is told to choose pickup. | With distance pricing on, an area with a zone but no flat fee can now offer delivery, because the fee comes from the site. |
| D26 | Pin required | With distance pricing on, delivery needs a pinned site ("your site on the map" is a required field). Saved addresses do not store map positions yet, so choosing one means searching the site again. | Follow-up: store the position on saved addresses. |

Everything is behind `delivery.distancePricingEnabled`. With it off, or with no Google key, the checkout shows no map search and charges exactly what it did before. The site text the driver sees is still the typed address; the pin only sets the price.

### Not built yet (delivery pricing)

Map positions on saved addresses; a limit on how often one buyer can call address search (it needs a sign-in, and typing waits 300 ms and starts at 3 letters, but there is no per-buyer cap); showing the full per-trip working to the buyer or to ops on the order page.

## 24 November 2026: payments, notifications and savings credit (built, reviewed 25 November)

Built by the product owner on 24 November and recorded here from the code. Confirm with the founder if any of it should change.

| # | Topic | What was built | Notes |
| --- | --- | --- | --- |
| D15 | Second payment gateway | **Credo Pay alongside Paystack. Deferred 25 November: launch with Paystack only, Credo stays switched off.** A "Payment gateway" choice at checkout, a redirect check on the order page, and a webhook at `/api/webhooks/credo`. Each order records its provider (`Order.paymentProvider`). | Credo is offered only when `CREDO_PUBLIC_KEY` and `CREDO_SECRET_KEY` are set. They are not set on Vercel yet, so buyers see "Not configured yet". The webhook's event name and signature scheme were written from memory and are **not yet confirmed against Credo's documentation**: test them in Credo's demo environment before going live. |
| D16 | Savings credit at checkout | **A buyer can spend their savings credit on an order.** It is ticked by default when they have a balance. Credit is used oldest first, a part-used entry is split so the rest stays available, and an order fully covered by credit is confirmed as paid at once. | Credit is taken when the order is placed, not when it is paid. See the open questions below. |
| D17 | Buyer and seller notifications | **In-app bell and page for buyers (`/account/notifications`), plus email, SMS and WhatsApp.** (Text messages were narrowed to key events on 25 November: see D19.) Events: order placed, payment confirmed, supplier confirmed or assigned, received at the centre, savings credited, dispatch updates, refunds, price-alert hits, and reminders for unpaid orders, carts left behind and expiring seller offers. Every delivery attempt is logged (`NotificationDelivery`). | Email works only through Resend's verified domain. SMS and WhatsApp send only when Termii, Twilio or WhatsApp keys are set, none of which exist yet. Each event is sent once (a deduplication key). |
| D18 | Mixed carts | **Each line can be Buy Direct or Pool & Save**, not only the whole cart. A line can go direct only when the buyer picked a seller for it. | Replaces the old rule that Buy Direct needed a seller on every line. |

### 25 November 2026: text message rules (built and pushed, commit c3e35ae)

| # | Topic | What was built | Notes |
| --- | --- | --- | --- |
| D19 | Which alerts use text messages | **SMS and WhatsApp are kept for key events only**: buyers get payment confirmed, order updates, delivery updates and payment reminders; sellers get awards, sheet offers, Buy Direct orders and the reminder before an offer expires. Cart reminders, price alerts, savings credit, "order placed" and broadcast pool notices stay in the app and email. | Each text message costs money, so the list is deliberately short. |
| D20 | Opt-out and switches | **Each person can turn off email, SMS and WhatsApp** (buyers on Notifications, sellers on Settings; in-app alerts are always on). Admin Settings has two platform switches: SMS (on) and WhatsApp (**off** until Meta-approved templates exist). A seller can add the phone number for text messages on Settings. **WhatsApp is opt-in (off until the person ticks it), because Meta requires agreement first; email and SMS are on until turned off.** | New columns `User.notifyEmail`, `notifySms`, `notifyWhatsapp` (migration `20261125120000_add_notification_preferences`). |
| D21 | Message format | **Text messages are plain ASCII and kept to one 160-character part** where possible (the naira sign becomes NGN, dashes and curly quotes are simplified; too long falls back to the title and link). Nigerian numbers typed without the leading 0 are accepted. | One non-basic character turns an SMS into Unicode at 70 characters a part, about double the cost. |
| D22 | Termii route | The SMS route is set by `TERMII_SMS_CHANNEL`: `generic` (default) or `dnd`. | `dnd` also reaches numbers on Nigeria's Do Not Disturb list. Switch to it once Termii confirms the route is enabled for our sender name, and test it. |

### Review on 25 November

Fixed the same day (pushed, commit 8a505cf):
1. **Credo payment could be reused.** On the order page, a buyer could pass the reference of one paid Credo transaction to confirm any other order of the same total. The check now requires the paid transaction to belong to that order.
2. **A failed notification could break real work.** Alerts are sent after orders, payments and receipts are saved, but an error in one could stop the rest of that step. A failed alert is now logged and ignored.
3. **The reminder sweep could fail the pool clock.** It is now isolated, so a reminder error cannot stop a pool stage.

Open for the founder: nothing left from this review. The credit, refund and text-message questions were settled the same evening (D27 to D29 below).

### 25 November 2026 (evening): credit, refunds and text messages (built, waiting for push)

| # | Topic | Decision | What was built |
| --- | --- | --- | --- |
| D27 | Credit on unpaid orders | **Release it.** An unpaid order that holds savings credit expires after **24 hours**: it is marked Cancelled and every credit entry spent on it becomes available again. The buyer gets an "Order expired" notice. | Runs every few minutes with the pool clock (`lib/checkout/expireUnpaidOrders.ts`). Only orders that hold credit are touched; unpaid orders without credit are left alone. A late payment can no longer turn a cancelled order into a paid one (`confirmOrderPaid` accepts only orders still awaiting payment); if money arrives for a cancelled order it is logged for a manual refund. |
| D28 | Refunds where credit was used | **Refund the cash part only; give the credit part back as credit.** For a line no supplier filled, the credit share is the line's share of the order times the credit applied; the rest is the cash refund. | The refund-due ledger now holds only the cash part. The credit part is posted to the savings ledger and added to the buyer's savings credit as a new available entry ("Savings credit returned"). It can never exceed the credit applied to that order. The order page shows the two amounts separately. A line paid entirely with credit has no cash refund. |
| D29 | Text messages | **SMS only.** WhatsApp stays switched off, and there is no WhatsApp-first logic with SMS as back-up. | No code change: the WhatsApp platform switch (`notifications.whatsappEnabled`) is already off and the WhatsApp tick box is hidden while it is off. Revisit only if the business wants WhatsApp later. |

**Bug found while building this.** Splitting a savings entry at checkout (when an entry is larger than what is still needed) would have been refused by the database, because the leftover had no source and the table requires exactly one. It would have failed the order. Nothing in production had used credit yet (no wallet rows exist). Migration `20261125180000_wallet_entry_origin` adds `originEntryId` so a carved-out entry points to the entry it came from, and relaxes the check to allow it. The same column holds credit returned on refunds.

### 25 November 2026 (night): products listed by sellers did not appear for buyers

Checked the whole path: seller saves a listing, the upload checks run, ops review flagged ones, buyers see live ones. A listing is shown to buyers only when it is **live**, has **stock above zero**, and the seller is **KYC-approved and not suspended**. Buyer pages are not cached, so they update at once. A listing is an offer on an existing catalogue product (shown under "Buy Direct" on the product page); sellers cannot add new catalogue products.

| # | Finding | What was done |
| --- | --- | --- |
| D30 | **A listing saved before the seller's KYC was approved stayed a hidden draft forever.** The seller was told "it goes live once your KYC is verified" but approving KYC did nothing to the listings. Ops approval of a flagged listing had the same effect when the seller was unverified. | Approving KYC (or reactivating a suspended seller) now runs the upload checks again on the seller's drafts: good ones go live, flagged ones go to the review queue, failing ones tell the seller what to fix (`lib/listings/applyChecks.ts`). The ops review card now warns "Approving still keeps it hidden from buyers until this seller's KYC is approved". |
| D31 | A listing with no photo, or a small one, is rejected by the checks and never reaches ops. | Working as designed. The seller sees "Needs a fix" with the reason. Photo upload is working on prod. |
| D32 | Buyers could not tell from the catalogue which products have seller offers. | Catalogue cards (catalogue page, home page rails, "more from" row) show a "N seller offer(s)" tag on the image when at least one pickable seller listing exists. It uses the same rule as the product page's Buy Direct list, so a card never promises an offer the page does not show. |
| D33 | Sellers had to keep checking their Listings page to learn what ops decided. | A seller now gets a notice (in the app, and by email if on; not by SMS) when ops **approve** a listing, **reject** it (with ops' note), or when their KYC approval **re-checks held drafts** (one summary: how many are live, waiting for review, or need fixing). If the seller is not yet verified, an approval notice says it goes live once the account is verified. New notification types `LISTING_LIVE` and `LISTING_REJECTED` (migration `20261125210000_listing_notifications`). |
| D34 | Product card descriptions were raw technical strings that ran past two lines and were cut off ("450 × 150 × 225mm; min. compressive strength 2.5…"). | All 28 product descriptions rewritten to one short plain line each, using only facts already in the old text (about 55 characters, so a card shows it whole; cards now allow three lines on phones). Units get a space ("450 × 150 × 225 mm"), "Nominal dia." becomes "diameter", and the cement lines read "Strength class 32.5N/R". Names like "6-inch" no longer break after the hyphen. The old text is saved in `docs/product-descriptions-2026-11-rollback.json`, and `prisma/catalogue-reference-data.json` is updated so a fresh database gets the same text. |
| D35 | What a paint "unit" means, and clumsy unit text ("/ Litre / Drum (20L drum)", "/ Bag (50kg bag)"). | **A paint unit is one 20L drum** (founder, 25 November). The four paints now read "20L drum" and the cement bags "50kg bag", so prices read "₦155,000 / 20L drum" and "₦13,250 / 50kg bag". **Gloss / Oil-Based Paint** was "(4L / 20L)" and is now also priced per 20L drum: confirm its ₦49,000 is for a 20L drum. A quantity before a unit that starts with a number reads "12 × 50kg bag" (one helper, `formatQuantity`). Old units are in `docs/product-units-2026-11-rollback.json`. The weight estimates for paints were already per 20L drum; they still need an admin "Confirmed" tick. |
| D36 | Type and copy were inconsistent and too dense: five weights up to 800, text as small as 9–11px, 13px and 15px sizes between the scale steps, 12px section headings, intro lines under most page titles, and the same reassurance repeated on several screens. | **One type system** (`DESIGN.md` section 3, `app/globals.css`): three weights (400, 500, 600), three text sizes (16px body, 14px secondary, 12px meta), nothing smaller, line height 1.1 to 1.25 on headings and 1.5 to 1.55 on text. Every `font-bold` and `font-extrabold` became `font-semibold` and every arbitrary size (9px to 17px) moved to the scale, across the whole app. Helper text, option descriptions and status details on buyer pages went from 12px to 14px. Section headings in checkout, cart and account are sentence-case 18px headings instead of 12px capitals. **Copy:** no eyebrow above headings; no intro line under page titles that restates them (notifications, price alerts); home trust list is titles only; Pool & Save steps, product panel, refund rule and sourcing lines are one short sentence each; cart drops the repeated reassurance and the items heading; catalogue drops the delivery banner; sign-in and sign-up side text and forms shortened. |
| D37 | Product titles carried descriptions ("Reinforcement Bar (Rebar) — 12mm", "HBM Nigeria (Elephant) Cement 42.5 Grade (50kg)") and cards stacked a category badge, a scope line and a description on top of them. | All 28 titles shortened ("Rebar 12mm", "Elephant Cement 42.5", "6-inch Hollow Block"); every fact that left a title moved into its one-line description. Cards show a bold title, a two-line description, the price and Add to cart; the category badge and "National supply/Regional" line are gone from cards. The product page shows the description under the title. Search matches titles and descriptions, so "reinforcement" or "sandcrete" still finds them. The refund rule moved off the product page (checkout still states it). Old names and descriptions: `docs/product-names-2026-11-rollback.json`. |

## Still open

- Commission (D3).
- The date for the supervised test day (D4).
- Station coordinates and opening hours (D1). The coordinates are also needed for distance-based delivery fees (D12).
- Delivery fees for the five new zones (D9). Distance pricing (D10 to D14) would replace the flat fee once it is switched on; until then these zones stay pickup only.
- Everything under "Still owed by the founder (delivery pricing)" above.
- Credo is deferred (D15). The credit, refund and text-message points are settled (D27 to D29).
- Approving sellers for the new zones: none has approved coverage there yet, so pooled lines in those zones have no bidders until sellers ask for the zones and ops approve.

## To build from these decisions

1. ~~Bank-detail change with OTP, ops review and optional call (D7).~~ Built. Needs `RESEND_FROM_EMAIL` on a verified domain so the OTP reaches any seller (see below).
2. **Seller terms page (D6).** Publish the reviewed text and bump `accounts.termsVersion` so every seller re-accepts.
3. **Supervised test day (D4).** A runbook and a QA pass using `docs/PRD-QA.md`.
4. **Checkout side of distance pricing (D10 to D14).** Address search, quote endpoint, order storage. Waits for the Google key so it can be tested.

## Email delivery note (for D7)

The app sends email through Resend. Without a verified sending domain (`RESEND_FROM_EMAIL`), Resend's sandbox address can deliver only to the Resend account owner's own email. Before the bank-detail OTP is used by real sellers, verify a domain in Resend and set `RESEND_FROM_EMAIL` in Vercel. If the code cannot be emailed, the request is cancelled and the seller is told so; nothing changes.
