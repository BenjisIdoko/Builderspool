import { prisma } from '@/lib/prisma';

export async function getAllocationsForSettlement() {
  return prisma.allocation.findMany({
    where: { status: { not: 'CANCELLED' } },
    include: {
      bid: {
        include: {
          seller: true,
          material: true,
          cycle: true,
        },
      },
      orderItem: {
        include: {
          order: { include: { buyer: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export type SettlementAllocation = Awaited<ReturnType<typeof getAllocationsForSettlement>>[number];
