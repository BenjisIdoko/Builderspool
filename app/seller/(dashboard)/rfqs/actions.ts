'use server';

import { revalidatePath } from 'next/cache';
import { getSellerActor } from '@/lib/seller/session';
import { acceptSheetAward, declineSheetAward, submitSheetBid } from '@/lib/sheets';

type Result = { error: string } | { ok: true; totalAmount: number };

// The vendor's one bid on a sheet. The seller is always the session's own
// account, never a value from the form.
export async function submitSheetBidAction(sheetId: string, prices: Record<string, number>): Promise<Result> {
  const actor = await getSellerActor();
  if (!actor) return { error: 'Sign in again to continue.' };

  const clean: Record<string, number> = {};
  for (const [lineId, price] of Object.entries(prices ?? {})) clean[lineId] = Number(price);

  const result = await submitSheetBid({ sellerId: actor.sellerId, actorId: actor.userId, sheetId, prices: clean });
  if (!result.ok) return { error: result.error };
  revalidatePath('/seller/rfqs');
  revalidatePath(`/seller/rfqs/${sheetId}`);
  revalidatePath('/admin/sheets');
  return { ok: true, totalAmount: result.totalAmount };
}

export async function acceptSheetAwardAction(sheetId: string, awardId: string): Promise<{ error: string } | { ok: true }> {
  const actor = await getSellerActor();
  if (!actor) return { error: 'Sign in again to continue.' };
  const r = await acceptSheetAward({ awardId, sellerId: actor.sellerId, actorId: actor.userId });
  if (!r.ok) return { error: r.error };
  revalidatePath(`/seller/rfqs/${sheetId}`);
  revalidatePath('/seller/rfqs');
  revalidatePath('/admin/sheets');
  return { ok: true };
}

export async function declineSheetAwardAction(sheetId: string, awardId: string, reason: string): Promise<{ error: string } | { ok: true }> {
  const actor = await getSellerActor();
  if (!actor) return { error: 'Sign in again to continue.' };
  const r = await declineSheetAward({ awardId, sellerId: actor.sellerId, actorId: actor.userId, reason });
  if (!r.ok) return { error: r.error };
  revalidatePath(`/seller/rfqs/${sheetId}`);
  revalidatePath('/seller/rfqs');
  revalidatePath('/admin/sheets');
  return { ok: true };
}
