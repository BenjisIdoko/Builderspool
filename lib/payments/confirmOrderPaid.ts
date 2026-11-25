import { prisma } from '../prisma';
import { OrderStatus, PurchaseMode } from '@prisma/client';
import { joinCycleForOrderItem } from '../bidding';
import { startDirectFulfilment } from '../direct';
import { isSheetEngineOn, joinSheetForOrderItem } from '../sheets';
import { notifyBuyerOrderPaid } from '../notifications';

/**
 * Marks an order PAID and joins each of its items to a bid cycle — the one
 * real event that lets an order into demand pooling (see joinCycleForOrderItem).
 * Called from both the Paystack webhook and the checkout-callback verification
 * on the order page, so it's guarded to run exactly once even if both race.
 */
export async function confirmOrderPaid(orderId: string) {
  const { count } = await prisma.order.updateMany({
    // Only an order still waiting for payment can become paid: a cancelled one
    // (for example an unpaid order that expired and gave its credit back) must not.
    where: { id: orderId, status: OrderStatus.PENDING_PAYMENT },
    data: { status: OrderStatus.PAID, paidAt: new Date() },
  });

  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true },
  });

  if (count === 0 && order.status === OrderStatus.CANCELLED) {
    // Money arrived for an order that had already expired and given its credit
    // back. It cannot be applied; it needs a manual refund by ops.
    console.error(`Payment received for cancelled order ${order.id}: refund it manually.`);
  }

  if (count > 0) {
    for (const item of order.items) {
      // Buy Direct lines go to the seller the buyer picked; everything else pools.
      if (item.mode === PurchaseMode.DIRECT) await startDirectFulfilment(item.id);
      // Pool lines go onto a category sheet when that engine is on and the order has a zone;
      // otherwise they pool per material as before.
      else if (!((await isSheetEngineOn()) && (await joinSheetForOrderItem(item.id)))) await joinCycleForOrderItem(item.id);
    }
    await notifyBuyerOrderPaid(order.buyerId, order.id, order.items.length);
  }

  return order;
}
