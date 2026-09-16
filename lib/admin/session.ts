import { cookies } from 'next/headers';

// Set by app/admin/actions.ts's signInAdmin() after a real password check
// against the single seeded ops account (lib/demoAdmin.ts) — see
// lib/auth/password.ts. Still boolean-only (not a per-user id) because
// there's still only one admin account by design; extend if that changes.
export const ADMIN_COOKIE = 'bp_admin_session';

export async function isAdminSignedIn(): Promise<boolean> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === 'true';
}
