import { prisma } from '../prisma';
import { CycleDemandSummary, AggregatedMaterialDemand } from './types';

/**
 * Aggregates buyer cart demand for a given cycle ID or the current open cycle.
 */
export async function getAggregatedDemandForCycle(cycleId: string): Promise<CycleDemandSummary | null> {
  const cycle = await prisma.demandCycle.findUnique({
    where: { id: cycleId },
    include: {
      cartItems: {
        include: {
          material: true,
        },
      },
    },
  });

  if (!cycle) return null;

  const demandMap = new Map<string, AggregatedMaterialDemand>();

  for (const item of cycle.cartItems) {
    const existing = demandMap.get(item.materialId);
    if (existing) {
      existing.totalQuantity += item.quantity;
      existing.buyerCount += 1;
    } else {
      demandMap.set(item.materialId, {
        materialId: item.materialId,
        materialName: item.material.name,
        category: item.material.category,
        unit: item.material.unit,
        totalQuantity: item.quantity,
        buyerCount: 1,
      });
    }
  }

  const demands = Array.from(demandMap.values());
  const totalQuantityNeeded = demands.reduce((acc, curr) => acc + curr.totalQuantity, 0);

  return {
    cycleId: cycle.id,
    date: cycle.date,
    status: cycle.status,
    cutoffAt: cycle.cutoffAt,
    totalMaterials: demands.length,
    totalQuantityNeeded,
    demands,
  };
}
