import { prisma } from '../prisma';
import { KycStatus } from '@prisma/client';

// Unified seller directory — merges what /admin/users and /admin/verification
// already show separately (identity + KYC status) with two genuinely new,
// real derived stats: GMV (month-to-date revenue from real allocations,
// same figure lib/queries/adminStats.ts's getTopSellersByRevenue uses) and
// a fulfillment rate (share of a seller's real allocations that have
// actually been received at a fulfillment center). No "Suspended" status —
// no backing field exists for account suspension anywhere in the schema.
export async function getSellerDirectory() {
  const monthStart = new Date();
  monthStart.setUTCHours(0, 0, 0, 0);
  monthStart.setUTCDate(1);

  const sellers = await prisma.user.findMany({
    where: { role: 'SELLER', sellerProfile: { isNot: null } },
    include: { sellerProfile: true },
    orderBy: { createdAt: 'desc' },
  });

  const allocations = await prisma.allocation.findMany({
    where: { status: { not: 'CANCELLED' } },
    select: {
      quantityFilled: true,
      receivedAt: true,
      createdAt: true,
      bid: {
        select: {
          sellerId: true,
          unitPrice: true,
          material: { select: { category: true } },
        },
      },
    },
  });

  return sellers
    .filter((s) => s.sellerProfile)
    .map((s) => {
      const own = allocations.filter((a) => a.bid.sellerId === s.id);
      const gmvMtd = own
        .filter((a) => a.createdAt >= monthStart)
        .reduce((sum, a) => sum + Number(a.bid.unitPrice) * a.quantityFilled, 0);
      const received = own.filter((a) => a.receivedAt).length;
      const fulfillmentPct = own.length > 0 ? (received / own.length) * 100 : null;
      const categoryCounts = new Map<string, number>();
      for (const a of own) {
        categoryCounts.set(a.bid.material.category, (categoryCounts.get(a.bid.material.category) ?? 0) + 1);
      }
      const topCategory = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

      return {
        id: s.id,
        name: s.businessName ?? s.name,
        email: s.email,
        regionsServed: s.sellerProfile!.regionsServed,
        category: topCategory,
        kycStatus: s.sellerProfile!.kycStatus,
        gmvMtd,
        fulfillmentPct,
        allocationCount: own.length,
      };
    })
    .sort((a, b) => b.gmvMtd - a.gmvMtd);
}

export type SellerDirectoryEntry = Awaited<ReturnType<typeof getSellerDirectory>>[number];

export async function getSellerDirectoryCounts(entries: SellerDirectoryEntry[]) {
  return {
    total: entries.length,
    verified: entries.filter((e) => e.kycStatus === KycStatus.APPROVED).length,
    pending: entries.filter((e) => e.kycStatus === KycStatus.PENDING).length,
  };
}
