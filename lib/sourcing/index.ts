import { SourcingStatus } from '@prisma/client';
import { prisma } from '../prisma';
import { recordAudit } from '../audit';
import { recordLineRefund } from '../bidding/refund';
import { notifyBuyerOrderUpdate } from '../notifications';
import { formatQuantity } from '../format';

// BuildersPool meets every order (founder, 2026-11-26). A line that no supplier
// and no picked seller would fill is not refunded automatically any more: it goes
// to the ops team's sourcing queue (/admin/sourcing). Ops either source it, or as a
// last resort refund it.

/**
 * Hands `quantity` units of one order line to the ops team. Idempotent: a line
 * already in the queue keeps its row, so a re-run tick or a double call changes nothing.
 */
export async function sendToOpsSourcing(orderItemId: string, quantity: number, reason: string) {
  const item = await prisma.orderItem.findUniqueOrThrow({
    where: { id: orderItemId },
    include: { order: { select: { id: true, buyerId: true } }, material: { select: { name: true, unit: true } } },
  });
  await prisma.orderItem.update({ where: { id: item.id }, data: { unfilledQuantity: quantity } });
  const existing = await prisma.opsSourcing.findUnique({ where: { orderItemId } });
  if (existing) return existing;

  const row = await prisma.opsSourcing.create({ data: { orderItemId, quantity, reason } });
  await recordAudit({
    actor: null,
    action: 'sourcing.opened',
    entityType: 'OrderItem',
    entityId: item.id,
    summary: `${item.material.name}: ${formatQuantity(quantity, item.material.unit)} sent to BuildersPool sourcing (${reason})`,
  });
  await notifyBuyerOrderUpdate(
    item.order.buyerId,
    item.order.id,
    `We're sourcing ${item.material.name}`,
    `No supplier took ${formatQuantity(quantity, item.material.unit)}, so our team is sourcing it for you.`,
    `ops-sourcing:${item.id}`,
  );
  return row;
}

async function loadOpen(id: string) {
  const row = await prisma.opsSourcing.findUnique({
    where: { id },
    include: {
      orderItem: {
        include: { order: { select: { id: true, buyerId: true } }, material: { select: { name: true, unit: true } } },
      },
    },
  });
  if (!row) throw new Error('That sourcing item no longer exists.');
  if (row.status !== SourcingStatus.OPEN) throw new Error('Someone already closed this item.');
  return row;
}

/** Ops found the goods: the line counts as filled again and the buyer is told. */
export async function markSourced(id: string, adminId: string, note: string | null) {
  const row = await loadOpen(id);
  const { count } = await prisma.opsSourcing.updateMany({
    where: { id, status: SourcingStatus.OPEN },
    data: { status: SourcingStatus.SOURCED, note, resolvedAt: new Date(), resolvedById: adminId },
  });
  if (count === 0) throw new Error('Someone already closed this item.');
  await prisma.orderItem.update({ where: { id: row.orderItemId }, data: { unfilledQuantity: 0 } });
  await notifyBuyerOrderUpdate(
    row.orderItem.order.buyerId,
    row.orderItem.order.id,
    `Sourced: ${row.orderItem.material.name}`,
    `We found ${formatQuantity(row.quantity, row.orderItem.material.unit)} for you. It's on its way to our fulfilment centre.`,
    `ops-sourced:${row.orderItemId}`,
  );
}

/** Last resort: ops could not source it, so the buyer is refunded (cash part; credit goes back as credit). */
export async function refundInstead(id: string, adminId: string, note: string) {
  const row = await loadOpen(id);
  const { count } = await prisma.opsSourcing.updateMany({
    where: { id, status: SourcingStatus.OPEN },
    data: { status: SourcingStatus.REFUNDED, note, resolvedAt: new Date(), resolvedById: adminId },
  });
  if (count === 0) throw new Error('Someone already closed this item.');
  await recordLineRefund(row.orderItem, row.quantity, `Could not be sourced: ${note}`, row.orderItem.order.buyerId);
  await notifyBuyerOrderUpdate(
    row.orderItem.order.buyerId,
    row.orderItem.order.id,
    `Refund: ${row.orderItem.material.name}`,
    `We couldn't source ${formatQuantity(row.quantity, row.orderItem.material.unit)}. A refund has been recorded on your order.`,
    `ops-refund:${row.orderItemId}`,
  );
}
