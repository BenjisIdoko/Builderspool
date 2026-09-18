import { prisma } from '../prisma';
import type { CartLine } from './types';

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
    },
    orderBy: { createdAt: 'asc' },
  });

  return items.map((item) => ({
    materialId: item.materialId,
    name: item.material.name,
    unit: item.material.unit,
    category: item.material.category,
    catalogPrice: Number(item.material.catalogPrice),
    imageUrl: item.material.imageUrl,
    quantity: item.quantity,
  }));
}
