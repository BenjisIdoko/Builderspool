import { cache } from 'react';
import { KycStatus, ListingStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { listingPhotoUrl } from '@/lib/storage/listingPhotos';

export type Offer = {
  id: string;
  seller: string;
  price: number;
  inStock: boolean;
  leadTimeDays: number;
  shelfLifeDays: number | null;
  photoUrl: string | null;
};

// What buyers may see: live listings from verified, active sellers with stock.
// Seller name is the business name only; no contact details leave this query.
// Cheapest first, so the first row is the pool's reference candidate.
export const getOffers = cache(async (materialId: string): Promise<Offer[]> => {
  const rows = await prisma.sellerListing.findMany({
    where: {
      materialId,
      status: ListingStatus.ACTIVE,
      stockQty: { gt: 0 },
      seller: { disabledAt: null, sellerProfile: { is: { kycStatus: KycStatus.APPROVED, suspendedAt: null } } },
    },
    select: {
      id: true,
      price: true,
      stockQty: true,
      leadTimeDays: true,
      shelfLifeDays: true,
      seller: { select: { businessName: true } },
      photos: { orderBy: { sortOrder: 'asc' }, take: 1, select: { path: true } },
    },
    orderBy: [{ price: 'asc' }, { leadTimeDays: 'asc' }],
  });

  return rows.map((r) => ({
    id: r.id,
    seller: r.seller.businessName?.trim() || 'Verified seller',
    price: Number(r.price),
    inStock: r.stockQty > 0,
    leadTimeDays: r.leadTimeDays,
    shelfLifeDays: r.shelfLifeDays,
    photoUrl: r.photos[0] ? listingPhotoUrl(r.photos[0].path) : null,
  }));
});
