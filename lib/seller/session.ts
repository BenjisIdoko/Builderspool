import { cookies } from 'next/headers';

// Holds the signed-in seller's real User id, set by app/seller/actions.ts's
// signInSeller()/signUpSeller() after a real password check/hash — see
// lib/auth/password.ts.
export const SELLER_COOKIE = 'bp_seller_id';

export async function getSellerIdFromSession(): Promise<string | null> {
  const store = await cookies();
  return store.get(SELLER_COOKIE)?.value ?? null;
}
