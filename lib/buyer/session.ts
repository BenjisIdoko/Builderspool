import { cookies } from 'next/headers';

export const BUYER_COOKIE = 'bp_buyer_id';

export async function getBuyerIdFromSession(): Promise<string | null> {
  const store = await cookies();
  return store.get(BUYER_COOKIE)?.value ?? null;
}
