import { prisma } from '../prisma';
import type { CartLine } from './types';
import { PICKABLE_LISTING } from '../queries/offers';

// Cart lines always join live Material data rather than a snapshot, so a
// buyer's cart never shows a stale price/name that diverges from what
// checkout will actually charge (createOrder.ts locks the live catalogPrice
// at checkout time regardless).
export async function getCartLinesForBuyer(buyerId: string): Promise<CartLine[]> {
  const items = await prisma.cartItem.findMany({
    where: { buyerId },
    include: {
      material: {
        select: { name: true, unit: true, category: true, catalogPrice: true, imageUrl: true },
      },
      // Only a pick that is still live and in stock survives; otherwise the
      // line quietly reverts to the catalogue price and the buyer can pick again.
      listing: {
        select: { id: true, price: true, stockQty: true, status: true, seller: { select: { businessName: true, disabledAt: true, sellerProfile: { select: { kycStatus: true, suspendedAt: true } } } } },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return items.map((item) => {
    const l = item.listing;
    const pickable =
      l &&
      l.status === PICKABLE_LISTING.status &&
      l.stockQty > 0 &&
      !l.seller.disabledAt &&
      l.seller.sellerProfile?.kycStatus === 'APPROVED' &&
      !l.seller.sellerProfile.suspendedAt;
    return {
    materialId: item.materialId,
    name: item.material.name,
    unit: item.material.unit,
    category: item.material.category,
    catalogPrice: Number(item.material.catalogPrice),
    imageUrl: item.material.imageUrl,
    quantity: item.quantity,
    listingId: pickable ? l.id : null,
    sellerName: pickable ? l.seller.businessName?.trim() || 'Verified seller' : null,
    unitPrice: pickable ? Number(l.price) : undefined,
    };
  });
}
