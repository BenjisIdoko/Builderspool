import { SheetStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { recordAudit } from '@/lib/audit';
import { referencePriceFor } from './reference';
import { notifySheetOpened } from './notify';

/**
 * Pool close: OPEN -> BIDDING. Fixes each line's total quantity (recounted from
 * the order lines that joined, so a late join cannot drift it) and its reference
 * price, then opens the sheet to bids. One atomic compare-and-swap decides who
 * freezes it, so a second tick or an admin's retry does nothing.
 */
export async function freezeSheet(sheetId: string, now = new Date()): Promise<boolean> {
  const sheet = await prisma.poolSheet.findUnique({
    where: { id: sheetId },
    include: { lines: { include: { material: { select: { name: true } }, orderItems: { select: { quantity: true } } } } },
  });
  if (!sheet || sheet.status !== SheetStatus.OPEN) return false;

  const priced = await Promise.all(
    sheet.lines.map(async (line) => ({
      id: line.id,
      name: line.material.name,
      quantity: line.orderItems.reduce((sum, i) => sum + i.quantity, 0),
      reference: await referencePriceFor(line.materialId, sheet.zoneId),
    })),
  );

  const frozen = await prisma.$transaction(async (tx) => {
    const { count } = await tx.poolSheet.updateMany({ where: { id: sheetId, status: SheetStatus.OPEN }, data: { status: SheetStatus.BIDDING, frozenAt: now } });
    if (count === 0) return false;
    for (const p of priced) {
      await tx.poolSheetLine.update({ where: { id: p.id }, data: { totalQuantity: p.quantity, referencePrice: p.reference } });
    }
    return true;
  });
  if (!frozen) return false;

  await recordAudit({
    actor: null,
    action: 'sheet.frozen',
    entityType: 'PoolSheet',
    entityId: sheetId,
    summary: `Froze ${sheet.category} sheet: ${priced.length} line(s), ${priced.filter((p) => p.reference === null).length} without a reference price`,
    metadata: { lines: priced.map((p) => ({ material: p.name, quantity: p.quantity, referencePrice: p.reference })) },
  });
  const zone = await prisma.deliveryZone.findUnique({ where: { id: sheet.zoneId }, select: { name: true } });
  await notifySheetOpened(sheet, zone?.name ?? 'your zone');
  return true;
}
