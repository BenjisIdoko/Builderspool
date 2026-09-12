import { cookies } from 'next/headers';

// There's no admin auth yet (Phase 1 scope, not built) — this cookie is a
// placeholder "session" set by app/admin/actions.ts's signInAdmin() once
// the single seeded ops account (lib/demoAdmin.ts) is confirmed. Replace
// with real auth before this is anything but a demo.
export const ADMIN_COOKIE = 'bp_admin_session';

export async function isAdminSignedIn(): Promise<boolean> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === 'true';
}
