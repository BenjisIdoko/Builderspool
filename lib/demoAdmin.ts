// The seeded ops account's email — used only by prisma/seed.ts to create it.
// Runtime code identifies the signed-in admin via getCurrentAdmin()
// (lib/admin/session.ts), not by this address.
export const DEMO_ADMIN_EMAIL = 'ops@builderspool.example';
