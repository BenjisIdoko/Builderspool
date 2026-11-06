import { ListingStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { listingPhotoUrl } from '@/lib/storage/listingPhotos';

const SELLER = { select: { businessName: true, name: true, sellerProfile: { select: { kycStatus: true } } } } as const;

function toRow(l: {
  id: string;
  price: unknown;
  stockQty: number;
  leadTimeDays: number;
  shelfLifeDays: number | null;
  qcReasons: string[];
  qcMedianPrice: unknown;
  reviewNote: string | null;
  reviewedAt: Date | null;
  updatedAt: Date;
  status: ListingStatus;
  material: { name: string; unit: string };
  seller: { businessName: string | null; name: string; sellerProfile: { kycStatus: string } | null };
  photos: { id: string; path: string }[];
}) {
  const price = Number(l.price);
  const median = l.qcMedianPrice == null ? null : Number(l.qcMedianPrice);
  return {
    id: l.id,
    material: l.material.name,
    unit: l.material.unit,
    seller: l.seller.businessName?.trim() || l.seller.name,
    sellerKyc: l.seller.sellerProfile?.kycStatus ?? 'NOT_SUBMITTED',
    price,
    median,
    // Shown to the reviewer as "x% of the median" so the 50-150% band is visible.
    percentOfMedian: median ? Math.round((price / median) * 100) : null,
    stockQty: l.stockQty,
    leadTimeDays: l.leadTimeDays,
    shelfLifeDays: l.shelfLifeDays,
    reasons: l.qcReasons,
    reviewNote: l.reviewNote,
    reviewedAt: l.reviewedAt,
    updatedAt: l.updatedAt,
    status: l.status,
    photos: l.photos.map((p) => ({ id: p.id, url: listingPhotoUrl(p.path) })),
  };
}

export type ReviewRow = ReturnType<typeof toRow>;

const INCLUDE = {
  material: { select: { name: true, unit: true } },
  seller: SELLER,
  photos: { orderBy: { sortOrder: 'asc' as const }, select: { id: true, path: true } },
};

// Listings the upload checks flagged, oldest first so nothing waits behind newer ones.
export async function getReviewQueue() {
  const [pending, decided] = await Promise.all([
    prisma.sellerListing.findMany({ where: { status: ListingStatus.PENDING_REVIEW }, include: INCLUDE, orderBy: { updatedAt: 'asc' } }),
    prisma.sellerListing.findMany({
      where: { reviewedAt: { not: null } },
      include: INCLUDE,
      orderBy: { reviewedAt: 'desc' },
      take: 10,
    }),
  ]);
  return { pending: pending.map(toRow), decided: decided.map(toRow) };
}
