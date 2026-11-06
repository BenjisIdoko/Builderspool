import { Prisma, DirectStatus, PayoutStatus } from '@prisma/client';
import { prisma } from '../prisma';
import { getSetting } from '../settings';
import { nairaToKobo } from '../money';
import { postLedgerEntry } from '../ledger';
import { refundDueKobo } from '../bidding/refund';

// Buy Direct fulfilment: a paid line goes straight to the seller whose listing
// the buyer picked. Every step is a compare-and-swap or an idempotent ledger
// posting, so running it twice (cron, page nudge, double click) is safe.

function reference(prefix: string, date = new Date()) {
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
  return `${prefix}-${datePart}-${Math.floor(1000 + Math.random() * 9000)}`;
}

// The buyer is not charged for a line the seller could not supply: it is
// recorded as unfilled and a refund due is posted (same entry key as pooled
// lines, so it can only ever be posted once per line).
async function refundLine(orderItemId: string, reason: string) {
  const item = await prisma.orderItem.findUniqueOrThrow({
    where: { id: orderItemId },
    include: { order: { select: { id: true, buyerId: true } } },
  });
  await prisma.orderItem.update({ where: { id: item.id }, data: { unfilledQuantity: item.quantity } });
  await postLedgerEntry({
    account: 'BUYER_REFUND_DUE',
    amountKobo: refundDueKobo(item, item.quantity),
    entryKey: `refund-due:${item.id}`,
    memo: reason,
    orderId: item.order.id,
    orderItemId: item.id,
    userId: item.order.buyerId,
  });
}

async function releaseStock(listingId: string | null, quantity: number) {
  if (!listingId) return;
  await prisma.sellerListing.updateMany({ where: { id: listingId }, data: { stockQty: { increment: quantity } } });
}

/**
 * Called when a DIRECT order is paid. Reserves the stock and opens the seller's
 * accept window; if the seller cannot supply the quantity, the line is refunded.
 */
export async function startDirectFulfilment(orderItemId: string): Promise<{ started: boolean }> {
  const existing = await prisma.directFulfilment.findUnique({ where: { orderItemId } });
  if (existing) return { started: true };

  const item = await prisma.orderItem.findUniqueOrThrow({ where: { id: orderItemId }, include: { listing: true } });
  if (!item.listing) {
    await refundLine(item.id, 'No seller on this Buy Direct line — not charged');
    return { started: false };
  }

  const hours = await getSetting<number>('direct.acceptWindowHours');
  try {
    const reserved = await prisma.$transaction(async (tx) => {
      const { count } = await tx.sellerListing.updateMany({
        where: { id: item.listing!.id, stockQty: { gte: item.quantity } },
        data: { stockQty: { decrement: item.quantity } },
      });
      if (count === 0) return false;
      await tx.directFulfilment.create({
        data: {
          orderItemId: item.id,
          sellerId: item.listing!.sellerId,
          listingId: item.listing!.id,
          quantity: item.quantity,
          unitPrice: item.priceLocked,
          acceptDeadlineAt: new Date(Date.now() + hours * 3_600_000),
        },
      });
      return true;
    });
    if (!reserved) {
      await refundLine(item.id, 'The seller could not supply this line — not charged');
      return { started: false };
    }
    return { started: true };
  } catch (err) {
    // A concurrent run created it first: nothing more to do.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return { started: true };
    throw err;
  }
}

export async function acceptDirect(id: string, sellerId: string, now = new Date()): Promise<boolean> {
  const { count } = await prisma.directFulfilment.updateMany({
    where: { id, sellerId, status: DirectStatus.AWAITING_ACCEPT, acceptDeadlineAt: { gt: now } },
    data: { status: DirectStatus.ACCEPTED, acceptedAt: now },
  });
  return count === 1;
}

async function closeUnaccepted(id: string, status: 'DECLINED' | 'EXPIRED', where: Prisma.DirectFulfilmentWhereInput, reason?: string) {
  const now = new Date();
  const { count } = await prisma.directFulfilment.updateMany({
    where: { id, status: DirectStatus.AWAITING_ACCEPT, ...where },
    data: status === 'DECLINED' ? { status, declinedAt: now, declineReason: reason ?? null } : { status },
  });
  if (count === 0) return false;
  const row = await prisma.directFulfilment.findUniqueOrThrow({ where: { id } });
  await releaseStock(row.listingId, row.quantity);
  await refundLine(row.orderItemId, status === 'DECLINED' ? 'The seller declined this line — not charged' : 'The seller did not accept in time — not charged');
  return true;
}

