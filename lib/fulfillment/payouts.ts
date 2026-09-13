import { prisma } from '../prisma';
import { PayoutStatus } from '@prisma/client';

function generatePayoutReference(date = new Date()) {
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `PAYOUT-${datePart}-${randomPart}`;
}

/** Disburses a seller's payout for an allocation once its GRN has cleared it (PROCESSED). */
export async function disbursePayout(allocationId: string) {
  const allocation = await prisma.allocation.findUniqueOrThrow({ where: { id: allocationId } });

  if (allocation.payoutStatus !== PayoutStatus.PROCESSED) {
    throw new Error('Only a payout cleared by GRN (PROCESSED) can be disbursed.');
  }

  return prisma.allocation.update({
    where: { id: allocationId },
    data: {
      payoutStatus: PayoutStatus.PAID,
      payoutReference: generatePayoutReference(),
      paidAt: new Date(),
    },
  });
}

/**
 * Toggles an ops hold on an allocation's payout (e.g. a quality or count
 * dispute). Releasing a hold reverts to PROCESSED if the GRN already cleared
 * it, or back to PENDING_GRN if it hadn't yet — never to PAID, since a
 * disbursed payout is final.
 */
export async function toggleAllocationHold(allocationId: string, reason?: string) {
  const allocation = await prisma.allocation.findUniqueOrThrow({ where: { id: allocationId } });

  if (allocation.payoutStatus === PayoutStatus.PAID) {
    throw new Error('A paid allocation cannot be put on hold.');
  }

  if (allocation.payoutStatus === PayoutStatus.ON_HOLD) {
    return prisma.allocation.update({
      where: { id: allocationId },
      data: {
        payoutStatus: allocation.receivedAt ? PayoutStatus.PROCESSED : PayoutStatus.PENDING_GRN,
        holdReason: null,
      },
    });
  }

  return prisma.allocation.update({
    where: { id: allocationId },
    data: {
      payoutStatus: PayoutStatus.ON_HOLD,
      holdReason: reason?.trim() || 'Ops exception — under review',
    },
  });
}
