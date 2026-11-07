import { CoverageStatus, SheetBidStatus, SheetStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSheetAccess } from '@/lib/sheets/access';
import { lineCeiling } from '@/lib/sheets/ceiling';

const CRITERION_ORDER = ['PRICE', 'PERFORMANCE', 'CAPACITY', 'DELIVERY', 'GEOGRAPHY', 'RESPONSIVENESS'] as const;
const MATERIAL_LIVE = { retired: false, needsPriceReview: false } as const;

// Every catalogue category with this seller's registration status for it.
export async function getSellerCategories(sellerId: string) {
  const [categories, mine] = await Promise.all([
    prisma.material.findMany({ where: MATERIAL_LIVE, distinct: ['category'], select: { category: true }, orderBy: { category: 'asc' } }),
    prisma.sellerCategory.findMany({ where: { sellerId }, select: { category: true, status: true } }),
  ]);
  const status = new Map(mine.map((m) => [m.category, m.status]));
  return categories.map((c) => ({ name: c.category, status: status.get(c.category) ?? null }));
}

// Sheets this vendor can bid on right now (open for bids, category and zone both
// approved), plus every sheet they have already bid on, newest first.
export async function getSellerRfqs(sellerId: string) {
  const [profile, cats, zones, mine] = await Promise.all([
    prisma.sellerProfile.findUnique({ where: { userId: sellerId }, select: { nationalSupply: true } }),
    prisma.sellerCategory.findMany({ where: { sellerId, status: CoverageStatus.APPROVED }, select: { category: true } }),
    prisma.sellerZoneCoverage.findMany({ where: { sellerId, status: CoverageStatus.APPROVED }, select: { zoneId: true } }),
    prisma.sheetBid.findMany({ where: { sellerId }, select: { sheetId: true } }),
  ]);
  const zoneFilter = profile?.nationalSupply ? {} : { zoneId: { in: zones.map((z) => z.zoneId) } };

  const rows = await prisma.poolSheet.findMany({
    where: {
      OR: [
        { status: SheetStatus.BIDDING, category: { in: cats.map((c) => c.category) }, ...zoneFilter },
        { id: { in: mine.map((m) => m.sheetId) } },
      ],
    },
    include: {
      zone: { select: { name: true } },
      _count: { select: { lines: true } },
      bids: { where: { sellerId }, select: { status: true, totalAmount: true, ineligibleReason: true, award: { select: { status: true, rank: true } } } },
    },
    orderBy: [{ date: 'desc' }, { bidsCloseAt: 'asc' }],
    take: 60,
  });

  return rows.map((s) => ({
    id: s.id,
    category: s.category,
    zoneName: s.zone.name,
    status: s.status,
    bidsCloseAt: s.bidsCloseAt,
    lineCount: s._count.lines,
    myBid: s.bids[0]
      ? { status: s.bids[0].status, totalAmount: Number(s.bids[0].totalAmount), reason: s.bids[0].ineligibleReason, award: s.bids[0].award ? { status: s.bids[0].award.status, rank: s.bids[0].award.rank } : null }
      : null,
  }));
}

