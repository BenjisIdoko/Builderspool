'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { KycStatus } from '@prisma/client';
import { getSellerIdFromSession } from '@/lib/seller/session';
import { verifyCacNumber } from '@/lib/kyc/metamap';

function requiredText(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing ${key}.`);
  }
  return value.trim();
}

function isWebUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
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
  // <input type="url"> is browser-side only and accepts javascript:/data: —
  // this link is later rendered in the admin review dialog, so only plain
  // web links are allowed.
  if (documentUrl && !isWebUrl(documentUrl)) {
    throw new Error('Document link must be a web link starting with https:// (or http://).');
  }

  const existing = await prisma.sellerProfile.findUniqueOrThrow({ where: { userId: sellerId } });
  const cacNumberChanged = existing.cacNumber !== cacNumber;

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
      // A CAC verification describes the exact number it checked — if the
      // seller changes the number without re-running Verify, the old result
      // would misleadingly describe a different company.
      ...(cacNumberChanged
        ? {
            cacVerifiedAt: null,
            cacVerifiedCompanyName: null,
            cacVerifiedStatus: null,
            cacVerifiedEntityType: null,
            cacVerificationError: null,
          }
        : {}),
    },
  });

  revalidatePath('/seller/kyc');
  revalidatePath('/admin/verification');
}

// Cross-checks the CAC number against the real registry (lib/kyc/metamap.ts)
// independent of the full KYC submission above — a seller can verify before
// filling out the rest of the form. Verification failures (bad number,
// inactive company, provider not yet configured) are stored as a normal
// field and shown inline, not thrown — those are expected outcomes, not
// application errors.
export async function verifyCacAction(formData: FormData) {
  const sellerId = await getSellerIdFromSession();
  if (!sellerId) redirect('/seller/login');

  const cacNumberRaw = formData.get('cacNumber');
  const cacNumber = typeof cacNumberRaw === 'string' ? cacNumberRaw.trim() : '';

  try {
    if (!cacNumber) throw new Error('Enter a CAC number to verify.');
    const result = await verifyCacNumber(cacNumber);
    await prisma.sellerProfile.update({
      where: { userId: sellerId },
      data: {
        cacNumber,
        cacVerifiedAt: new Date(),
        cacVerifiedCompanyName: result.companyName,
        cacVerifiedStatus: result.status,
        cacVerifiedEntityType: result.entityType,
        cacVerificationError: null,
      },
    });
  } catch (err) {
    await prisma.sellerProfile.update({
      where: { userId: sellerId },
      data: {
        cacNumber: cacNumber || undefined,
        cacVerifiedAt: null,
        cacVerifiedCompanyName: null,
        cacVerifiedStatus: null,
        cacVerifiedEntityType: null,
        cacVerificationError: err instanceof Error ? err.message : 'CAC verification failed.',
      },
    });
  }

  revalidatePath('/seller/kyc');
  revalidatePath('/admin/verification');
}
