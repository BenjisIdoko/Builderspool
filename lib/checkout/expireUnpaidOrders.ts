import { OrderStatus, WalletEntryState } from '@prisma/client';
import { prisma } from '../prisma';
import { nairaToKobo } from '../money';
import { postLedgerEntry } from '../ledger';
import { formatNaira } from '../format';
import { notifyBuyerOrderUpdate } from '../notifications';

// An order that holds savings credit and is not paid within this long expires,
// and the credit goes back to the buyer. (The unpaid-order reminder also stops
// at 24 hours.)
export const UNPAID_CREDIT_HOLD_HOURS = 24;

export interface ExpireReport {
  expiredOrders: number;
  creditReleasedKobo: number;
}

/**
 * Gives savings credit back from unpaid orders that have run out of time.
 *
 * Only orders that hold credit are touched: they are marked CANCELLED and every
 * wallet entry spent on them becomes available again. The status change is a
 * compare-and-swap on PENDING_PAYMENT inside the same transaction, so an order
 * paid at the same moment is never both paid and cancelled, and a second run
 * does nothing. Orders without credit are left alone.
 */
export async function expireUnpaidCreditOrders(now = new Date()): Promise<ExpireReport> {
  const cutoff = new Date(now.getTime() - UNPAID_CREDIT_HOLD_HOURS * 3_600_000);
  const stale = await prisma.order.findMany({
    where: { status: OrderStatus.PENDING_PAYMENT, createdAt: { lte: cutoff }, savingsApplied: { gt: 0 } },
    select: { id: true, buyerId: true, savingsApplied: true },
    take: 50,
  });

  const report: ExpireReport = { expiredOrders: 0, creditReleasedKobo: 0 };
  for (const order of stale) {
    const appliedKobo = nairaToKobo(order.savingsApplied);
    const released = await prisma.$transaction(async (tx) => {
      const { count } = await tx.order.updateMany({
        where: { id: order.id, status: OrderStatus.PENDING_PAYMENT },
        data: { status: OrderStatus.CANCELLED },
      });
      if (count === 0) return false;
      await tx.savingsWalletEntry.updateMany({
        where: { appliedOrderId: order.id, state: WalletEntryState.APPLIED_TO_ORDER },
        data: { state: WalletEntryState.AVAILABLE, appliedOrderId: null, appliedAt: null },
      });
      await postLedgerEntry(
        {
          account: 'BUYER_SAVINGS_CREDIT',
          amountKobo: appliedKobo,
          entryKey: `savings-released:${order.id}`,
          memo: 'Savings credit released: the order was not paid in time',
          orderId: order.id,
          userId: order.buyerId,
        },
        tx,
      );
      return true;
    });
    if (!released) continue;

    report.expiredOrders += 1;
    report.creditReleasedKobo += appliedKobo;
    const shortId = `#${order.id.slice(-6).toUpperCase()}`;
    await notifyBuyerOrderUpdate(
      order.buyerId,
      order.id,
      `Order ${shortId} expired`,
      `It was not paid within ${UNPAID_CREDIT_HOLD_HOURS} hours, so we cancelled it and returned ${formatNaira(Number(order.savingsApplied))} to your savings credit.`,
      `order-expired:${order.id}`,
    ).catch((err) => console.error('Expired-order notice failed:', err));
  }
  return report;
}
