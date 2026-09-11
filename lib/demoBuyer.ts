import { prisma } from './prisma';

// There's no buyer auth/account creation yet (Phase 1 scope, not built) —
// the buyer UI's checkout flow attaches orders to this single seeded
// account (prisma/seed.ts) so the golden path is testable end-to-end
// until real sign-in exists. Swap every call site for a real session
// lookup once auth is built.
export const DEMO_BUYER_EMAIL = 'demo.buyer@builderspool.example';

export async function getDemoBuyer() {
  return prisma.user.findUniqueOrThrow({ where: { email: DEMO_BUYER_EMAIL } });
}
