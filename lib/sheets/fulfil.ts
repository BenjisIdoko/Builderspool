import { PayoutStatus, SheetFulfilmentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSetting } from '@/lib/settings';
import { nairaToKobo } from '@/lib/money';
import { postLedgerEntry } from '@/lib/ledger';
import { creditSavingsForSheetFulfilment } from '@/lib/wallet';
import { startDirectFulfilment } from '@/lib/direct';
import { assertNoBankChangeUnderReview } from '../bank/hold';

function reference(prefix: string, date = new Date()) {
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
  return `${prefix}-${datePart}-${Math.floor(1000 + Math.random() * 9000)}`;
}

/**
 * The fulfilment centre has received the goods and the quality check passed. The
 * vendor is now owed bid price x quantity (no commission on a pooled line: the
 * platform's income is its half of the saving), and the buyer's savings credit is
 * finalised, all in one transaction. A hold placed earlier is kept.
 */
export async function issueSheetGrn(id: string, now = new Date()) {
  const row = await prisma.sheetFulfilment.findUniqueOrThrow({ where: { id }, include: { orderItem: { include: { order: true } } } });
  if (row.status === SheetFulfilmentStatus.FAILED) throw new Error('This line was marked as not supplied, so it cannot be received.');
  if (row.status !== SheetFulfilmentStatus.PENDING || row.receivedAt) throw new Error('A GRN has already been issued for this line.');

  const payableKobo = nairaToKobo(row.unitPrice) * row.quantity;
  const payoutStatus = row.payoutStatus === PayoutStatus.ON_HOLD ? PayoutStatus.ON_HOLD : PayoutStatus.PROCESSED;

  return prisma.$transaction(
    async (tx) => {
      const { count } = await tx.sheetFulfilment.updateMany({
        where: { id, status: SheetFulfilmentStatus.PENDING, receivedAt: null, payoutStatus: row.payoutStatus },
        data: { status: SheetFulfilmentStatus.FULFILLED, receivedAt: now, grnNumber: reference('GRN', now), payoutStatus },
      });
      if (count === 0) throw new Error('A GRN has already been issued for this line.');

      await postLedgerEntry(
        {
          account: 'SELLER_PAYABLE',
          amountKobo: payableKobo,
          entryKey: `sheet-seller-payable:${id}`,
          memo: 'Owed to the vendor for goods received (GRN issued)',
          orderId: row.orderItem.orderId,
          orderItemId: row.orderItemId,
          userId: row.sellerId,
        },
        tx,
      );
      const fresh = await tx.sheetFulfilment.findUniqueOrThrow({ where: { id }, include: { orderItem: { include: { order: true } } } });
      await creditSavingsForSheetFulfilment(fresh, tx);
      return tx.sheetFulfilment.findUniqueOrThrow({ where: { id } });
    },
    { timeout: 20_000, maxWait: 10_000 },
  );
}

/** Pays the vendor once the GRN has cleared the line and the payout switch is on. */
export async function disburseSheetPayout(id: string, now = new Date()) {
  if (!(await getSetting<boolean>('money.sellerPayoutsEnabled'))) {
    throw new Error('Seller payouts are switched off in Settings until Paystack is live and reviewed.');
  }
  const row = await prisma.sheetFulfilment.findUniqueOrThrow({ where: { id } });
  await assertNoBankChangeUnderReview(row.sellerId);
  if (row.payoutStatus !== PayoutStatus.PROCESSED) throw new Error('Only a payout cleared by GRN (PROCESSED) can be disbursed.');
  const payable = await prisma.ledgerEntry.findUniqueOrThrow({ where: { entryKey: `sheet-seller-payable:${id}` } });

  return prisma.$transaction(async (tx) => {
    const { count } = await tx.sheetFulfilment.updateMany({
      where: { id, payoutStatus: PayoutStatus.PROCESSED },
      data: { payoutStatus: PayoutStatus.PAID, payoutReference: reference('PAYOUT', now), paidAt: now },
    });
    if (count === 0) throw new Error('Only a payout cleared by GRN (PROCESSED) can be disbursed.');
    await postLedgerEntry(
      { account: 'SELLER_PAYABLE', amountKobo: -Number(payable.amountKobo), entryKey: `sheet-seller-paid:${id}`, memo: 'Paid to the vendor', orderItemId: row.orderItemId, userId: row.sellerId },
      tx,
    );
    return tx.sheetFulfilment.findUniqueOrThrow({ where: { id } });
  });
}

/** Places or releases an ops hold on a payout. A paid line cannot be held; releasing returns to PROCESSED if the GRN cleared it, else PENDING_GRN. */
export async function toggleSheetFulfilmentHold(id: string, reason?: string) {
  const row = await prisma.sheetFulfilment.findUniqueOrThrow({ where: { id } });
  if (row.payoutStatus === PayoutStatus.PAID) throw new Error('A paid line cannot be put on hold.');
  if (row.payoutStatus === PayoutStatus.ON_HOLD) {
    return prisma.sheetFulfilment.update({ where: { id }, data: { payoutStatus: row.receivedAt ? PayoutStatus.PROCESSED : PayoutStatus.PENDING_GRN, holdReason: null } });
  }
  return prisma.sheetFulfilment.update({ where: { id }, data: { payoutStatus: PayoutStatus.ON_HOLD, holdReason: reason?.trim() || 'Ops exception — under review' } });
}

/**
 * Ops mark that the vendor did not supply a line they accepted (only before goods
 * are received). The line then goes back to the seller the buyer picked at the
 * price the buyer paid, or is refunded, exactly as on a cancelled sheet.
 */
export async function failSheetFulfilment(id: string, reason: string, now = new Date()) {
  const why = reason.trim().slice(0, 300);
  if (!why) throw new Error('Say why the vendor did not supply this line.');
  const { count } = await prisma.sheetFulfilment.updateMany({
    where: { id, status: SheetFulfilmentStatus.PENDING, receivedAt: null },
    data: { status: SheetFulfilmentStatus.FAILED, failedAt: now, failReason: why },
  });
  if (count === 0) throw new Error('Only a line still awaiting goods can be marked as not supplied.');
  const row = await prisma.sheetFulfilment.findUniqueOrThrow({ where: { id } });
  return startDirectFulfilment(row.orderItemId);
}
