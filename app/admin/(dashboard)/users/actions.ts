'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { KycStatus } from '@prisma/client';
import { requireAdminUser } from '@/lib/admin/session';
import { recordAudit } from '@/lib/audit';

export async function approveKycAction(formData: FormData) {
  const admin = await requireAdminUser();

  const userId = formData.get('userId');
  if (typeof userId !== 'string') throw new Error('Missing seller id.');

  // Only a pending submission can be approved — a suspended seller is
  // reactivated explicitly (reactivateSellerAction), never by approving again.
  const { count } = await prisma.sellerProfile.updateMany({
    where: { userId, kycStatus: KycStatus.PENDING },
    data: { kycStatus: KycStatus.APPROVED, kycReviewedAt: new Date(), kycRejectionReason: null },
  });
  if (count === 0) throw new Error('Only a pending submission can be approved.');
  await recordAudit({ actor: { id: admin.id, role: admin.role }, action: 'kyc.approved', entityType: 'SellerProfile', entityId: userId, summary: 'Approved a seller KYC submission' });

  revalidatePath('/admin/users');
  revalidatePath('/admin/verification');
  revalidatePath('/admin/sellers');
}

export async function rejectKycAction(formData: FormData) {
  const admin = await requireAdminUser();

  const userId = formData.get('userId');
  const reason = formData.get('reason');
  if (typeof userId !== 'string') throw new Error('Missing seller id.');
  if (typeof reason !== 'string' || !reason.trim()) throw new Error('Enter a reason for rejecting this submission.');

  const { count } = await prisma.sellerProfile.updateMany({
    where: { userId, kycStatus: KycStatus.PENDING },
    data: { kycStatus: KycStatus.REJECTED, kycReviewedAt: new Date(), kycRejectionReason: reason.trim() },
  });
  if (count === 0) throw new Error('Only a pending submission can be rejected.');
  await recordAudit({ actor: { id: admin.id, role: admin.role }, action: 'kyc.rejected', entityType: 'SellerProfile', entityId: userId, summary: `Rejected a seller KYC submission — ${reason.trim()}` });

  revalidatePath('/admin/users');
  revalidatePath('/admin/verification');
}

// Pauses an approved seller: they keep their login but can no longer bid or be
// awarded (isSellerEligible requires APPROVED), including bids already placed
// in a cycle that hasn't been awarded yet.
export async function suspendSellerAction(formData: FormData) {
  const admin = await requireAdminUser();

  const userId = formData.get('userId');
  const reason = formData.get('reason');
  if (typeof userId !== 'string') throw new Error('Missing seller id.');
  if (typeof reason !== 'string' || !reason.trim()) throw new Error('Enter a reason for suspending this seller.');

  const { count } = await prisma.sellerProfile.updateMany({
    where: { userId, kycStatus: KycStatus.APPROVED },
    data: { kycStatus: KycStatus.SUSPENDED, suspendedAt: new Date(), suspensionReason: reason.trim() },
  });
  if (count === 0) throw new Error('Only an approved seller can be suspended.');

  await recordAudit({ actor: { id: admin.id, role: admin.role }, action: 'seller.suspended', entityType: 'SellerProfile', entityId: userId, summary: `Suspended a seller — ${reason.trim()}` });
  revalidatePath('/admin/users');
  revalidatePath('/admin/verification');
  revalidatePath('/admin/sellers');
  revalidatePath('/seller', 'layout');
}

export async function reactivateSellerAction(formData: FormData) {
  const admin = await requireAdminUser();

  const userId = formData.get('userId');
  if (typeof userId !== 'string') throw new Error('Missing seller id.');

  const { count } = await prisma.sellerProfile.updateMany({
    where: { userId, kycStatus: KycStatus.SUSPENDED },
    data: { kycStatus: KycStatus.APPROVED, suspendedAt: null, suspensionReason: null },
  });
  if (count === 0) throw new Error('Only a suspended seller can be reactivated.');

  await recordAudit({ actor: { id: admin.id, role: admin.role }, action: 'seller.reactivated', entityType: 'SellerProfile', entityId: userId, summary: 'Reactivated a suspended seller' });
  revalidatePath('/admin/users');
  revalidatePath('/admin/verification');
  revalidatePath('/admin/sellers');
  revalidatePath('/seller', 'layout');
}
