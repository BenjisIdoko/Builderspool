import { cookies } from 'next/headers';

// There's no seller auth yet (Phase 1 scope, not built) — this cookie is a
// placeholder "session" holding the signed-in seller's User id, set by
// app/seller/actions.ts's selectSeller(). Replace with real auth before
// this is anything but a demo.
export const SELLER_COOKIE = 'bp_seller_id';

export async function getSellerIdFromSession(): Promise<string | null> {
  const store = await cookies();
  return store.get(SELLER_COOKIE)?.value ?? null;
}
