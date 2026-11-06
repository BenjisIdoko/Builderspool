'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminUser } from '@/lib/admin/session';
import { recordAudit } from '@/lib/audit';
import { disburseDirectPayout, issueDirectGrn } from '@/lib/direct';

function lineId(formData: FormData): string {
  const id = formData.get('id');
  if (typeof id !== 'string' || !id) throw new Error('Missing order line.');
  return id;
}

function refresh() {
  revalidatePath('/admin/direct');
  revalidatePath('/admin/escrow');
  revalidatePath('/seller/orders');
}

// The fulfilment centre has received the goods and the quality check passed.
export async function issueDirectGrnAction(formData: FormData) {
  const admin = await requireAdminUser();
  const id = lineId(formData);
  await issueDirectGrn(id);
  await recordAudit({ actor: { id: admin.id, role: admin.role }, action: 'direct.grn_issued', entityType: 'DirectFulfilment', entityId: id, summary: 'Issued a goods received note for a Buy Direct line' });
  refresh();
}

export async function disburseDirectPayoutAction(formData: FormData) {
  const admin = await requireAdminUser();
  const id = lineId(formData);
  await disburseDirectPayout(id);
  await recordAudit({ actor: { id: admin.id, role: admin.role }, action: 'direct.payout_disbursed', entityType: 'DirectFulfilment', entityId: id, summary: 'Disbursed a Buy Direct seller payout' });
  refresh();
}
