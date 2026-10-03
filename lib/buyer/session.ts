import { Role } from '@prisma/client';
import { getSessionUserId } from '@/lib/auth/sessionStore';

export const BUYER_COOKIE = 'bp_buyer_session';
export const BUYER_SESSION = { cookieName: BUYER_COOKIE, role: Role.BUYER };

export async function getBuyerIdFromSession(): Promise<string | null> {
  return getSessionUserId(BUYER_COOKIE, Role.BUYER);
}
