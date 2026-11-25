# Go-live checklist: services to set up and pay for

Prepared 25 November 2026 from what the code actually reads (environment variables, cron jobs, integrations). **No prices are stated here**: every provider changes its rates, so check the current price page when you sign up. "Pay" means a plan, a fee or usage billing the business will carry.

Status key: **Done** = working in production today. **Set up** = account exists but a step is open. **Not started** = nothing exists yet.

## A. Must have before real buyers pay

| # | Service | Why we need it | What to do | Variables on Vercel | Pay | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **Vercel** (hosting) | Runs the website, order pages and the daily jobs | Move to a **Pro** (paid) team under the business account. Free (Hobby) plans are for non-commercial use only. Move the project at handover, then re-point the domain and webhooks (see section D). | none | Monthly plan, per seat | Set up (old team still serves prod) |
| 2 | **Supabase** (database, file storage, the per-minute pool clock) | All orders, users, listings, photos and the `pool-tick` schedule | Move the project to a paid plan (done: transferred to the new organisation on 21 November). A free project can pause when idle and has no daily backups, which is not safe for money records. Confirm backups are on. | `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (the service key is still missing on prod; photo uploads need it) | Monthly plan | Set up |
| 3 | **Paystack** (card, transfer, USSD payments) | Takes the buyer's money | Finish **business verification** (CAC certificate, director ID, settlement bank account) to get live keys. Set the webhook address to `https://<live domain>/api/webhooks/payment`. Test one real small payment and one refund. | `PAYSTACK_SECRET_KEY` (live key) | Per-transaction fee taken from each payment | Set up |
| 4 | **Credo Pay** (second gateway) | **Skipped for launch (decision of 25 November): Paystack only.** | Nothing to do now. The code stays in place but switched off. Revisit later; before enabling, test the webhook in Credo's demo environment. | `CREDO_PUBLIC_KEY`, `CREDO_SECRET_KEY`, `CREDO_ENV`, `CREDO_BASE_URL` (leave unset) | none | Deferred |
| 5 | **Domain name** | The public address, and the sender address for email | Confirm the business owns `builderspool.net`. Add it to Vercel as the production domain, keep `builderspool.vercel.app` as a redirect if wanted. | `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL` | Yearly renewal | Set up (confirm who holds it) |
| 6 | **Resend** (email) | Order receipts, seller email codes (OTP), reminders | Verify the domain (add the DNS records Resend gives), then set the from-address on that domain. Until then email reaches only the account owner. | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Free tier first, monthly plan as volume grows | Set up (domain not verified) |
| 7 | **Cron secret** | Protects the daily jobs (`close-cycles` 18:05, `notify-closing-soon` 16:30) and the pool clock | Keep one long random value, the same in Vercel and in the Supabase schedule. | `CRON_SECRET` | Free | Done |
| 8 | **Business email and phone** | Support address shown on the site, Paystack/Resend registration | A real inbox for `info@builderspool.net` that the founders can read, and the WhatsApp/phone line on the footer. | none | Mailbox per user (Google Workspace or similar) | Confirm |

## B. Needed for text messages and seller checks

| # | Service | Why we need it | What to do | Variables | Pay | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 9 | **Termii** (SMS) | Key text alerts: payment confirmed, order and delivery updates, seller awards | Register a **sender name** (Nigerian networks approve it, it can take days), fund the wallet, ask Termii to enable the route. Start on `generic`; switch to `dnd` once enabled, so numbers on the Do Not Disturb list are reached. | `TERMII_API_KEY`, `TERMII_SENDER_ID`, `TERMII_SMS_CHANNEL` | Prepaid credit, per message | Not started |
| 10 | **WhatsApp** (optional, switched off) | Alerts on WhatsApp | Needs a **Meta business verification**, a business phone number and **approved message templates** before it can send alerts. Only start this after SMS works. Via Termii (`TERMII_WHATSAPP_DEVICE_ID`), Twilio, or Meta's own API. | `TERMII_WHATSAPP_DEVICE_ID` or `TWILIO_*` or `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | Per conversation, billed by the provider | Not started |
| 11 | **MetaMap** (seller CAC check) | Checks a seller's CAC registration during KYC | Create the account, get the client ID and secret, set them. Until then, ops must verify CAC by hand. | `METAMAP_CLIENT_ID`, `METAMAP_CLIENT_SECRET` | Per check | Not started |

