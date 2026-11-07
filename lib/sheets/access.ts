import { CoverageStatus, KycStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type SheetAccess =
  | { ok: true }
  | { ok: false; code: 'KYC' | 'SUSPENDED' | 'NOT_REGISTERED' | 'OUTSIDE_ZONE'; message: string };

// Whether a vendor may bid on a sheet: verified and not suspended, approved for
// the sheet's category, and approved for its delivery zone (or national supply).
// Checked when a bid is submitted and again when bids close, so a vendor who is
// suspended or loses coverage in between is excluded with a reason.
export async function getSheetAccess(sellerId: string, sheet: { category: string; zoneId: string }): Promise<SheetAccess> {
  const profile = await prisma.sellerProfile.findUnique({
    where: { userId: sellerId },
    select: { kycStatus: true, suspendedAt: true, nationalSupply: true, user: { select: { disabledAt: true } } },
  });
  if (!profile || profile.user.disabledAt) return { ok: false, code: 'KYC', message: 'This seller account is not active.' };
  if (profile.suspendedAt || profile.kycStatus === KycStatus.SUSPENDED) {
    return { ok: false, code: 'SUSPENDED', message: 'Your account is suspended, so you cannot bid. Contact BuildersPool support.' };
  }
  if (profile.kycStatus !== KycStatus.APPROVED) {
    return { ok: false, code: 'KYC', message: 'Your account must pass KYC review before you can bid.' };
  }

  const [category, coverage] = await Promise.all([
    prisma.sellerCategory.findUnique({ where: { sellerId_category: { sellerId, category: sheet.category } }, select: { status: true } }),
    profile.nationalSupply
      ? Promise.resolve({ status: CoverageStatus.APPROVED })
      : prisma.sellerZoneCoverage.findUnique({ where: { sellerId_zoneId: { sellerId, zoneId: sheet.zoneId } }, select: { status: true } }),
  ]);
  if (category?.status !== CoverageStatus.APPROVED) {
    return { ok: false, code: 'NOT_REGISTERED', message: `You are not approved to bid for ${sheet.category}. Ask for it in Settings.` };
  }
  if (coverage?.status !== CoverageStatus.APPROVED) {
    return { ok: false, code: 'OUTSIDE_ZONE', message: 'You are not approved to supply this delivery zone. Ask for it in Settings.' };
  }
  return { ok: true };
}
