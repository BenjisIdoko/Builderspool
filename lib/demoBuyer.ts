// Identifies the original seeded demo buyer account for prisma/seed.ts.
// Real buyer auth (2026-09-16, see lib/buyer/auth.ts) replaced the
// hardcoded-lookup pattern this file used to also export — every real
// call site now goes through a session-backed getCurrentBuyer()/
// requireBuyer() instead.
export const DEMO_BUYER_EMAIL = 'demo.buyer@builderspool.example';