export function declineDirect(id: string, sellerId: string, reason?: string) {
  return closeUnaccepted(id, 'DECLINED', { sellerId }, reason?.trim().slice(0, 300) || undefined);
}

/** Lapses every Direct line the seller let pass its accept deadline. */
export async function expireOverdueDirect(now = new Date()): Promise<number> {
  const overdue = await prisma.directFulfilment.findMany({
    where: { status: DirectStatus.AWAITING_ACCEPT, acceptDeadlineAt: { lte: now } },
    select: { id: true },
  });
  let expired = 0;
  for (const { id } of overdue) if (await closeUnaccepted(id, 'EXPIRED', { acceptDeadlineAt: { lte: now } })) expired += 1;
  return expired;
}

/**
 * The fulfilment centre received the goods (and its quality check passed): the
 * seller is now owed the price less the Buy Direct commission, which
 * BuildersPool books. Amounts are fixed here, so a later change to the
 * commission setting never alters what this seller was promised.
 */
export async function issueDirectGrn(id: string) {
  const row = await prisma.directFulfilment.findUniqueOrThrow({ where: { id }, include: { orderItem: { select: { orderId: true } } } });
  if (row.status !== DirectStatus.ACCEPTED) throw new Error('The seller has not accepted this order line, so it cannot be received.');
  if (row.receivedAt) throw new Error('A GRN has already been issued for this line.');

  const pct = await getSetting<number>('fees.buyDirectCommissionPct');
  const goodsKobo = nairaToKobo(row.unitPrice) * row.quantity;
  const commissionKobo = Math.round((goodsKobo * pct) / 100);

  return prisma.$transaction(
    async (tx) => {
      const { count } = await tx.directFulfilment.updateMany({
        where: { id, status: DirectStatus.ACCEPTED, receivedAt: null },
        data: { status: DirectStatus.FULFILLED, receivedAt: new Date(), grnNumber: reference('GRN'), payoutStatus: PayoutStatus.PROCESSED },
      });
      if (count === 0) throw new Error('A GRN has already been issued for this line.');

      await postLedgerEntry(
        {
          account: 'SELLER_PAYABLE',
          amountKobo: goodsKobo - commissionKobo,
          entryKey: `direct-seller-payable:${id}`,
          memo: `Owed to the seller for goods received, less ${pct}% commission`,
          orderId: row.orderItem.orderId,
          orderItemId: row.orderItemId,
          userId: row.sellerId,
        },
        tx,
      );
      await postLedgerEntry(
        {
          account: 'PLATFORM_COMMISSION',
          amountKobo: commissionKobo,
          entryKey: `direct-commission:${id}`,
          memo: `Buy Direct commission (${pct}%)`,
          orderId: row.orderItem.orderId,
          orderItemId: row.orderItemId,
        },
        tx,
      );
      return tx.directFulfilment.findUniqueOrThrow({ where: { id } });
    },
    { timeout: 20_000, maxWait: 10_000 },
  );
}

/** Pays the seller once the GRN has cleared the line, and the payout switch is on. */
export async function disburseDirectPayout(id: string) {
  if (!(await getSetting<boolean>('money.sellerPayoutsEnabled'))) {
    throw new Error('Seller payouts are switched off in Settings until Paystack is live and reviewed.');
  }
  const row = await prisma.directFulfilment.findUniqueOrThrow({ where: { id } });
  if (row.payoutStatus !== PayoutStatus.PROCESSED) throw new Error('Only a payout cleared by GRN (PROCESSED) can be disbursed.');

  // Pay exactly what the GRN made payable, whatever the commission setting is now.
  const payable = await prisma.ledgerEntry.findUniqueOrThrow({ where: { entryKey: `direct-seller-payable:${id}` } });

  return prisma.$transaction(async (tx) => {
    const { count } = await tx.directFulfilment.updateMany({
      where: { id, payoutStatus: PayoutStatus.PROCESSED },
      data: { payoutStatus: PayoutStatus.PAID, payoutReference: reference('PAYOUT'), paidAt: new Date() },
    });
    if (count === 0) throw new Error('Only a payout cleared by GRN (PROCESSED) can be disbursed.');
    await postLedgerEntry(
      {
        account: 'SELLER_PAYABLE',
        amountKobo: -Number(payable.amountKobo),
        entryKey: `direct-seller-paid:${id}`,
        memo: 'Paid to the seller',
        orderItemId: row.orderItemId,
        userId: row.sellerId,
      },
      tx,
    );
    return tx.directFulfilment.findUniqueOrThrow({ where: { id } });
  });
}
