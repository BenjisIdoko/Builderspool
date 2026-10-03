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

const MAX_LINE_QUANTITY = 100_000;

// Quantities come straight from the request body (the cart's own server
// actions reject <= 0, but checkout accepts items directly). A negative or
// fractional line would reduce the computed total — and so the amount
// charged — while still pooling into a bid cycle.
function validateItems(items: CheckoutInput['items']) {
  const seen = new Set<string>();
  for (const item of items) {
    if (!item || typeof item.materialId !== 'string' || !item.materialId) {
      throw new Error('Invalid cart item.');
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_LINE_QUANTITY) {
      throw new Error(`Quantity must be a whole number between 1 and ${MAX_LINE_QUANTITY.toLocaleString('en-NG')}.`);
    }
    if (seen.has(item.materialId)) throw new Error('Each material can only appear once per order.');
    seen.add(item.materialId);
  }
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
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new Error('Cannot checkout an empty cart.');
  }
  validateItems(input.items);

  const materials = await prisma.material.findMany({
    where: { id: { in: input.items.map((item) => item.materialId) } },
  });
  const materialById = new Map(materials.map((m) => [m.id, m]));

  // A cart line can outlive a material's price being pulled for review, or
  // the material being retired — never let one be bought at a placeholder/
  // unverified price, or one no longer on the live catalog at all.
  const unavailable = materials.find((m) => m.needsPriceReview || m.retired);
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
