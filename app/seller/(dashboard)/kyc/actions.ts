'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { KycStatus } from '@prisma/client';
import { requireSellerOwner } from '@/lib/seller/session';
import { verifyCacNumber } from '@/lib/kyc/metamap';
import { uploadKycDocument, deleteKycDocument } from '@/lib/storage/kycDocuments';
import { compareBusinessNames } from '@/lib/kyc/nameMatch';
import { getSetting } from '@/lib/settings';
import { recordAudit } from '@/lib/audit';

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
  // KYC is the owner's: staff cannot change what the business declares.
  const { sellerId, userId: actorId } = await requireSellerOwner();

  const businessRegNumber = requiredText(formData, 'businessRegNumber');
  const cacNumber = requiredText(formData, 'cacNumber');
  const idType = requiredText(formData, 'idType');
  const idNumber = requiredText(formData, 'idNumber');

  const tin = requiredText(formData, 'tin');
  if (!/^[A-Za-z0-9-]{6,20}$/.test(tin)) throw new Error('Enter a valid TIN (6–20 letters, digits or hyphens).');
  const businessAddress = requiredText(formData, 'businessAddress');
  if (businessAddress.length < 10) throw new Error('Enter the full business address.');
  const bankName = requiredText(formData, 'bankName');
  const bankAccountNumber = requiredText(formData, 'bankAccountNumber');
  if (!/^\d{10}$/.test(bankAccountNumber)) throw new Error('A Nigerian bank account number has 10 digits.');
  const bankAccountName = requiredText(formData, 'bankAccountName');
  if (formData.get('termsAccepted') !== 'on') throw new Error('Accept the seller terms to submit.');

  const expiryRaw = formData.get('documentExpiresAt');
  let documentExpiresAt: Date | null = null;
  if (typeof expiryRaw === 'string' && expiryRaw.trim()) {
    documentExpiresAt = new Date(`${expiryRaw.trim()}T00:00:00`);
    if (Number.isNaN(documentExpiresAt.getTime())) throw new Error('Enter a valid document expiry date.');
    const today = new Date();
    if (documentExpiresAt < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
      throw new Error('That document has already expired — upload a current one.');
    }
  }
  const documentFile = formData.get('document');
  const newDocument = documentFile instanceof File && documentFile.size > 0 ? documentFile : null;

  const [existing, owner, termsVersion] = await Promise.all([
    prisma.sellerProfile.findUniqueOrThrow({ where: { userId: sellerId } }),
    prisma.user.findUniqueOrThrow({ where: { id: sellerId }, select: { name: true, businessName: true } }),
    getSetting<string>('accounts.termsVersion'),
  ]);
  const cacNumberChanged = existing.cacNumber !== cacNumber;

  // The account name should be the business's own — compared with the CAC-
  // verified company name when that check is current, else the account's
  // business name. Advisory for the reviewer; it never blocks submission.
  const nameToMatch = existing.cacVerifiedAt && !cacNumberChanged ? existing.cacVerifiedCompanyName : null;
  const bankNameMatch = compareBusinessNames(bankAccountName, nameToMatch ?? owner.businessName ?? owner.name);

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
        tin,
        businessAddress,
        bankName,
        bankAccountNumber,
        bankAccountName,
        bankNameMatch,
        documentExpiresAt,
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

  // Terms acceptance is a history by version, never overwritten.
  const alreadyAccepted = await prisma.sellerTermsAcceptance.findFirst({ where: { sellerUserId: sellerId, version: termsVersion } });
  if (!alreadyAccepted) {
    await prisma.sellerTermsAcceptance.create({ data: { sellerUserId: sellerId, version: termsVersion, acceptedById: actorId } });
  }
  await recordAudit({
    actor: { id: actorId, role: 'SELLER' },
    action: 'kyc.submitted',
    entityType: 'SellerProfile',
    entityId: sellerId,
    summary: `Submitted KYC for review (terms ${termsVersion}, bank name ${bankNameMatch.toLowerCase()})`,
  });

  revalidatePath('/seller/kyc');
  revalidatePath('/admin/verification');
}

// When admins publish a new terms version (Settings > accounts.termsVersion),
// the owner of an already-approved seller re-accepts it here.
export async function acceptCurrentTermsAction() {
  const { sellerId, userId } = await requireSellerOwner();
  const version = await getSetting<string>('accounts.termsVersion');

  const already = await prisma.sellerTermsAcceptance.findFirst({ where: { sellerUserId: sellerId, version } });
  if (!already) {
    await prisma.sellerTermsAcceptance.create({ data: { sellerUserId: sellerId, version, acceptedById: userId } });
    await recordAudit({
      actor: { id: userId, role: 'SELLER' },
      action: 'terms.accepted',
      entityType: 'SellerProfile',
      entityId: sellerId,
      summary: `Accepted seller terms ${version}`,
    });
  }
  revalidatePath('/seller/kyc');
}

// Cross-checks the CAC number against the real registry (lib/kyc/metamap.ts)
// independent of the full KYC submission above — a seller can verify before
// filling out the rest of the form. Verification failures (bad number,
// inactive company, provider not yet configured) are stored as a normal
// field and shown inline, not thrown — those are expected outcomes, not
// application errors.
export async function verifyCacAction(formData: FormData) {
  // KYC is the owner's: staff cannot change what the business declares.
  const { sellerId } = await requireSellerOwner();

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
