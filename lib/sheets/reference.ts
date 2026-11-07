import { CoverageStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { PICKABLE_LISTING } from '@/lib/queries/offers';

// The pool's reference price for a material in a delivery zone: the lowest live
// listing among sellers who serve that zone (approved coverage, or national
// supply). Null when no such seller has a listing; the sheet then has no ceiling
// for that line. Read at pool close and stored on the sheet line, never recomputed.
export async function referencePriceFor(materialId: string, zoneId: string): Promise<number | null> {
  const listing = await prisma.sellerListing.findFirst({
    where: {
      materialId,
      ...PICKABLE_LISTING,
      seller: {
        AND: [
          PICKABLE_LISTING.seller,
          {
            OR: [
              { sellerProfile: { is: { nationalSupply: true } } },
              { zoneCoverage: { some: { zoneId, status: CoverageStatus.APPROVED } } },
            ],
          },
        ],
      },
    },
    orderBy: { price: 'asc' },
    select: { price: true },
  });
  return listing ? Number(listing.price) : null;
}
