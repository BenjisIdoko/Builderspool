import { prisma } from '../prisma';

// Real, honest counts for the home page's hero trust-stat strip — never a
// fabricated/aspirational number.
export async function getStorefrontStats() {
  const [materialCount, fulfillmentCenterCount, sellerCount, categoryCount] = await Promise.all([
    prisma.material.count(),
    prisma.fulfillmentCenter.count(),
    prisma.sellerProfile.count(),
    prisma.material.findMany({ select: { category: true }, distinct: ['category'] }).then((r) => r.length),
  ]);
  return { materialCount, fulfillmentCenterCount, sellerCount, categoryCount };
}
