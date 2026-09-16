'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { KycStatus } from '@prisma/client';
import { getSellerIdFromSession } from '@/lib/seller/session';

function requiredText(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing ${key}.`);
  }
  return value.trim();
}

// Text/reference-only submission — this app has no file-storage infra yet
// (see the schema comment on SellerProfile), so documentUrl is a link to
// something already hosted, not a real upload.
export async function submitKyc(formData: FormData) {
  const sellerId = await getSellerIdFromSession();
  if (!sellerId) redirect('/seller/login');

  const businessRegNumber = requiredText(formData, 'businessRegNumber');
  const cacNumber = requiredText(formData, 'cacNumber');
  const idType = requiredText(formData, 'idType');
  const idNumber = requiredText(formData, 'idNumber');
  const documentUrlRaw = formData.get('documentUrl');
  const documentUrl = typeof documentUrlRaw === 'string' && documentUrlRaw.trim() ? documentUrlRaw.trim() : null;

  await prisma.sellerProfile.update({
    where: { userId: sellerId },
    data: {
      businessRegNumber,
      cacNumber,
      idType,
      idNumber,
      documentUrl,
      kycStatus: KycStatus.PENDING,
      kycSubmittedAt: new Date(),
      kycReviewedAt: null,
      kycRejectionReason: null,
    },
  });

  revalidatePath('/seller/kyc');
}