## C. Needed only to switch on distance-based delivery pricing

| # | Service | What to do | Variables | Pay | Status |
| --- | --- | --- | --- | --- | --- |
| 12 | **Google Maps Platform** | Create a project with **billing** turned on. Enable **Places API (New)** and **Routes API**. Restrict the key to those two APIs. Set a budget alert so a bug cannot run up a bill. | `GOOGLE_MAPS_API_KEY` | Usage billing (a free monthly credit applies) | Not started |

Distance pricing also needs business data, not services: a per-km rate for each vehicle class, a map position for each pickup station, and a confirmed weight for each item. Until all four checks pass, the site keeps using the flat zone fees. Five of the zones still have no delivery fee set.

## D. Things that move when the accounts move (at handover)

- GitHub: transfer the repository to the business account, keep the current developer as a collaborator.
- Vercel: import the repository into the business team, copy all production variables (secrets cannot be read back from Vercel, take them from the local `.env`), and rename or delete the old project so the address can move.
- If the live address changes: update the **Paystack webhook**, the **Supabase redirect URLs**, and the **`pool-tick` schedule** address.

## E. Business and legal items (not software)

| Item | Status |
| --- | --- |
| Buyer terms and privacy policy published on the site | Confirm |
| Seller terms (draft in `docs/seller-terms-draft.md`) approved by a lawyer | Draft |
| Paystack settlement account and a bank account for seller payouts | Set up |
| Seller payouts process: manual or automatic, after Paystack is live | Decision open |
| Commission rate | Decision open (founder) |
| Refund policy wording agreed (refunds go to savings credit, not cash, unless decided otherwise) | Confirm |
| Data protection: NDPC registration and a named data contact | Not started |
| Pickup stations: addresses, opening hours, and a person on site | Open |

## F. Recommended extras (not required on day one)

| Service | Why | Pay |
| --- | --- | --- |
| **Error monitoring** (for example Sentry) | Know about crashes before a buyer tells you | Free tier first |
| **Uptime check** (for example Better Stack, UptimeRobot) | An alert if the site or the pool clock stops | Free tier first |
| **Vercel Analytics or similar** | See visits and drop-off at checkout | Included or small plan |
| **Database backup export** | A second copy outside Supabase | Storage cost only |

## G. Suggested order

1. Vercel Pro and Supabase paid plan under the business accounts.
2. Domain on Vercel, then Resend domain verification.
3. Paystack live keys and webhook, then one real payment and refund test.
4. `SUPABASE_SERVICE_ROLE_KEY` on Vercel (photo uploads).
5. Termii sender name (start early, approval takes days).
6. MetaMap.
7. Supervised test day (decision D4), then switch the sheet engine on.
8. Google Maps and distance pricing, after the rates and station positions exist.

## What is already done

Database moved to the business organisation and running; per-minute pool clock active; storage buckets created; daily jobs wired; email code and receipt paths built; notification preferences live.

---

# Costing (researched 25 November 2026)

**Read this first.** Prices were taken from the providers' public pages and news reports on 25 November 2026. They change, and several providers (Termii, MetaMap) publish no rate card, so those lines are marked **quote needed**. Naira figures use about **N1,350 per US dollar** (the official market closed near N1,348 on 2 November 2026). Foreign services bill in dollars, so you need a dollar-enabled card. Budget a **10% buffer** for exchange moves, bank charges and any tax on foreign services (confirm with your bank and accountant).

## 1. Fixed monthly costs

| Service | Price found | Per month (USD) | Per month (NGN, approx.) | Notes |
| --- | --- | --- | --- | --- |
| Vercel Pro | $20 per paid seat; includes $20 of usage; viewers free | $20 per person who deploys | N27,000 per seat | One seat is enough to start. Sources disagree on whether the first seat is included in the $20, so confirm on the pricing page. |
| Supabase Pro | $25 per organisation, includes $10 of compute credit (covers one small database) | $25 | N33,750 | Extra compute, storage or traffic is billed on top. A second project costs extra. |
| Resend (email) | Free: 3,000 emails a month, 100 a day. Pro: $20 for 50,000 a month | $0 now, $20 later | N0 now, N27,000 later | Free is fine for launch. The 100-a-day cap will bite once there are more than about 100 emails a day. |
| Google Workspace (business email) | Business Starter about $7 to $8.40 per user per month | $7 to $8.40 per user | N9,500 to N11,500 per user | Two or three mailboxes. Optional if you already have a mailbox you trust. |
| Error monitoring and uptime alerts | Free tiers | $0 | N0 | Recommended, not required. |

