import { prisma } from './prisma';

// Identifies the single seeded ops account — real password auth exists
// (lib/admin/session.ts, app/admin/actions.ts's signInAdmin()), but there's
// still only ever one admin account by design, so this lookup-by-email
// stays a valid way to fetch "the" admin for display purposes.
export const DEMO_ADMIN_EMAIL = 'ops@builderspool.example';

export async function getDemoAdmin() {
  return prisma.user.findUniqueOrThrow({ where: { email: DEMO_ADMIN_EMAIL } });
}
