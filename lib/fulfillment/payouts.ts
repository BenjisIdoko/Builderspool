import { prisma } from '../prisma';
import { PayoutStatus } from '@prisma/client';
import { getSetting } from '../settings';
import { nairaToKobo } from '../money';
import { postLedgerEntry } from '../ledger';
import { assertNoBankChangeUnderReview } from '../bank/hold';

function generatePayoutReference(date = new Date()) {
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `PAYOUT-${datePart}-${randomPart}`;
}

/** Disburses a seller's payout for an allocation once its GRN has cleared it (PROCESSED). */
export async function disbursePayout(allocationId: string) {
  if (!(await getSetting<boolean>('money.sellerPayoutsEnabled'))) {
    throw new Error('Seller payouts are switched off in Settings until Paystack is live and reviewed.');
  }
  const allocation = await prisma.allocation.findUniqueOrThrow({ where: { id: allocationId }, include: { bid: true } });
  await assertNoBankChangeUnderReview(allocation.bid.sellerId);

  if (allocation.payoutStatus !== PayoutStatus.PROCESSED) {
    throw new Error('Only a payout cleared by GRN (PROCESSED) can be disbursed.');
  }

  return prisma.$transaction(async (tx) => {
    const { count } = await tx.allocation.updateMany({
      where: { id: allocationId, payoutStatus: PayoutStatus.PROCESSED },
      data: { payoutStatus: PayoutStatus.PAID, payoutReference: generatePayoutReference(), paidAt: new Date() },
    });
    if (count === 0) throw new Error('Only a payout cleared by GRN (PROCESSED) can be disbursed.');

    // Settles what the GRN made payable.
    await postLedgerEntry(
      {
        account: 'SELLER_PAYABLE',
        amountKobo: -(nairaToKobo(allocation.bid.unitPrice) * allocation.quantityFilled),
        entryKey: `seller-paid:${allocation.id}`,
        memo: 'Paid to the seller',
        orderItemId: allocation.orderItemId,
        allocationId: allocation.id,
        userId: allocation.bid.sellerId,
      },
      tx,
    );
    return tx.allocation.findUniqueOrThrow({ where: { id: allocationId } });
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
