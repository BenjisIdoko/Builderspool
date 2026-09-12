import { prisma } from './prisma';

// There's no admin auth yet (Phase 1 scope, not built) — the admin
// dashboard's login is a single seeded account behind a session cookie
// (lib/admin/session.ts), same TODO-and-replace pattern as the buyer and
// seller demo accounts.
export const DEMO_ADMIN_EMAIL = 'ops@builderspool.example';

export async function getDemoAdmin() {
  return prisma.user.findUniqueOrThrow({ where: { email: DEMO_ADMIN_EMAIL } });
}
