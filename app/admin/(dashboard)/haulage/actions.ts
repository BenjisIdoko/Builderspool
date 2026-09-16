'use server';

import { revalidatePath } from 'next/cache';
import { advanceDispatch, cancelDispatch, updateDispatchLocation } from '@/lib/fulfillment';

export async function advanceDispatchAction(formData: FormData) {
  const dispatchId = formData.get('dispatchId');
  const location = formData.get('location');
  if (typeof dispatchId !== 'string') throw new Error('Missing dispatch id.');

  await advanceDispatch(dispatchId, typeof location === 'string' ? location : undefined);

  revalidatePath('/admin/haulage');
  revalidatePath('/admin/orders');
}

export async function cancelDispatchAction(formData: FormData) {
  const dispatchId = formData.get('dispatchId');
  if (typeof dispatchId !== 'string') throw new Error('Missing dispatch id.');

  await cancelDispatch(dispatchId);

  revalidatePath('/admin/haulage');
  revalidatePath('/admin/orders');
}

export async function updateDispatchLocationAction(formData: FormData) {
  const dispatchId = formData.get('dispatchId');
  const location = formData.get('location');
  if (typeof dispatchId !== 'string' || typeof location !== 'string') {
    throw new Error('Missing dispatch id or location.');
  }

  await updateDispatchLocation(dispatchId, location);

  revalidatePath('/admin/haulage');
  revalidatePath('/admin/orders');
}
