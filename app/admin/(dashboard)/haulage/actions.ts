'use server';

import { revalidatePath } from 'next/cache';
import { advanceDispatch, cancelDispatch, updateDispatchLocation } from '@/lib/fulfillment';
import { requireAdminUser } from '@/lib/admin/session';
import { recordAudit } from '@/lib/audit';

export async function advanceDispatchAction(formData: FormData) {
  const admin = await requireAdminUser();

  const dispatchId = formData.get('dispatchId');
  const location = formData.get('location');
  if (typeof dispatchId !== 'string') throw new Error('Missing dispatch id.');

  await advanceDispatch(dispatchId, typeof location === 'string' ? location : undefined);
  await recordAudit({ actor: { id: admin.id, role: admin.role }, action: 'dispatch.advanced', entityType: 'Dispatch', entityId: dispatchId, summary: 'Advanced a dispatch to its next stage' });

  revalidatePath('/admin/haulage');
  revalidatePath('/admin/orders');
}

export async function cancelDispatchAction(formData: FormData) {
  const admin = await requireAdminUser();

  const dispatchId = formData.get('dispatchId');
  if (typeof dispatchId !== 'string') throw new Error('Missing dispatch id.');

  await cancelDispatch(dispatchId);
  await recordAudit({ actor: { id: admin.id, role: admin.role }, action: 'dispatch.cancelled', entityType: 'Dispatch', entityId: dispatchId, summary: 'Cancelled a dispatch' });

  revalidatePath('/admin/haulage');
  revalidatePath('/admin/orders');
}

export async function updateDispatchLocationAction(formData: FormData) {
  const admin = await requireAdminUser();

  const dispatchId = formData.get('dispatchId');
  const location = formData.get('location');
  if (typeof dispatchId !== 'string' || typeof location !== 'string') {
    throw new Error('Missing dispatch id or location.');
  }

  await updateDispatchLocation(dispatchId, location);
  await recordAudit({ actor: { id: admin.id, role: admin.role }, action: 'dispatch.location_updated', entityType: 'Dispatch', entityId: dispatchId, summary: 'Updated a dispatch location' });

  revalidatePath('/admin/haulage');
  revalidatePath('/admin/orders');
}