// One sheet as a vendor sees it: items with pictures, quantities and the reference
// price, never anyone else's bid. Null if the vendor has no business seeing it.
export async function getRfq(sheetId: string, sellerId: string) {
  const sheet = await prisma.poolSheet.findUnique({
    where: { id: sheetId },
    include: {
      zone: { select: { name: true } },
      lines: { include: { material: { select: { name: true, unit: true, imageUrl: true, category: true } }, orderItems: { select: { priceLocked: true } } }, orderBy: { material: { name: 'asc' } } },
      bids: { where: { sellerId }, include: { lines: true, scores: true, award: true } },
    },
  });
  if (!sheet) return null;

  const access = await getSheetAccess(sellerId, sheet);
  const myBid = sheet.bids[0] ?? null;
  if (!access.ok && !myBid) return null;

  const now = Date.now();
  const open = sheet.status === SheetStatus.BIDDING && now < sheet.bidsCloseAt.getTime();
  const priceByLine = new Map((myBid?.lines ?? []).map((l) => [l.lineId, Number(l.unitPrice)]));

  return {
    id: sheet.id,
    category: sheet.category,
    zoneName: sheet.zone.name,
    status: sheet.status,
    bidsCloseAt: sheet.bidsCloseAt,
    canBid: open && access.ok && !myBid,
    blockedReason: myBid ? null : !access.ok ? access.message : open ? null : sheet.status === SheetStatus.OPEN ? 'Bidding opens when the pool closes.' : 'This sheet is no longer accepting bids.',
    lines: sheet.lines.map((l) => ({
      id: l.id,
      name: l.material.name,
      unit: l.material.unit,
      imageUrl: l.material.imageUrl,
      category: l.material.category,
      quantity: l.totalQuantity,
      // The most a vendor may bid: the reference, or (no reference) the lowest price a buyer paid.
      ceiling: sheet.status === SheetStatus.OPEN ? null : lineCeiling(l.referencePrice === null ? null : Number(l.referencePrice), l.orderItems.map((i) => Number(i.priceLocked))),
      myPrice: priceByLine.get(l.id) ?? null,
    })),
    myBid: myBid
      ? {
          status: myBid.status,
          totalAmount: Number(myBid.totalAmount),
          reason: myBid.ineligibleReason,
          submittedAt: myBid.submittedAt,
          totalScore: myBid.totalScore === null ? null : Number(myBid.totalScore),
          scores: CRITERION_ORDER.map((c) => myBid.scores.find((x) => x.criterion === c)).filter((x): x is NonNullable<typeof x> => !!x).map((x) => ({ criterion: x.criterion, weight: x.weight, points: Number(x.points), reason: x.reason })),
          // An OFFERED row can outlive its window until the next tick, so the clock decides whether it is still open.
          award: myBid.award
            ? {
                id: myBid.award.id,
                rank: myBid.award.rank,
                status: myBid.award.status,
                expiresAt: myBid.award.expiresAt,
                declineReason: myBid.award.declineReason,
                open: myBid.award.status === 'OFFERED' && !!myBid.award.expiresAt && myBid.award.expiresAt.getTime() > now,
              }
            : null,
        }
      : null,
  };
}

// Admin: category requests waiting, and the recent sheets with their bid counts.
export async function getAdminSheets() {
  const [requests, sheets] = await Promise.all([
    prisma.sellerCategory.findMany({
      where: { status: CoverageStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      include: { seller: { select: { name: true, businessName: true } } },
    }),
    prisma.poolSheet.findMany({
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: 40,
      include: {
        zone: { select: { name: true } },
        lines: { select: { totalQuantity: true, referencePrice: true } },
        bids: { select: { status: true } },
        awards: { orderBy: { rank: 'asc' }, select: { rank: true, status: true, bid: { select: { seller: { select: { businessName: true, name: true } } } } } },
      },
    }),
  ]);

  return {
    requests: requests.map((r) => ({ id: r.id, category: r.category, sellerName: r.seller.businessName ?? r.seller.name })),
    sheets: sheets.map((s) => ({
      id: s.id,
      category: s.category,
      zoneName: s.zone.name,
      date: s.date,
      status: s.status,
      poolClosesAt: s.poolClosesAt,
      bidsCloseAt: s.bidsCloseAt,
      lineCount: s.lines.length,
      noReference: s.status === SheetStatus.OPEN ? 0 : s.lines.filter((l) => l.referencePrice === null).length,
      bidCount: s.bids.length,
      eligibleCount: s.bids.filter((b) => b.status === SheetBidStatus.ELIGIBLE).length,
      cancelReason: s.cancelReason,
      awards: s.awards.map((a) => ({ rank: a.rank, status: a.status, vendor: a.bid.seller.businessName ?? a.bid.seller.name })),
    })),
  };
}
