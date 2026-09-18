'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
// signInAdmin deliberately does NOT call redirect() itself — it's invoked
// client-side (see components/admin-signin-form.tsx) inside a try/catch so
// a wrong password shows an inline message instead of the error boundary;
// redirect()'s internal throw would be swallowed by that catch. The client
// navigates on success instead. signOutAdmin below is a plain form action
// with no client wrapper, so it keeps calling redirect() directly.
import { prisma } from '@/lib/prisma';
import { CycleStatus, Role } from '@prisma/client';
import { ADMIN_COOKIE } from '@/lib/admin/session';
import { verifyPassword } from '@/lib/auth/password';
import { awardCycle } from '@/lib/bidding';
import { issueGrn, disbursePayout, toggleAllocationHold } from '@/lib/fulfillment';
import { markWithdrawalPaid } from '@/lib/wallet';

// Errors are caught and returned as plain data (not thrown across the
// server/client boundary) — Next.js redacts a thrown Server Action error's
// message in production builds, replacing it with a generic digest-only
// message on the client. Returning { error } instead sidesteps that
// entirely, since it's just normal serializable data, not an exception.
export async function signInAdmin(formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const emailRaw = formData.get('email');
    const passwordRaw = formData.get('password');
    if (typeof emailRaw !== 'string' || typeof passwordRaw !== 'string' || !emailRaw || !passwordRaw) {
      throw new Error('Enter your email and password.');
    }

    const admin = await prisma.user.findUnique({ where: { email: emailRaw.toLowerCase().trim() } });
    if (!admin || admin.role !== Role.ADMIN || !admin.passwordHash) {
      throw new Error('Incorrect email or password.');
    }
    const valid = await verifyPassword(passwordRaw, admin.passwordHash);
    if (!valid) throw new Error('Incorrect email or password.');

    const store = await cookies();
    store.set(ADMIN_COOKIE, 'true', { httpOnly: true, sameSite: 'lax', path: '/' });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not sign in.' };
  }
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
  revalidatePath('/admin/escrow');
  revalidatePath('/seller/allocations');
}

export async function disbursePayoutAction(formData: FormData) {
  const { allocationId, cycleId } = requireAllocationFields(formData);
  await disbursePayout(allocationId);

  revalidatePath(`/admin/cycles/${cycleId}`);
  revalidatePath('/admin/escrow');
  revalidatePath('/seller/allocations');
}

export async function toggleAllocationHoldAction(formData: FormData) {
  const { allocationId, cycleId } = requireAllocationFields(formData);
  const reason = formData.get('reason');

  await toggleAllocationHold(allocationId, typeof reason === 'string' ? reason : undefined);

  revalidatePath(`/admin/cycles/${cycleId}`);
  revalidatePath('/admin/escrow');
  revalidatePath('/seller/allocations');
}

export async function markWithdrawalPaidAction(formData: FormData) {
  const entryId = formData.get('entryId');
  if (typeof entryId !== 'string') throw new Error('Missing wallet entry id.');

  await markWithdrawalPaid(entryId);

  revalidatePath('/admin/savings');
  revalidatePath('/account');
}
