import { prisma } from '../prisma';
import { OrderStatus } from '@prisma/client';
import { getDeliveryCost, type FulfillmentMethod } from './deliveryCost';
import { findServingCenter } from './findServingCenter';

export interface CheckoutInput {
  buyerId: string;
  region: string;
  fulfillmentMethod: FulfillmentMethod;
  items: { materialId: string; quantity: number }[];
}

/**
 * Validates the cart, locks catalog prices, and creates an Order/OrderItem
 * pair in PENDING_PAYMENT state. Order items only join a bid cycle once
 * payment is confirmed via webhook — see lib/bidding/joinCycle.ts.
 */
export async function createOrder(input: CheckoutInput) {
  if (input.items.length === 0) {
    throw new Error('Cannot checkout an empty cart.');
  }

  const materials = await prisma.material.findMany({
    where: { id: { in: input.items.map((item) => item.materialId) } },
  });
  const materialById = new Map(materials.map((m) => [m.id, m]));

  // Every order routes through a fulfillment center regardless of method —
  // delivery just adds a final hop from center to site (pickup ends there).
  const center = await findServingCenter(input.region);
  if (!center) {
    throw new Error(`No fulfillment center serves region ${input.region}.`);
  }

  const deliveryCost = getDeliveryCost(input.region, input.fulfillmentMethod);

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        buyerId: input.buyerId,
        region: input.region,
        status: OrderStatus.PENDING_PAYMENT,
      },
    });

    for (const item of input.items) {
      const material = materialById.get(item.materialId);
      if (!material) throw new Error(`Unknown material ${item.materialId}.`);

      await tx.orderItem.create({
        data: {
          orderId: order.id,
          materialId: material.id,
          quantity: item.quantity,
          priceLocked: material.catalogPrice,
          deliveryCost,
          fulfilmentCenterId: center.id,
        },
      });
    }

    return tx.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { items: true },
    });
  });
}
