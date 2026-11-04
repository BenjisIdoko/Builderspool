'use server';

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
import { ADMIN_SESSION, requireAdminUser } from '@/lib/admin/session';
import { recordAudit } from '@/lib/audit';
import { createSession, destroySession, SESSION_TTL } from '@/lib/auth/sessionStore';
import { verifyPassword } from '@/lib/auth/password';
import { assertNotRateLimited, recordLoginAttempt } from '@/lib/auth/rateLimit';
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
    const email = emailRaw.toLowerCase().trim();

    await assertNotRateLimited(email);

    const admin = await prisma.user.findUnique({ where: { email } });
    if (!admin || admin.role !== Role.ADMIN || !admin.passwordHash) {
      await recordLoginAttempt(email, false);
      throw new Error('Incorrect email or password.');
    }
    const valid = await verifyPassword(passwordRaw, admin.passwordHash);
    if (!valid) {
      await recordLoginAttempt(email, false);
      throw new Error('Incorrect email or password.');
    }
    await recordLoginAttempt(email, true);

    await createSession(ADMIN_SESSION, admin.id, { ttlMs: SESSION_TTL.admin, persistent: true });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not sign in.' };
  }
}

export async function signOutAdmin() {
  await destroySession(ADMIN_SESSION);
  redirect('/admin/login');
}

/**
 * Manual ops override: closes an OPEN cycle and awards it immediately,
 * regardless of its cutoffAt. The normal path is the cron-driven
 * closeDueCycles() — this exists for admin intervention (testing, or a
 * cycle that needs resolving before its scheduled cutoff).
 */
export async function forceAwardCycle(formData: FormData) {
  const admin = await requireAdminUser();

  const cycleId = formData.get('cycleId');
  if (typeof cycleId !== 'string') throw new Error('Missing cycle id.');

  // Atomic compare-and-swap (WHERE status: OPEN), not a plain write — closes
  // the same race the cron's closeDueCycles() guards against: a double-click
  // or a race against the cron itself must not both proceed to award the
  // same cycle twice.
  const { count } = await prisma.bidCycle.updateMany({
    where: { id: cycleId, status: CycleStatus.OPEN },
    data: { status: CycleStatus.CLOSED },
  });
  if (count === 0) {
    throw new Error('Only an open cycle can be closed and awarded.');
  }

  await awardCycle(cycleId);
  await recordAudit({ actor: { id: admin.id, role: admin.role }, action: 'cycle.force_awarded', entityType: 'BidCycle', entityId: cycleId, summary: 'Closed and awarded a cycle ahead of its cutoff' });

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
  const admin = await requireAdminUser();

  const { allocationId, cycleId } = requireAllocationFields(formData);
  await issueGrn(allocationId);
  await recordAudit({ actor: { id: admin.id, role: admin.role }, action: 'grn.issued', entityType: 'Allocation', entityId: allocationId, summary: 'Issued a goods received note' });

  revalidatePath(`/admin/cycles/${cycleId}`);
  revalidatePath('/admin/escrow');
  revalidatePath('/seller/allocations');
}

export async function disbursePayoutAction(formData: FormData) {
  const admin = await requireAdminUser();

  const { allocationId, cycleId } = requireAllocationFields(formData);
  await disbursePayout(allocationId);
  await recordAudit({ actor: { id: admin.id, role: admin.role }, action: 'payout.disbursed', entityType: 'Allocation', entityId: allocationId, summary: 'Disbursed a seller payout' });

  revalidatePath(`/admin/cycles/${cycleId}`);
  revalidatePath('/admin/escrow');
  revalidatePath('/seller/allocations');
}

export async function toggleAllocationHoldAction(formData: FormData) {
  const admin = await requireAdminUser();

  const { allocationId, cycleId } = requireAllocationFields(formData);
  const reason = formData.get('reason');

  await toggleAllocationHold(allocationId, typeof reason === 'string' ? reason : undefined);
  await recordAudit({ actor: { id: admin.id, role: admin.role }, action: 'allocation.hold_toggled', entityType: 'Allocation', entityId: allocationId, summary: `Toggled a payout hold${typeof reason === 'string' && reason ? ` — ${reason}` : ''}` });

  revalidatePath(`/admin/cycles/${cycleId}`);
  revalidatePath('/admin/escrow');
  revalidatePath('/seller/allocations');
}

export async function markWithdrawalPaidAction(formData: FormData) {
  const admin = await requireAdminUser();

  const entryId = formData.get('entryId');
  if (typeof entryId !== 'string') throw new Error('Missing wallet entry id.');

  await markWithdrawalPaid(entryId);
  await recordAudit({ actor: { id: admin.id, role: admin.role }, action: 'withdrawal.marked_paid', entityType: 'SavingsWalletEntry', entityId: entryId, summary: 'Marked a savings withdrawal as paid' });

  revalidatePath('/admin/savings');
  revalidatePath('/account');
}
