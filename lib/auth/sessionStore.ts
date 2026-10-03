import { cache } from 'react';
import { cookies } from 'next/headers';
import type { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { generateToken, hashToken } from '@/lib/auth/tokens';

const DAY_MS = 24 * 60 * 60 * 1000;

interface SessionKind {
  cookieName: string;
  role: Role;
}

// Sessions are server-side rows keyed by a random token — the cookie never
// contains a user id, so knowing someone's id grants nothing, and deleting
// the row (sign-out, password reset) really ends the session.
export async function createSession(
  kind: SessionKind,
  userId: string,
  { ttlMs, persistent }: { ttlMs: number; persistent: boolean },
): Promise<void> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + ttlMs);

  await prisma.session.create({
    data: { tokenHash: hashToken(token), userId, role: kind.role, expiresAt },
  });
  // Opportunistic cleanup so expired rows don't accumulate.
  await prisma.session.deleteMany({ where: { userId, expiresAt: { lt: new Date() } } });

  const store = await cookies();
  store.set(kind.cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    // Non-persistent sessions end with the browser; the DB expiry is still a ceiling.
    maxAge: persistent ? Math.floor(ttlMs / 1000) : undefined,
  });
}

// Per-request cache so layouts, pages and actions in one render share a lookup.
// Primitive args (not a SessionKind object) so React's cache() can key on them.
export const getSessionUserId = cache(async (cookieName: string, role: Role): Promise<string | null> => {
  const store = await cookies();
  const token = store.get(cookieName)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!session || session.role !== role || session.expiresAt < new Date()) return null;
  return session.userId;
});

export async function destroySession(kind: SessionKind): Promise<void> {
  const store = await cookies();
  const token = store.get(kind.cookieName)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  store.delete(kind.cookieName);
}

export async function revokeAllSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

export const SESSION_TTL = {
  buyer: 7 * DAY_MS,
  buyerRemembered: 30 * DAY_MS,
  seller: 7 * DAY_MS,
  admin: 1 * DAY_MS,
};
