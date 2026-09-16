import { prisma } from '@/lib/prisma';

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
