'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { KycStatus } from '@prisma/client';
import { getSellerIdFromSession } from '@/lib/seller/session';
import { verifyCacNumber } from '@/lib/kyc/metamap';
import { uploadKycDocument, deleteKycDocument } from '@/lib/storage/kycDocuments';

function requiredText(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing ${key}.`);
  }
  return value.trim();
}

// The supporting document is uploaded to a private Supabase Storage bucket
// (lib/storage/kycDocuments.ts); optional on resubmission — leaving the file
// input empty keeps whatever document is already on file.
export async function submitKyc(formData: FormData) {
  const sellerId = await getSellerIdFromSession();
  if (!sellerId) redirect('/seller/login');

  const businessRegNumber = requiredText(formData, 'businessRegNumber');
  const cacNumber = requiredText(formData, 'cacNumber');
  const idType = requiredText(formData, 'idType');
  const idNumber = requiredText(formData, 'idNumber');
  const documentFile = formData.get('document');
  const newDocument = documentFile instanceof File && documentFile.size > 0 ? documentFile : null;

  const existing = await prisma.sellerProfile.findUniqueOrThrow({ where: { userId: sellerId } });
  const cacNumberChanged = existing.cacNumber !== cacNumber;

  // Upload first so a rejected/failed file stops the whole submission before
  // anything is written; if the DB write then fails, the orphan is removed.
  const stored = newDocument ? await uploadKycDocument(sellerId, newDocument) : null;

  try {
    await prisma.sellerProfile.update({
      where: { userId: sellerId },
      data: {
        businessRegNumber,
        cacNumber,
        idType,
        idNumber,
        ...(stored ? { documentPath: stored.path, documentName: stored.displayName } : {}),
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
  } catch (err) {
    if (stored) await deleteKycDocument(stored.path);
    throw err;
  }

  if (stored && existing.documentPath) await deleteKycDocument(existing.documentPath);

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
