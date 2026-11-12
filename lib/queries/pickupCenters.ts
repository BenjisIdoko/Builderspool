import { prisma } from '@/lib/prisma';

export type PickupCenter = { id: string; name: string; region: string; address: string };

/** "ABUJA" -> "Abuja". */
export function regionLabel(region: string): string {
  return region.charAt(0) + region.slice(1).toLowerCase();
}

// Every station a buyer can collect an order from, grouped by nothing: the
// caller filters by region. Name order keeps the list steady between visits.
export async function getPickupCenters(): Promise<PickupCenter[]> {
  return prisma.fulfillmentCenter.findMany({
    select: { id: true, name: true, region: true, address: true },
    orderBy: [{ region: 'asc' }, { name: 'asc' }],
  });
}
