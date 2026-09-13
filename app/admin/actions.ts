'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { CycleStatus } from '@prisma/client';
import { getDemoAdmin } from '@/lib/demoAdmin';
import { ADMIN_COOKIE } from '@/lib/admin/session';
import { awardCycle } from '@/lib/bidding';
import { issueGrn, disbursePayout, toggleAllocationHold } from '@/lib/fulfillment';

export async function signInAdmin() {
  await getDemoAdmin(); // throws if the seed hasn't run — fail loudly, not silently

  const store = await cookies();
  store.set(ADMIN_COOKIE, 'true', { httpOnly: true, sameSite: 'lax', path: '/' });
  redirect('/admin');
}

export async function signOutAdmin() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  redirect('/admin/login');
}

/**
 * Manual ops override: closes an OPEN cycle and awards it immediately,
 * regardless of its cutoffAt. The normal path is the cron-driven
 * closeDueCycles() — this exists for admin intervention (testing, or a
 * cycle that needs resolving before its scheduled cutoff).
 */
export async function forceAwardCycle(formData: FormData) {
  const cycleId = formData.get('cycleId');
  if (typeof cycleId !== 'string') throw new Error('Missing cycle id.');

  const cycle = await prisma.bidCycle.findUniqueOrThrow({ where: { id: cycleId } });
  if (cycle.status !== CycleStatus.OPEN) {
    throw new Error('Only an open cycle can be closed and awarded.');
  }

  await prisma.bidCycle.update({ where: { id: cycleId }, data: { status: CycleStatus.CLOSED } });
  await awardCycle(cycleId);

  revalidatePath('/admin');
  revalidatePath(`/admin/cycles/${cycleId}`);
}

function requireAllocationFields(formData: FormData) {
  const allocationId = formData.get('allocationId');
  const cycleId = formData.get('cycleId');
  if (typeof allocationId !== 'string' || typeof cycleId !== 'string') {
    throw new Error('Missing allocation or cycle id.');
  }
  return { allocationId, cycleId };
}

export async function issueGrnAction(formData: FormData) {
  const { allocationId, cycleId } = requireAllocationFields(formData);
  await issueGrn(allocationId);

  revalidatePath(`/admin/cycles/${cycleId}`);
  revalidatePath('/seller/allocations');
}

export async function disbursePayoutAction(formData: FormData) {
  const { allocationId, cycleId } = requireAllocationFields(formData);
  await disbursePayout(allocationId);

  revalidatePath(`/admin/cycles/${cycleId}`);
  revalidatePath('/seller/allocations');
}

export async function toggleAllocationHoldAction(formData: FormData) {
  const { allocationId, cycleId } = requireAllocationFields(formData);
  const reason = formData.get('reason');

  await toggleAllocationHold(allocationId, typeof reason === 'string' ? reason : undefined);

  revalidatePath(`/admin/cycles/${cycleId}`);
  revalidatePath('/seller/allocations');
}
