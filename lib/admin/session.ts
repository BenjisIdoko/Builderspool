import { cache } from 'react';
import { getSessionUserId } from '@/lib/auth/sessionStore';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

// Holds the signed-in admin's real User id, set by app/admin/actions.ts's
// signInAdmin() after a real password check. Admin accounts are a closed
// system (created only via scripts/create-admin.ts — no signup route), but
// there can be several assigned people, so the session identifies which one
// rather than being a bare "signed in" flag. Because it's re-checked against
// the database on every request, removing an admin (or demoting the row)
// revokes their access immediately — and deleting the Session row ends a
// specific login.
export const ADMIN_COOKIE = 'bp_admin_session_v2';
export const ADMIN_SESSION = { cookieName: ADMIN_COOKIE, role: Role.ADMIN };

// React cache() dedupes the lookup within a single request — the layout,
// the page, and any action in the same render all share one query.
export const getCurrentAdmin = cache(async () => {
  // The cookie is a random session token, not an admin id (see
  // lib/auth/sessionStore.ts). Old id-valued cookies use different names, so
  // they're simply ignored and the admin signs in again once.
  const adminId = await getSessionUserId(ADMIN_COOKIE, Role.ADMIN);
  if (!adminId) return null;
  return prisma.user.findFirst({ where: { id: adminId, role: Role.ADMIN } });
});

export async function isAdminSignedIn(): Promise<boolean> {
  return (await getCurrentAdmin()) !== null;
}

// A page's own redirect-when-signed-out check does not extend to Server
// Actions defined within it — Next.js treats every Server Action as its own
// directly POST-able endpoint regardless of which page rendered the form
// that triggers it. Every admin mutation must call this itself; relying on
// the dashboard layout's gate alone leaves the action reachable by anyone.
export async function requireAdmin(): Promise<void> {
  if (!(await isAdminSignedIn())) {
    throw new Error('Admin session required.');
  }
}
