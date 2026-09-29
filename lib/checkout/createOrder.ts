import { prisma } from '../prisma';
import { OrderStatus, type PaymentMethod } from '@prisma/client';
import { getDeliveryCost, type FulfillmentMethod } from './deliveryCost';
import { findServingCenter } from './findServingCenter';

export interface CheckoutInput {
  buyerId: string;
  region: string;
  fulfillmentMethod: FulfillmentMethod;
  paymentMethod: PaymentMethod;
  items: { materialId: string; quantity: number }[];
  // Required by validation below when fulfillmentMethod is DELIVERY; ignored
  // (and never persisted) for PICKUP, so a pickup order never carries stray
  // delivery-looking data.
  deliveryAddress?: string;
  deliveryContactName?: string;
  deliveryContactPhone?: string;
  deliveryWindow?: string;
  deliveryNotes?: string;
}

function requiredField(value: string | undefined, label: string): string {
  const trimmed = value?.trim();
  if (!trimmed) throw new Error(`${label} is required for delivery orders.`);
  return trimmed;
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

  // A cart line can outlive a material's price being pulled for review — never
  // let one be bought at a placeholder or unverified price.
  const unavailable = materials.find((m) => m.needsPriceReview);
  if (unavailable) {
    throw new Error(`${unavailable.name} is no longer available. Remove it from your cart to continue.`);
  }

  // Every order routes through a fulfillment center regardless of method —
  // delivery just adds a final hop from center to site (pickup ends there).
  const center = await findServingCenter(input.region);
  if (!center) {
    throw new Error(`No fulfillment center serves region ${input.region}.`);
  }

  const deliveryCost = getDeliveryCost(input.region, input.fulfillmentMethod);

  // Real site details for DELIVERY — validated here (server-side) since the
  // client already enforces it, but the client's word alone was never trusted
  // elsewhere in this file either. PICKUP orders get none of this, even if a
  // client sent some — there's no site to route a driver to.
  const isDelivery = input.fulfillmentMethod === 'DELIVERY';
  const delivery = isDelivery
    ? {
        deliveryAddress: requiredField(input.deliveryAddress, 'Delivery address'),
        deliveryContactName: requiredField(input.deliveryContactName, 'Delivery contact name'),
        deliveryContactPhone: requiredField(input.deliveryContactPhone, 'Delivery contact phone'),
        deliveryWindow: input.deliveryWindow?.trim() || null,
        deliveryNotes: input.deliveryNotes?.trim() || null,
      }
    : { deliveryAddress: null, deliveryContactName: null, deliveryContactPhone: null, deliveryWindow: null, deliveryNotes: null };

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        buyerId: input.buyerId,
        region: input.region,
        status: OrderStatus.PENDING_PAYMENT,
        paymentMethod: input.paymentMethod,
        ...delivery,
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

    // Cleared atomically with order creation — the real source of truth for
    // "the buyer's cart is empty after checkout," not a client-side action
    // racing against the page navigation that follows.
    await tx.cartItem.deleteMany({ where: { buyerId: input.buyerId } });

    return tx.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { items: true },
    });
  });
}
