import { Role } from '@prisma/client';
import { getSessionUserId } from '@/lib/auth/sessionStore';

// Cookie holds a random session token (never the user id) — see
// lib/auth/sessionStore.ts. Set by signInSeller()/signUpSeller() in
// app/seller/actions.ts after a real password check/hash.
export const SELLER_COOKIE = 'bp_seller_session';
export const SELLER_SESSION = { cookieName: SELLER_COOKIE, role: Role.SELLER };

export async function getSellerIdFromSession(): Promise<string | null> {
  return getSessionUserId(SELLER_COOKIE, Role.SELLER);
}
