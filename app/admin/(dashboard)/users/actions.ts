'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { KycStatus } from '@prisma/client';

export async function approveKycAction(formData: FormData) {
  const userId = formData.get('userId');
  if (typeof userId !== 'string') throw new Error('Missing seller id.');

  await prisma.sellerProfile.update({
    where: { userId },
    data: { kycStatus: KycStatus.APPROVED, kycReviewedAt: new Date(), kycRejectionReason: null },
  });

  revalidatePath('/admin/users');
  revalidatePath('/admin/verification');
}

export async function rejectKycAction(formData: FormData) {
  const userId = formData.get('userId');
  const reason = formData.get('reason');
  if (typeof userId !== 'string') throw new Error('Missing seller id.');
  if (typeof reason !== 'string' || !reason.trim()) throw new Error('Enter a reason for rejecting this submission.');

  await prisma.sellerProfile.update({
    where: { userId },
    data: { kycStatus: KycStatus.REJECTED, kycReviewedAt: new Date(), kycRejectionReason: reason.trim() },
  });

  revalidatePath('/admin/users');
  revalidatePath('/admin/verification');
}
