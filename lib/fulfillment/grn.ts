import { prisma } from '../prisma';
import { AllocationStatus, PayoutStatus } from '@prisma/client';

function generateGrnNumber(date = new Date()) {
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `GRN-${datePart}-${randomPart}`;
}

/**
 * Records a fulfillment center's physical receipt of a seller's allocation —
 * the trigger point for that seller's payout. Sets receivedAt + a generated
 * GRN number, moves the allocation to FULFILLED, and clears it for payout
 * processing (PROCESSED, not yet PAID — disbursement is a separate step).
 */
export async function issueGrn(allocationId: string) {
  const allocation = await prisma.allocation.findUniqueOrThrow({ where: { id: allocationId } });

  if (allocation.status === AllocationStatus.CANCELLED) {
    throw new Error('A cancelled allocation cannot receive a GRN.');
  }
  if (allocation.receivedAt) {
    throw new Error('A GRN has already been issued for this allocation.');
  }

  return prisma.allocation.update({
    where: { id: allocationId },
    data: {
      receivedAt: new Date(),
      grnNumber: generateGrnNumber(),
      status: AllocationStatus.FULFILLED,
      payoutStatus: PayoutStatus.PROCESSED,
    },
  });
}
