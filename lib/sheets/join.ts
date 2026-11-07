import { Prisma, SheetStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { addDaysYmd, cycleDateFor, ymdToDbDate } from '@/lib/bidding/schedule';
import { buildSheetSchedule, getSheetTimes } from './schedule';

class SheetClosed extends Error {}

/**
 * Pools a paid order line onto its category sheet (category x delivery zone x
 * day), creating the sheet and the material's line when it is the first to
 * arrive. Returns false when the order has no zone, so the caller can fall back
 * to the older per-material cycle. Safe to run twice: a line that already
 * belongs to a sheet is left alone and the quantity is counted once.
 */
export async function joinSheetForOrderItem(orderItemId: string): Promise<boolean> {
  const item = await prisma.orderItem.findUniqueOrThrow({
    where: { id: orderItemId },
    include: { material: { select: { category: true } }, order: { select: { zoneId: true } } },
  });
  if (item.sheetLineId) return true;
  const zoneId = item.order.zoneId;
  if (!zoneId) return false;

  const times = await getSheetTimes();
  let ymd = cycleDateFor(new Date(), times.poolCloseTime);

  for (let attempt = 0; attempt < 4; attempt++) {
    const date = ymdToDbDate(ymd);
    const key = { category: item.material.category, zoneId, date };
    let sheet = await prisma.poolSheet.findUnique({ where: { category_zoneId_date: key } });
    if (!sheet) {
      try {
        sheet = await prisma.poolSheet.create({ data: { ...key, ...buildSheetSchedule(ymd, times) } });
      } catch (err) {
        // Another payment created it a moment ago.
        if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')) throw err;
        sheet = await prisma.poolSheet.findUniqueOrThrow({ where: { category_zoneId_date: key } });
      }
    }
    if (sheet.status !== SheetStatus.OPEN) {
      ymd = addDaysYmd(ymd, 1);
      continue;
    }

    const line = await prisma.poolSheetLine.upsert({
      where: { sheetId_materialId: { sheetId: sheet.id, materialId: item.materialId } },
      create: { sheetId: sheet.id, materialId: item.materialId },
      update: {},
    });

    try {
      await prisma.$transaction(async (tx) => {
        const linked = await tx.orderItem.updateMany({ where: { id: item.id, sheetLineId: null }, data: { sheetLineId: line.id } });
        if (linked.count === 0) return; // someone else already joined it
        const counted = await tx.poolSheetLine.updateMany({
          where: { id: line.id, sheet: { status: SheetStatus.OPEN } },
          data: { totalQuantity: { increment: item.quantity } },
        });
        if (counted.count === 0) throw new SheetClosed(); // frozen while we were joining: undo the link
      });
      return true;
    } catch (err) {
      if (!(err instanceof SheetClosed)) throw err;
      ymd = addDaysYmd(ymd, 1);
    }
  }
  throw new Error('Could not find an open sheet for this order line.');
}
