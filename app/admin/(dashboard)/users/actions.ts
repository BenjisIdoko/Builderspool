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

  await prisma.sellerProfile.update({
    where: { userId },
    data: { kycStatus: KycStatus.APPROVED, kycReviewedAt: new Date(), kycRejectionReason: null },
  });
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

  await prisma.sellerProfile.update({
    where: { userId },
    data: { kycStatus: KycStatus.REJECTED, kycReviewedAt: new Date(), kycRejectionReason: reason.trim() },
  });
  await recordAudit({ actor: { id: admin.id, role: admin.role }, action: 'kyc.rejected', entityType: 'SellerProfile', entityId: userId, summary: `Rejected a seller KYC submission — ${reason.trim()}` });

  revalidatePath('/admin/users');
  revalidatePath('/admin/verification');
}
