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

## Still open

- Commission (D3).
- The date for the supervised test day (D4).
- Station coordinates and opening hours, if the "closest station" suggestion is wanted (D1).

## To build from these decisions

1. ~~Bank-detail change with OTP, ops review and optional call (D7).~~ Built. Needs `RESEND_FROM_EMAIL` on a verified domain so the OTP reaches any seller (see below).
2. **Seller terms page (D6).** Publish the reviewed text and bump `accounts.termsVersion` so every seller re-accepts.
3. **Supervised test day (D4).** A runbook and a QA pass using `docs/PRD-QA.md`.

## Email delivery note (for D7)

The app sends email through Resend. Without a verified sending domain (`RESEND_FROM_EMAIL`), Resend's sandbox address can deliver only to the Resend account owner's own email. Before the bank-detail OTP is used by real sellers, verify a domain in Resend and set `RESEND_FROM_EMAIL` in Vercel. If the code cannot be emailed, the request is cancelled and the seller is told so; nothing changes.
