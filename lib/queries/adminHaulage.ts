import { prisma } from '@/lib/prisma';
import { DispatchStatus } from '@prisma/client';

// Cheap standalone count for the Orders page KPI strip — dispatches
// actually moving through the pipeline (assigned through in-transit),
// not yet delivered or cancelled.
export async function getActiveDispatchCount() {
  return prisma.dispatch.count({
    where: { status: { in: [DispatchStatus.ASSIGNED, DispatchStatus.AT_PICKUP, DispatchStatus.IN_TRANSIT] } },
  });
}

export async function getDispatchesForAdmin() {
  return prisma.dispatch.findMany({
    include: {
      vehicle: { include: { driver: true } },
      orderItem: {
        include: {
          material: true,
          order: { include: { buyer: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export type AdminDispatch = Awaited<ReturnType<typeof getDispatchesForAdmin>>[number];
