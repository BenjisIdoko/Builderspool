'use server';

import { revalidatePath } from 'next/cache';
import { getSellerActor } from '@/lib/seller/session';
import { acceptDirect, declineDirect } from '@/lib/direct';
import { recordAudit } from '@/lib/audit';

type Result = { error: string } | { ok: true };

// A seller (owner or staff) answers a Buy Direct order line. Both calls are
// compare-and-swap on the line's status, so a double click or a late answer
// after the window closed changes nothing.
export async function answerDirectOrderAction(formData: FormData): Promise<Result> {
  const actor = await getSellerActor();
  if (!actor) return { error: 'Sign in again to continue.' };

  const id = String(formData.get('id') ?? '');
  const decision = String(formData.get('decision') ?? '');
  const reason = String(formData.get('reason') ?? '');

  const done = decision === 'accept' ? await acceptDirect(id, actor.sellerId) : decision === 'decline' ? await declineDirect(id, actor.sellerId, reason) : false;
  if (!done) return { error: 'This order line can no longer be answered. Its window may have closed.' };

  await recordAudit({
    actor: { id: actor.userId, role: actor.isOwner ? 'SELLER' : 'SELLER_STAFF' },
    action: decision === 'accept' ? 'direct.accepted' : 'direct.declined',
    entityType: 'DirectFulfilment',
    entityId: id,
    summary: decision === 'accept' ? 'Accepted a Buy Direct order line' : `Declined a Buy Direct order line${reason ? `: ${reason}` : ''}`,
  });
  revalidatePath('/seller/orders');
  revalidatePath('/admin/direct');
  return { ok: true };
}
