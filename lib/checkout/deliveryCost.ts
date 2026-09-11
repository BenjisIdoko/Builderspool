// Flat-rate delivery pricing by region — placeholder for a future
// distance-based calculation once volume justifies the mapping API cost.
const FLAT_RATES_BY_REGION: Record<string, number> = {
  ABUJA: 5000,
  LAGOS: 7500,
  KANO: 8000,
};

const DEFAULT_RATE = 10000;

export type FulfillmentMethod = 'PICKUP' | 'DELIVERY';

export function getDeliveryCost(region: string, method: FulfillmentMethod): number {
  if (method === 'PICKUP') return 0;
  return FLAT_RATES_BY_REGION[region.toUpperCase()] ?? DEFAULT_RATE;
}
