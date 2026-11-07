import { prisma } from '../prisma';
import { OrderStatus, PurchaseMode } from '@prisma/client';
import { joinCycleForOrderItem } from '../bidding';
import { startDirectFulfilment } from '../direct';
import { isSheetEngineOn, joinSheetForOrderItem } from '../sheets';

/**
 * Marks an order PAID and joins each of its items to a bid cycle — the one
 * real event that lets an order into demand pooling (see joinCycleForOrderItem).
 * Called from both the Paystack webhook and the checkout-callback verification
 * on the order page, so it's guarded to run exactly once even if both race.
 */
export async function confirmOrderPaid(orderId: string) {
  const { count } = await prisma.order.updateMany({
    where: { id: orderId, status: { not: OrderStatus.PAID } },
    data: { status: OrderStatus.PAID, paidAt: new Date() },
  });

  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true },
  });

  if (count > 0) {
    for (const item of order.items) {
      // Buy Direct lines go to the seller the buyer picked; everything else pools.
      if (item.mode === PurchaseMode.DIRECT) await startDirectFulfilment(item.id);
      // Pool lines go onto a category sheet when that engine is on and the order has a zone;
      // otherwise they pool per material as before.
      else if (!((await isSheetEngineOn()) && (await joinSheetForOrderItem(item.id)))) await joinCycleForOrderItem(item.id);
    }
  }

  return order;
}
