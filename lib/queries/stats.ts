import { prisma } from '../prisma';

// Real, honest counts for the home page's hero stat callout — never a
// fabricated/aspirational number.
export async function getStorefrontStats() {
  const [materialCount, fulfillmentCenterCount] = await Promise.all([
    prisma.material.count(),
    prisma.fulfillmentCenter.count(),
  ]);
  return { materialCount, fulfillmentCenterCount };
}
