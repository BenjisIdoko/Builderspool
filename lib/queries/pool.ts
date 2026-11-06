import { cache } from 'react';
import { prisma } from '../prisma';
import { getCycleTimes } from '../bidding/cycleTimes';
import { cycleDateFor, lagosYmd, ymdToDbDate } from '../bidding/schedule';

// What a buyer may see about a material's current pool: the published daily
// times and how much demand has already joined. Aggregate demand only — never
// bids, sellers, scores or prices (blind bidding stays blind).
export type PoolSnapshot = {
  poolCloseTime: string; // HH:MM, Lagos
  /** True once today's pool has closed: new orders join tomorrow's. */
  tomorrow: boolean;
  pooledQuantity: number;
  buyerCount: number;
};

export const getPoolSnapshot = cache(async (materialId: string): Promise<PoolSnapshot> => {
  const times = await getCycleTimes();
  const now = new Date();
  const ymd = cycleDateFor(now, times.poolCloseTime);
  const where = { materialId, bidCycle: { date: ymdToDbDate(ymd) } };

  const [sum, buyers] = await Promise.all([
    prisma.orderItem.aggregate({ _sum: { quantity: true }, where }),
    prisma.order.findMany({
      where: { items: { some: where } },
      select: { buyerId: true },
      distinct: ['buyerId'],
    }),
  ]);

  return {
    poolCloseTime: times.poolCloseTime,
    tomorrow: ymd !== lagosYmd(now),
    pooledQuantity: sum._sum.quantity ?? 0,
    buyerCount: buyers.length,
  };
});
