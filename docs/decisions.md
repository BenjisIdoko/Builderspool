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
5. Whether a paint "unit" (Litre / Drum) is one litre or one 20 L drum, and the length of a roofing sheet (the estimate is per m2).
6. A tick on "Confirmed" for each item weight after checking the estimate.

### Not built yet (delivery pricing)

The buyer side: an address search at checkout, the distance quote, saving the quote and the destination on the order, and writing the fee onto the order lines. The fee will be stored as the same amount on every line of the order, as today, so refunds keep pro-rating it. Fallback: zone fee when the quote fails.

## 24 November 2026: payments, notifications and savings credit (built, reviewed 25 November)

Built by the product owner on 24 November and recorded here from the code. Confirm with the founder if any of it should change.

| # | Topic | What was built | Notes |
| --- | --- | --- | --- |
| D15 | Second payment gateway | **Credo Pay alongside Paystack.** A "Payment gateway" choice at checkout, a redirect check on the order page, and a webhook at `/api/webhooks/credo`. Each order records its provider (`Order.paymentProvider`). | Credo is offered only when `CREDO_PUBLIC_KEY` and `CREDO_SECRET_KEY` are set. They are not set on Vercel yet, so buyers see "Not configured yet". The webhook's event name and signature scheme were written from memory and are **not yet confirmed against Credo's documentation**: test them in Credo's demo environment before going live. |
| D16 | Savings credit at checkout | **A buyer can spend their savings credit on an order.** It is ticked by default when they have a balance. Credit is used oldest first, a part-used entry is split so the rest stays available, and an order fully covered by credit is confirmed as paid at once. | Credit is taken when the order is placed, not when it is paid. See the open questions below. |
| D17 | Buyer and seller notifications | **In-app bell and page for buyers (`/account/notifications`), plus email, SMS and WhatsApp for every notification.** Events: order placed, payment confirmed, supplier confirmed or assigned, received at the centre, savings credited, dispatch updates, refunds, price-alert hits, and reminders for unpaid orders, carts left behind and expiring seller offers. Every delivery attempt is logged (`NotificationDelivery`). | Email works only through Resend's verified domain. SMS and WhatsApp send only when Termii, Twilio or WhatsApp keys are set, none of which exist yet. Each event is sent once (a deduplication key). |
| D18 | Mixed carts | **Each line can be Buy Direct or Pool & Save**, not only the whole cart. A line can go direct only when the buyer picked a seller for it. | Replaces the old rule that Buy Direct needed a seller on every line. |

### 25 November 2026: text message rules (built, waiting for push)

| # | Topic | What was built | Notes |
| --- | --- | --- | --- |
| D19 | Which alerts use text messages | **SMS and WhatsApp are kept for key events only**: buyers get payment confirmed, order updates, delivery updates and payment reminders; sellers get awards, sheet offers, Buy Direct orders and the reminder before an offer expires. Cart reminders, price alerts, savings credit, "order placed" and broadcast pool notices stay in the app and email. | Each text message costs money, so the list is deliberately short. |
| D20 | Opt-out and switches | **Each person can turn off email, SMS and WhatsApp** (buyers on Notifications, sellers on Settings; in-app alerts are always on). Admin Settings has two platform switches: SMS (on) and WhatsApp (**off** until Meta-approved templates exist). A seller can add the phone number for text messages on Settings. **WhatsApp is opt-in (off until the person ticks it), because Meta requires agreement first; email and SMS are on until turned off.** | New columns `User.notifyEmail`, `notifySms`, `notifyWhatsapp` (migration `20261125120000_add_notification_preferences`). |
| D21 | Message format | **Text messages are plain ASCII and kept to one 160-character part** where possible (the naira sign becomes NGN, dashes and curly quotes are simplified; too long falls back to the title and link). Nigerian numbers typed without the leading 0 are accepted. | One non-basic character turns an SMS into Unicode at 70 characters a part, about double the cost. |
| D22 | Termii route | The SMS route is set by `TERMII_SMS_CHANNEL`: `generic` (default) or `dnd`. | `dnd` also reaches numbers on Nigeria's Do Not Disturb list. Switch to it once Termii confirms the route is enabled for our sender name, and test it. |

### Review on 25 November

Fixed the same day (not yet pushed):
1. **Credo payment could be reused.** On the order page, a buyer could pass the reference of one paid Credo transaction to confirm any other order of the same total. The check now requires the paid transaction to belong to that order.
2. **A failed notification could break real work.** Alerts are sent after orders, payments and receipts are saved, but an error in one could stop the rest of that step. A failed alert is now logged and ignored.
3. **The reminder sweep could fail the pool clock.** It is now isolated, so a reminder error cannot stop a pool stage.

Open for the founder:
- **Credit on abandoned orders.** If a buyer places an order with credit applied and never pays, the credit stays locked to that order. Nothing releases it. Choose: release it when an unpaid order is cancelled or expires (for example after 24 hours), or leave it until the buyer pays.
- **Refunds where credit was used.** The refund calculation ignores the credit. A buyer who paid part of a line with credit and is later refunded is shown the full line price as due. Choose: return the credit part to their savings credit, and refund only the cash part.
- **SMS and WhatsApp: whether to use WhatsApp alone, or WhatsApp and SMS.** The event list and the opt-out are now built (D19, D20). Still to decide: WhatsApp as the main channel with SMS as the back-up, or SMS only. WhatsApp usually needs Meta-approved message templates for alerts sent outside a 24-hour chat window.
- **Credo configuration.** Keys, the webhook address and a demo-environment test (D15).

## Still open

- Commission (D3).
- The date for the supervised test day (D4).
- Station coordinates and opening hours (D1). The coordinates are also needed for distance-based delivery fees (D12).
- Delivery fees for the five new zones (D9). Distance pricing (D10 to D14) would replace the flat fee once it is switched on; until then these zones stay pickup only.
- Everything under "Still owed by the founder (delivery pricing)" above.
- The four open points under "Review on 25 November" above (credit on abandoned orders, refunds with credit, SMS and WhatsApp rules, Credo set-up).
- Approving sellers for the new zones: none has approved coverage there yet, so pooled lines in those zones have no bidders until sellers ask for the zones and ops approve.

## To build from these decisions

1. ~~Bank-detail change with OTP, ops review and optional call (D7).~~ Built. Needs `RESEND_FROM_EMAIL` on a verified domain so the OTP reaches any seller (see below).
2. **Seller terms page (D6).** Publish the reviewed text and bump `accounts.termsVersion` so every seller re-accepts.
3. **Supervised test day (D4).** A runbook and a QA pass using `docs/PRD-QA.md`.
4. **Checkout side of distance pricing (D10 to D14).** Address search, quote endpoint, order storage. Waits for the Google key so it can be tested.

## Email delivery note (for D7)

The app sends email through Resend. Without a verified sending domain (`RESEND_FROM_EMAIL`), Resend's sandbox address can deliver only to the Resend account owner's own email. Before the bank-detail OTP is used by real sellers, verify a domain in Resend and set `RESEND_FROM_EMAIL` in Vercel. If the code cannot be emailed, the request is cancelled and the seller is told so; nothing changes.
