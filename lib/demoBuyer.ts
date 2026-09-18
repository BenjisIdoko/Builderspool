// Identifies the original seeded demo buyer account for prisma/seed.ts.
// Real buyer auth (2026-09-16, see lib/buyer/auth.ts) replaced the
// hardcoded-lookup pattern this file used to also export — every real
// call site now goes through a session-backed getCurrentBuyer()/
// requireBuyer() instead.
//
// Uses example.com (2026-09-18), not the .example TLD — Paystack's real
// checkout API rejects .example (an RFC 2606 reserved TLD) as an invalid
// email, since a real payment gateway now sits behind this account.
// example.com is itself IANA-reserved for exactly this kind of
// documentation/test use, so it's still guaranteed non-deliverable.
export const DEMO_BUYER_EMAIL = 'demo.buyer@example.com';
