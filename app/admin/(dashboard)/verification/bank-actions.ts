'use server';

import { revalidatePath } from 'next/cache';
import { BankChangeStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdminUser } from '@/lib/admin/session';
import { recordAudit } from '@/lib/audit';
import { sendBankChangeDecisionEmail } from '@/lib/email/send';

type Result = { error: string } | { ok: true };

function text(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '';
}

async function waitingRequest(id: string) {
  const request = await prisma.bankChangeRequest.findUnique({ where: { id }, include: { seller: { select: { email: true, name: true, businessName: true } } } });
  if (!request || request.status !== BankChangeStatus.PENDING_REVIEW) throw new Error('That request is no longer waiting for review. Refresh the page.');
  return request;
}

const refresh = () => {
  revalidatePath('/admin/verification');
  revalidatePath('/seller/kyc');
};

// Ops decide whether this change needs a call to the owner before it can be approved.
export async function setBankCallRequiredAction(formData: FormData): Promise<Result> {
  const admin = await requireAdminUser();
  try {
    const request = await waitingRequest(text(formData, 'id'));
    const required = text(formData, 'required') === 'true';
    await prisma.bankChangeRequest.update({
      where: { id: request.id },
      // Asking for a call again after one was logged starts that step over.
      data: required ? { callRequired: true, callCompletedAt: null, callNote: null, callById: null } : { callRequired: false },
    });
    await recordAudit({
      actor: { id: admin.id, role: admin.role },
      action: required ? 'bank_change.call_required' : 'bank_change.call_not_needed',
      entityType: 'BankChangeRequest',
      entityId: request.id,
      summary: required ? 'Asked for a confirmation call before approving a bank-detail change' : 'Decided a call is not needed for a bank-detail change',
    });
    refresh();
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not update the request.' };
  }
}

// Records that someone from ops phoned the owner on the number on file and what was confirmed.
export async function completeBankCallAction(formData: FormData): Promise<Result> {
  const admin = await requireAdminUser();
  try {
    const request = await waitingRequest(text(formData, 'id'));
    const note = text(formData, 'note');
    if (note.length < 10) throw new Error('Note who you spoke to and what they confirmed (at least a short sentence).');
    if (note.length > 500) throw new Error('Keep the call note under 500 characters.');
    await prisma.bankChangeRequest.update({ where: { id: request.id }, data: { callRequired: true, callCompletedAt: new Date(), callNote: note, callById: admin.id } });
    await recordAudit({
      actor: { id: admin.id, role: admin.role },
      action: 'bank_change.call_logged',
      entityType: 'BankChangeRequest',
      entityId: request.id,
      summary: 'Logged a confirmation call for a bank-detail change',
    });
    refresh();
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not save the call note.' };
  }
}

// Only now do the new details replace the old ones. A guarded update means two clicks approve once.
export async function approveBankChangeAction(formData: FormData): Promise<Result> {
  const admin = await requireAdminUser();
  try {
    const request = await waitingRequest(text(formData, 'id'));
    if (!request.otpVerifiedAt) throw new Error('The seller has not confirmed the emailed code yet.');
    if (request.callRequired && !request.callCompletedAt) throw new Error('A confirmation call is required. Call the owner and log it first.');

    await prisma.$transaction(async (tx) => {
      const { count } = await tx.bankChangeRequest.updateMany({
        where: { id: request.id, status: BankChangeStatus.PENDING_REVIEW },
        data: { status: BankChangeStatus.APPROVED, reviewedAt: new Date(), reviewedById: admin.id },
      });
      if (count === 0) throw new Error('That request was already decided.');
      await tx.sellerProfile.update({
        where: { userId: request.sellerId },
        data: { bankName: request.newBankName, bankAccountNumber: request.newAccountNumber, bankAccountName: request.newAccountName, bankNameMatch: request.nameMatch },
      });
    });
    await recordAudit({
      actor: { id: admin.id, role: admin.role },
      action: 'bank_change.approved',
      entityType: 'BankChangeRequest',
      entityId: request.id,
      summary: `Approved a bank-detail change for ${request.seller.businessName ?? request.seller.name} (name match ${request.nameMatch ?? 'unknown'})`,
    });
    // Telling the owner is best effort: the decision stands even if the email fails.
    await sendBankChangeDecisionEmail(request.seller.email, true).catch((e) => console.error('bank change decision email failed:', e));
    refresh();
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not approve.' };
  }
}

export async function rejectBankChangeAction(formData: FormData): Promise<Result> {
  const admin = await requireAdminUser();
  try {
    const request = await waitingRequest(text(formData, 'id'));
    const reason = text(formData, 'reason');
    if (reason.length < 5) throw new Error('Give a reason the seller can act on.');
    const { count } = await prisma.bankChangeRequest.updateMany({
      where: { id: request.id, status: BankChangeStatus.PENDING_REVIEW },
      data: { status: BankChangeStatus.REJECTED, reviewedAt: new Date(), reviewedById: admin.id, reviewNote: reason },
    });
    if (count === 0) throw new Error('That request was already decided.');
    await recordAudit({
      actor: { id: admin.id, role: admin.role },
      action: 'bank_change.rejected',
      entityType: 'BankChangeRequest',
      entityId: request.id,
      summary: `Rejected a bank-detail change: ${reason}`,
    });
    await sendBankChangeDecisionEmail(request.seller.email, false, reason).catch((e) => console.error('bank change decision email failed:', e));
    refresh();
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not reject.' };
  }
}
