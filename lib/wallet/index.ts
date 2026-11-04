import { prisma } from '../prisma';
import { WalletEntryState } from '@prisma/client';
import type { Allocation, Bid, OrderItem, Order, Prisma } from '@prisma/client';
import { getSetting } from '../settings';
import { koboToNaira, nairaToKobo, splitKobo } from '../money';
import { postLedgerEntry } from '../ledger';

function generatePaymentReference(date = new Date()) {
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `SAVE-${datePart}-${randomPart}`;
}

/**
 * Credits a buyer's savings credit for one allocation, called right after its
 * GRN is issued — the same real event that unlocks the seller's payout, so both
 * sides of this transaction settle from one honest trigger. The saving is split
 * in whole kobo by `fees.poolSavingsBuyerSharePct`, any odd kobo going to the
 * buyer, and both shares are posted to the append-only ledger. Does nothing if
 * the winning bid ended up at or above the reference price — a margin loss the
 * business absorbs, never a negative entry charged back to the buyer.
 */
export async function creditSavingsForAllocation(
  allocation: Allocation & { bid: Bid; orderItem: OrderItem & { order: Order } },
  db: Prisma.TransactionClient | typeof prisma = prisma,
) {
  const referenceKobo = nairaToKobo(allocation.orderItem.priceLocked) * allocation.quantityFilled;
  const actualKobo = nairaToKobo(allocation.bid.unitPrice) * allocation.quantityFilled;
  const grossKobo = referenceKobo - actualKobo;

  if (grossKobo <= 0) return null;

  const buyerSharePct = await getSetting<number>('fees.poolSavingsBuyerSharePct');
  const { first: buyerKobo, second: platformKobo } = splitKobo(grossKobo, buyerSharePct);
  const buyerId = allocation.orderItem.order.buyerId;

  const entry = await db.savingsWalletEntry.create({
    data: {
      buyerId,
      allocationId: allocation.id,
      referenceValue: koboToNaira(referenceKobo),
      actualValue: koboToNaira(actualKobo),
      grossSaving: koboToNaira(grossKobo),
      buyerShare: koboToNaira(buyerKobo),
    },
  });

  const common = { orderId: allocation.orderItem.orderId, orderItemId: allocation.orderItemId, allocationId: allocation.id };
  await postLedgerEntry(
    { ...common, account: 'BUYER_SAVINGS_CREDIT', amountKobo: buyerKobo, entryKey: `savings-credit:${allocation.id}`, memo: 'Buyer share of verified Pool & Save saving', userId: buyerId },
    db,
  );
  await postLedgerEntry(
    { ...common, account: 'PLATFORM_SAVINGS_SHARE', amountKobo: platformKobo, entryKey: `savings-platform:${allocation.id}`, memo: 'BuildersPool share of verified Pool & Save saving' },
    db,
  );
  return entry;
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
  if (!(await getSetting<boolean>('money.walletWithdrawalsEnabled'))) {
    throw new Error('Savings-credit withdrawals are not available yet.');
  }
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