## 2. Yearly costs

| Item | Price found | Per year (NGN, approx.) |
| --- | --- | --- |
| `.net` domain renewal | About $12 to $36 depending on the registrar (the registry's own part is about $11.66) | N16,000 to N49,000 |

## 3. Costs that depend on volume

| Service | Price found | What it means for us |
| --- | --- | --- |
| **Paystack** (card, transfer, USSD) | **1.5% + N100** on each local payment. The N100 is waived under N2,500. **Capped at N2,000 per payment.** Chargebacks N2,500 each. | The cap helps materials orders: a N50,000 order costs about N850 (1.7%), a N100,000 order N1,600 (1.6%), a N200,000 order N2,000 (1%), a N1,000,000 order N2,000 (0.2%). Whether the business absorbs this or adds it to the price is a pricing decision for the business. |
| **Credo Pay** | Not published. | **Deferred.** Not in the launch budget. Get their rate card if the business revisits it. |
| **SMS (Termii)** | Not published. Nigerian bulk SMS runs about N6 to N8 per message; a third-party site puts Termii near $0.0107 (about N14) for Nigeria, with the do-not-disturb route a little higher. | **Quote needed.** Planning figure: N8 to N14 per text. At 1,200 texts a month that is about N10,000 to N17,000. Prepaid, so you control it. |
| **WhatsApp (optional, off)** | Meta charges per delivered message. Press reports for Nigeria: about N14 per utility message and about N84 per marketing message. Since 1 October 2026 some service messages are also charged. | Leave it off at launch. If switched on, a sender number and a Termii, Twilio or Meta account fee may apply on top. |
| **Google Maps** (only for distance pricing) | Address search: first 10,000 requests a month free, then about $2.83 per 1,000. Route lookups: the current rate was not confirmed; the older route products are about $5 per 1,000 after 10,000 free. | At launch volumes this is likely **N0**. Set a budget alert. Requires a billing card on the Google account. |
| **MetaMap** (seller CAC check) | Not published. A competitor claims $1 to $2.50 per check, unverified. | **Quote needed.** One check per new seller, so a one-off cost. Until set up, ops can verify CAC by hand at no cost. |

## 4. Budget scenarios (per month, services only)

Assumes about 300 orders a month and about 4 texts per order. Payment fees are excluded because they come out of each payment.

| Scenario | What is included | Approx. per month |
| --- | --- | --- |
| **Lean launch** | Vercel 1 seat ($20), Supabase Pro ($25), Resend free, 2 Workspace mailboxes (about $15), Maps free tier, SMS about N10,000, domain spread over the year | about **N93,000** (about $69) |
| **Comfortable** | Vercel 2 seats ($40), Supabase Pro ($25), Resend Pro ($20), 3 Workspace mailboxes (about $22), Maps within free tier, SMS about N20,000 to N40,000 | about **N165,000 to N185,000** (about $122 to $137) |
| **Plus the 10% buffer** | on either line above | add about N9,000 to N18,000 |

Not in the figures above: MetaMap (quote needed), Credo (deferred), WhatsApp, the lawyer's fee for the terms, data-protection registration, payouts to sellers, and any extra Supabase compute if traffic grows.

## 5. One-off and quote-needed items to chase

1. Termii: price per text on the generic and do-not-disturb routes, and the sender name fee if any.
2. MetaMap: price per CAC check (or a cheaper alternative provider).
3. Lawyer: fee for reviewing buyer terms, seller terms and the privacy policy.
4. Data-protection registration fee and who files it.
5. Paystack payout (transfer) fees and stamp duty for seller payouts, once payouts are decided.

## Sources

Vercel pricing: https://vercel.com/docs/plans/pro-plan · Supabase pricing: https://supabase.com/pricing · Paystack charges: https://support.paystack.com/hc/en-us/articles/360009881920 · Resend pricing: https://resend.com/pricing · Google Maps Platform pricing: https://developers.google.com/maps/billing-and-pricing/pricing · Google Workspace pricing: https://workspace.google.com/pricing · WhatsApp pricing: https://developers.facebook.com/docs/whatsapp/pricing · Exchange rate and WhatsApp Nigeria reporting: Legit.ng, ThisDay (30 August 2026).
