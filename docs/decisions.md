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
| D7 | Bank details after approval | **An approved seller may edit them, and the change triggers a re-check.** | Not built yet. Proposed design: the change is held as a pending bank-detail review; selling continues, and payouts to the new details are held until ops confirm the account-name match. See "To build" below. |

## Still open

- Commission (D3).
- The date for the supervised test day (D4).
- Station coordinates and opening hours, if the "closest station" suggestion is wanted (D1).

## To build from these decisions

1. **Bank-detail change with re-check (D7).** Owner-only form for an approved seller. A change creates a pending record (old and new details kept), shows "Bank details under review" to the seller, and blocks any payout to the new details until an admin approves it. A change never takes the seller's account out of selling. Audited. Needs a small additive migration.
2. **Seller terms page (D6).** Publish the reviewed text and bump `accounts.termsVersion` so every seller re-accepts.
3. **Supervised test day (D4).** A runbook and a QA pass using `docs/PRD-QA.md`.
