import { prisma } from '@/lib/prisma';
import { KycStatus } from '@prisma/client';

// Sellers most needing review float to the top: a submission actually
// waiting on ops comes before ones already resolved either way.
const STATUS_PRIORITY: Record<KycStatus, number> = {
  [KycStatus.PENDING]: 0,
  [KycStatus.NOT_SUBMITTED]: 1,
  [KycStatus.REJECTED]: 2,
  [KycStatus.APPROVED]: 3,
};

export async function getPendingVerificationCount() {
  return prisma.sellerProfile.count({ where: { kycStatus: KycStatus.PENDING } });
}

export async function getSellersForVerification() {
  const sellers = await prisma.user.findMany({
    where: { role: 'SELLER', sellerProfile: { isNot: null } },
    include: { sellerProfile: true },
  });

  return sellers
    .filter((s) => s.sellerProfile)
    .sort((a, b) => {
      const diff = STATUS_PRIORITY[a.sellerProfile!.kycStatus] - STATUS_PRIORITY[b.sellerProfile!.kycStatus];
      if (diff !== 0) return diff;
      const aTime = a.sellerProfile!.kycSubmittedAt?.getTime() ?? 0;
      const bTime = b.sellerProfile!.kycSubmittedAt?.getTime() ?? 0;
      return bTime - aTime;
    });
}

export type VerificationSeller = Awaited<ReturnType<typeof getSellersForVerification>>[number];
