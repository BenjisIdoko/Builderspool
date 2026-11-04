import { prisma } from '../prisma';
import { AllocationStatus, PayoutStatus } from '@prisma/client';
import { creditSavingsForAllocation } from '../wallet';
import { nairaToKobo } from '../money';
import { postLedgerEntry } from '../ledger';

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
  const allocation = await prisma.allocation.findUniqueOrThrow({
    where: { id: allocationId },
    include: { bid: true, orderItem: { include: { order: true } } },
  });

  if (allocation.status === AllocationStatus.CANCELLED) {
    throw new Error('A cancelled allocation cannot receive a GRN.');
  }
  // Goods are only received against an award the seller accepted. Awards made
  // before acceptance existed carry no deadline and are let through.
  if (allocation.status === AllocationStatus.PENDING && allocation.acceptDeadlineAt) {
    throw new Error('The seller has not accepted this award yet.');
  }
  if (allocation.receivedAt) {
    throw new Error('A GRN has already been issued for this allocation.');
  }

  // One transaction: the receipt, what we now owe the seller, and the buyer's
  // savings credit all land together or not at all.
  const updated = await prisma.$transaction(async (tx) => {
    const { count } = await tx.allocation.updateMany({
      where: { id: allocationId, receivedAt: null, status: { not: AllocationStatus.CANCELLED } },
      data: {
        receivedAt: new Date(),
        grnNumber: generateGrnNumber(),
        status: AllocationStatus.FULFILLED,
        payoutStatus: PayoutStatus.PROCESSED,
      },
    });
    if (count === 0) throw new Error('A GRN has already been issued for this allocation.');

    await postLedgerEntry(
      {
        account: 'SELLER_PAYABLE',
        amountKobo: nairaToKobo(allocation.bid.unitPrice) * allocation.quantityFilled,
        entryKey: `seller-payable:${allocation.id}`,
        memo: 'Owed to the seller for goods received (GRN issued)',
        orderId: allocation.orderItem.orderId,
        orderItemId: allocation.orderItemId,
        allocationId: allocation.id,
        userId: allocation.bid.sellerId,
      },
      tx,
    );

    // Same real event that unlocks the seller's payout also finalizes the
    // buyer's savings credit, if the winning bid actually beat the reference price.
    await creditSavingsForAllocation(allocation, tx);

    return tx.allocation.findUniqueOrThrow({ where: { id: allocationId } });
  }, { timeout: 20_000, maxWait: 10_000 });

  return updated;
}
