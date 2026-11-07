import { SheetAwardStatus, SheetStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { recordAudit } from '@/lib/audit';
import { startDirectFulfilment } from '@/lib/direct';
import { notifySheetNotAwarded } from './notify';

export interface SettleReport {
  outcome: 'AWARDED' | 'CANCELLED';
  lines: number;
  // CANCELLED only: lines sent back to the seller the buyer picked, and lines refunded.
  reverted: number;
  refunded: number;
}

/**
 * Carries out a finished sheet's outcome, once.
 *
 * AWARDED: every pooled order line becomes a SheetFulfilment for the vendor who
 * accepted, at that vendor's own bid price for the item.
 * CANCELLED: every pooled order line goes back to the seller the buyer picked at
 * the price the buyer paid (the Buy Direct flow), or is refunded when there is no
 * such seller or they cannot supply it.
 *
 * Each per-line step is idempotent, and `settledAt` is set last, so a run that
 * stopped midway is simply run again by the tick and finishes the rest.
 */
export async function settleSheet(sheetId: string, now = new Date()): Promise<SettleReport | null> {
  const sheet = await prisma.poolSheet.findUnique({
    where: { id: sheetId },
    include: {
      lines: { include: { orderItems: { select: { id: true, quantity: true } } } },
      awards: { where: { status: SheetAwardStatus.ACCEPTED }, include: { bid: { include: { lines: true } } } },
      bids: { select: { sellerId: true } },
    },
  });
  if (!sheet || sheet.settledAt) return null;
  if (sheet.status !== SheetStatus.AWARDED && sheet.status !== SheetStatus.CANCELLED) return null;

  const items = sheet.lines.flatMap((l) => l.orderItems.map((i) => ({ ...i, lineId: l.id })));
  const report: SettleReport = { outcome: sheet.status === SheetStatus.AWARDED ? 'AWARDED' : 'CANCELLED', lines: items.length, reverted: 0, refunded: 0 };

  let winnerId: string | null = null;
  if (sheet.status === SheetStatus.AWARDED) {
    const winner = sheet.awards[0];
    if (!winner) throw new Error(`Sheet ${sheetId} is AWARDED but no award was accepted.`);
    winnerId = winner.bid.sellerId;
    const priceByLine = new Map(winner.bid.lines.map((l) => [l.lineId, l.unitPrice]));
    const data = items.map((i) => {
      const unitPrice = priceByLine.get(i.lineId);
      if (unitPrice === undefined) throw new Error(`The winning bid has no price for sheet line ${i.lineId}.`);
      return { orderItemId: i.id, sheetId, bidId: winner.bidId, sellerId: winner.bid.sellerId, quantity: i.quantity, unitPrice };
    });
    await prisma.sheetFulfilment.createMany({ data, skipDuplicates: true });
  } else {
    for (const i of items) {
      const r = await startDirectFulfilment(i.id);
      if (r.started) report.reverted++;
      else report.refunded++;
    }
  }

  const { count } = await prisma.poolSheet.updateMany({ where: { id: sheetId, settledAt: null }, data: { settledAt: now } });
  if (count === 0) return null; // another run finished it first

  const others = [...new Set(sheet.bids.map((b) => b.sellerId))].filter((id) => id !== winnerId);
  await notifySheetNotAwarded(others, sheet, sheet.status === SheetStatus.AWARDED ? 'AWARDED_ELSEWHERE' : 'CANCELLED');
  await recordAudit({
    actor: null,
    action: 'sheet.settled',
    entityType: 'PoolSheet',
    entityId: sheetId,
    summary:
      report.outcome === 'AWARDED'
        ? `Settled ${sheet.category} sheet: ${report.lines} line(s) handed to the winning vendor`
        : `Settled cancelled ${sheet.category} sheet: ${report.reverted} line(s) sent back to the picked seller, ${report.refunded} refunded`,
    metadata: { ...report },
  });
  return report;
}
