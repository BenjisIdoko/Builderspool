import { prisma } from '../prisma';
import { WalletEntryState } from '@prisma/client';
import type { Allocation, Bid, OrderItem, Order } from '@prisma/client';

function generatePaymentReference(date = new Date()) {
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `SAVE-${datePart}-${randomPart}`;
}

/**
 * Credits a buyer's savings-wallet share for one allocation, called right
 * after its GRN is issued — the same real event that unlocks the seller's
 * payout, so both sides of this transaction settle from one honest trigger.
 * Silently does nothing if the winning bid ended up at or above the
 * reference price — a margin loss the business absorbs, never a negative
 * wallet entry charged back to the buyer.
 */
export async function creditSavingsForAllocation(
  allocation: Allocation & { bid: Bid; orderItem: OrderItem & { order: Order } }
) {
  const referenceValue = Number(allocation.orderItem.priceLocked) * allocation.quantityFilled;
  const actualValue = Number(allocation.bid.unitPrice) * allocation.quantityFilled;
  const grossSaving = referenceValue - actualValue;

  if (grossSaving <= 0) return null;

  const buyerShare = grossSaving / 2;

  return prisma.savingsWalletEntry.create({
    data: {
      buyerId: allocation.orderItem.order.buyerId,
      allocationId: allocation.id,
      referenceValue,
      actualValue,
      grossSaving,
      buyerShare,
    },
  });
}

export async function getSavingsWalletForBuyer(buyerId: string) {
  const entries = await prisma.savingsWalletEntry.findMany({
    where: { buyerId },
    include: {
      allocation: { include: { bid: { include: { material: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const available = entries
    .filter((e) => e.state === WalletEntryState.AVAILABLE)
    .reduce((sum, e) => sum + Number(e.buyerShare), 0);
  const withdrawalRequested = entries
    .filter((e) => e.state === WalletEntryState.WITHDRAWAL_REQUESTED)
    .reduce((sum, e) => sum + Number(e.buyerShare), 0);
  const paidOut = entries
    .filter((e) => e.state === WalletEntryState.PAID)
    .reduce((sum, e) => sum + Number(e.buyerShare), 0);
  const allTime = entries.reduce((sum, e) => sum + Number(e.buyerShare), 0);

  return { entries, available, withdrawalRequested, paidOut, allTime };
}

/** Moves every AVAILABLE entry for a buyer into WITHDRAWAL_REQUESTED — a real ops queue, not an automated payout (no payment rail exists yet, same honest gap as checkout's own initiatePayment stub). */
export async function requestWithdrawal(buyerId: string) {
  await prisma.savingsWalletEntry.updateMany({
    where: { buyerId, state: WalletEntryState.AVAILABLE },
    data: { state: WalletEntryState.WITHDRAWAL_REQUESTED, withdrawalRequestedAt: new Date() },
  });
}

export async function getSavingsForAdmin() {
  return prisma.savingsWalletEntry.findMany({
    include: {
      buyer: true,
      allocation: { include: { bid: { include: { material: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/** Admin marks a real withdrawal as paid — same manual-ops pattern as seller payout disbursement, since no live payment rail exists yet. */
export async function markWithdrawalPaid(entryId: string) {
  const entry = await prisma.savingsWalletEntry.findUniqueOrThrow({ where: { id: entryId } });
  if (entry.state !== WalletEntryState.WITHDRAWAL_REQUESTED) {
    throw new Error('Only a requested withdrawal can be marked paid.');
  }

  return prisma.savingsWalletEntry.update({
    where: { id: entryId },
    data: { state: WalletEntryState.PAID, paidAt: new Date(), paymentReference: generatePaymentReference() },
  });
}
