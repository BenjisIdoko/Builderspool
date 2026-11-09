import { cache } from 'react';
import { prisma } from '../prisma';
import { getBuyerFacingTimes } from '../bidding/buyerTimes';
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
  /** True when orders pool on category sheets: the count is then across every delivery area. */
  sheets: boolean;
};

export const getPoolSnapshot = cache(async (materialId: string): Promise<PoolSnapshot> => {
  const { times, sheets } = await getBuyerFacingTimes();
  const now = new Date();
  const ymd = cycleDateFor(now, times.poolCloseTime);
  // Lines on a category sheet are found through their sheet's date; older lines through their cycle's.
  const where = sheets
    ? { materialId, sheetLine: { sheet: { date: ymdToDbDate(ymd) } } }
    : { materialId, bidCycle: { date: ymdToDbDate(ymd) } };

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
    sheets,
  };
});
