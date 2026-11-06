# Floot prompts: ready to paste (OBSOLETE)

> **Obsolete as of 6 Nov 2026.** The team no longer uses Floot; everything is built in this repository. The rules in these prompts are still correct and are the specification for the build here (see `docs/floot-port-notes.md`). Do not send this file to anyone.


Both prompts are taken from `docs/floot-port-notes.md` (sections 1c and 2.11) and reflect the founder's confirmed answers of 6 Nov 2026. Paste them into Floot one at a time, in this order, and check the result before the next. After each one, run the matching acceptance scenarios from section 4 of the port notes.

## 1. Pool & Save: cycle, RFQ, scoring, cascade, revert

Run after pasting: scenarios 1 to 12 and 16 to 22, 25 and 26.

```text
Set up the Pool & Save cycle with these admin-editable settings and rules. Times (Lagos): pool closes 12:00, bids close 15:00, three accept windows of one hour each, final result 18:00; reject settings where bids-close plus three windows does not equal the final time. At pool close, before bidding begins, freeze each line's reference price as the lowest listing price among sellers serving that buyer's delivery zone. Group lines by category and send each category's RFQ sheet to every approved vendor registered for that category, with item pictures, total quantity and the frozen reference price. A vendor must bid every line of the sheet; a bid above the reference price on any line is ineligible. Score eligible sheets on six criteria with administrator-editable weights that sum to 100, starting at: competitive landed price 30, historical supplier performance 20, quantity and fulfilment capacity 20, delivery speed and SLA compliance 15, geographic suitability 10, bid responsiveness and completeness 5. Store the points and a one-line reason per criterion for every score. A supplier with fewer than 5 completed orders gets a neutral performance score of 50. Award the whole category sheet to the top-ranked vendor, who has one hour to accept; if they do not, award to rank two with its own hour, then rank three. If rank three does not accept, cancel and revert each line to the seller whose listing the buyer picked, at the price the buyer picked, as an ordinary Buy Direct order; if that seller cannot supply, refund that line. Buyers pay for the goods at checkout, into escrow; remove any "no payment now" wording. Sellers are paid only after delivery and the fulfilment centre's quality check. Every step must be safe to run twice and write an audit entry. Validate seller listings on save: at least one photo (1000 px long edge, up to 5 MB, JPEG/PNG/WebP), all required fields, a price within 50% to 150% of the median of other listings for that material (otherwise "needs review"), a production or expiry date for perishables with at least 30 days left, and duplicate detection; return pass, needs review or reject with reason codes.
```

## 2. Service areas: LGA, locality, delivery zone

Run after pasting: scenarios 13 to 15, 23 and 24.

```text
Replace the placeholder delivery zones with a service-area model. Levels: State (seed only "FCT"), Area Council / LGA (AMAC, Bwari, Gwagwalada, Kuje, Kwali, Abaji), locality (a city, town or district, belonging to exactly one LGA), and delivery zone (an admin-defined group of localities; a zone may span LGAs; a locality is in at most one active zone). Seed the localities and zones in the table I give you; every seeded row is editable. Use the **zone** as the key for pool RFQs (one sheet per category per zone), the delivery fee, seller coverage and the supplier cap. Sellers declare coverage per zone (multi-select) and ops approve it; a seller flagged "national supply" covers every zone. Buyer delivery addresses must pick an LGA and a locality from searchable lists grouped by LGA, plus a street and an optional landmark; pickup is unaffected. The buyer's chosen locality is remembered on the account and shown as "Deliver to"; the product page shows "N sellers deliver here" (a count, never names). A locality with no active zone, or in a zone with no delivery fee, cannot be delivered to: offer pickup and a "tell us you want delivery here" request (phone plus locality, deduplicated). Add an admin screen to manage states, LGAs, localities, zones, locality-to-zone mapping and per-zone delivery fees (fees are entered by the business; do not default or invent any). Moving a locality to another zone must not change paid orders or open pools; it applies from the next cycle date. Each fulfilment centre records its locality, LGA, address, hours and the zones it serves. Audit-log every change with who, when, before and after. Never delete a zone or locality that orders or pools reference; deactivate it.
```

Seed data to give Floot with the prompt above (suggested; ops confirm every row before it goes live). State: FCT. A locality with no zone cannot be delivered to until ops put it in a zone and the business sets that zone's fee.

| LGA | Locality | Zone |
|---|---|---|
| AMAC | Lugbe | AMAC – Lugbe / Airport Road corridor |
| AMAC | Airport Road | AMAC – Lugbe / Airport Road corridor |
| AMAC | Nyanya | AMAC – Nyanya / Karu / Jikwoyi corridor |
| AMAC | Jikwoyi | AMAC – Nyanya / Karu / Jikwoyi corridor |
| AMAC | Lokogoma | AMAC – Lokogoma / Wumba / Kabusa corridor |
| AMAC | Wumba | AMAC – Lokogoma / Wumba / Kabusa corridor |
| AMAC | Kabusa | AMAC – Lokogoma / Wumba / Kabusa corridor |
| AMAC | Garki, Wuse, Maitama, Asokoro, Jabi, Utako, Gwarinpa, Apo | none yet (central districts have no zone in Floot; ops to create one or more) |
| Bwari | Bwari town, Ushafa, Kubwa, Dutse | Bwari Area Council |
| Gwagwalada | Gwagwalada town | Gwagwalada Area Council |
| Kuje | Kuje town | none yet |
| Kwali | Kwali town | none yet |
| Abaji | Abaji town | none yet |

## 3. After pasting

- Floot's scoring weights must be the six in prompt 1 (30/20/20/15/10/5), not 60/20/15/5.
- Remove any "No payment now" wording and any fallback-purchase checkbox from checkout and the join form.
- Delivery fees are entered by the business in the new admin screen; none are set by the prompt.
- The assumptions behind these prompts are all confirmed: pool close 12:00, bids close 15:00, three one-hour accept windows, final result 18:00; new suppliers score 50 until 5 completed orders; a sheet with any line above the reference price is ineligible; a line whose picked seller cannot supply is refunded.
