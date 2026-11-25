import { WalletEntryState } from '@prisma/client';
import { prisma } from '../prisma';
import { koboToNaira, nairaToKobo } from '../money';
import { postLedgerEntry } from '../ledger';
import { getOrderGrossTotal } from '../checkout/orderTotal';

/**
 * What the buyer is owed back for units no supplier took: the goods at the
 * locked unit price plus the line's delivery charge in proportion to the
 * unfilled share, in whole kobo.
 */
export function refundDueKobo(
  line: { priceLocked: { toString(): string }; deliveryCost: { toString(): string }; quantity: number },
  unfilled: number,
): number {
  if (unfilled <= 0 || line.quantity <= 0) return 0;
  const goods = nairaToKobo(line.priceLocked) * unfilled;
  const delivery = Math.round((nairaToKobo(line.deliveryCost) * unfilled) / line.quantity);
  return goods + delivery;
}

/**
 * Splits what a buyer is owed for an unfilled line into the cash they paid and
 * the savings credit they spent on it. Savings credit is applied to the whole
 * order total at checkout, so each line's share of it is that line's share of
 * the order: refund x (credit applied / order total), in whole kobo.
 *
 * `creditAlreadyReturnedKobo` is credit already handed back on earlier lines of
 * the same order, so rounding across lines can never return more than was applied.
 */
export function splitRefund(args: {
  refundKobo: number;
  creditAppliedKobo: number;
  orderGrossKobo: number;
  creditAlreadyReturnedKobo?: number;
}): { creditKobo: number; cashKobo: number } {
  const { refundKobo, creditAppliedKobo, orderGrossKobo, creditAlreadyReturnedKobo = 0 } = args;
  if (refundKobo <= 0 || creditAppliedKobo <= 0 || orderGrossKobo <= 0) {
    return { creditKobo: 0, cashKobo: Math.max(0, refundKobo) };
  }
  const share = Math.round((refundKobo * creditAppliedKobo) / orderGrossKobo);
  const creditKobo = Math.max(0, Math.min(share, refundKobo, creditAppliedKobo - creditAlreadyReturnedKobo));
  return { creditKobo, cashKobo: refundKobo - creditKobo };
}

/**
 * Records the refund for `unfilled` units of one order line, once (the ledger
 * keys make a retry a no-op). The cash part goes on the refund-due ledger; the
 * part the buyer paid with savings credit goes back into their savings credit
 * as a new available entry, never out as cash.
 */
export async function recordLineRefund(
  item: { id: string; orderId: string; priceLocked: { toString(): string }; deliveryCost: { toString(): string }; quantity: number },
  unfilled: number,
  memo: string,
  buyerId: string,
): Promise<{ cashKobo: number; creditKobo: number }> {
  const refundKobo = refundDueKobo(item, unfilled);
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: item.orderId },
    select: { savingsApplied: true, items: { select: { priceLocked: true, quantity: true, deliveryCost: true } } },
  });
  const creditAppliedKobo = nairaToKobo(order.savingsApplied);

  return prisma.$transaction(async (tx) => {
    const returned = await tx.ledgerEntry.aggregate({
      where: { orderId: item.orderId, account: 'BUYER_SAVINGS_CREDIT', entryKey: { startsWith: 'refund-credit:' } },
      _sum: { amountKobo: true },
    });
    const { creditKobo, cashKobo } = splitRefund({
      refundKobo,
      creditAppliedKobo,
      orderGrossKobo: nairaToKobo(getOrderGrossTotal({ items: order.items })),
      creditAlreadyReturnedKobo: Number(returned._sum.amountKobo ?? 0),
    });

    // A line fully paid with savings credit has no cash to give back.
    if (cashKobo > 0) {
      await postLedgerEntry(
        {
          account: 'BUYER_REFUND_DUE',
          amountKobo: cashKobo,
          entryKey: `refund-due:${item.id}`,
          memo: creditKobo > 0 ? `${memo} (cash part; savings credit part returned to credit)` : memo,
          orderId: item.orderId,
          orderItemId: item.id,
          userId: buyerId,
        },
        tx,
      );
    }

    if (creditKobo > 0) {
      const first = await postLedgerEntry(
        {
          account: 'BUYER_SAVINGS_CREDIT',
          amountKobo: creditKobo,
          entryKey: `refund-credit:${item.id}`,
          memo: 'Savings credit returned for an unfilled line',
          orderId: item.orderId,
          orderItemId: item.id,
          userId: buyerId,
        },
        tx,
      );
      if (first) {
        // Carved out of one of the entries spent on this order, so the wallet keeps its audit trail.
        const origin = await tx.savingsWalletEntry.findFirst({
          where: { appliedOrderId: item.orderId },
          orderBy: { createdAt: 'asc' },
          select: { id: true },
        });
        if (!origin) throw new Error(`No spent savings entry found for order ${item.orderId}`);
        await tx.savingsWalletEntry.create({
          data: {
            buyerId,
            originEntryId: origin.id,
            referenceValue: koboToNaira(creditKobo),
            actualValue: 0,
            grossSaving: koboToNaira(creditKobo),
            buyerShare: koboToNaira(creditKobo),
            state: WalletEntryState.AVAILABLE,
          },
        });
      }
    }
    return { cashKobo, creditKobo };
  });
}
