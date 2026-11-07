import { prisma } from '../prisma';
import { OrderStatus, PurchaseMode, type PaymentMethod } from '@prisma/client';
import { getDeliveryCost, type FulfillmentMethod } from './deliveryCost';
import { getSetting } from '../settings';
import { regionForState } from '../areas/region';
import { findServingCenter } from './findServingCenter';
import { getPickableListing } from '../queries/offers';

export interface CheckoutInput {
  buyerId: string;
  region: string;
  // Where the buyer is. Required when the locality picker is switched on, in
  // which case it decides the region, the zone and the delivery fee.
  localityId?: string | null;
  fulfillmentMethod: FulfillmentMethod;
  paymentMethod: PaymentMethod;
  // How the whole cart is bought. DIRECT needs a picked seller on every line.
  mode?: 'POOL' | 'DIRECT';
  // listingId is the seller offer the buyer picked; the price is always read
  // from that listing here, never from the client.
  items: { materialId: string; quantity: number; listingId?: string | null }[];
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

  // A picked offer must still be live and have enough stock; its price (not the
  // catalogue price) is what gets locked. A line with no pick keeps the
  // catalogue price, as before sellers could list.
  const picks = new Map<string, { id: string; price: number }>();
  for (const item of input.items) {
    if (!item.listingId) continue;
    const material = materialById.get(item.materialId);
    const listing = await getPickableListing(item.listingId, item.materialId);
    if (!listing) {
      throw new Error(`The seller offer for ${material?.name ?? 'an item'} is no longer available. Remove it from your cart and pick again.`);
    }
    if (listing.stockQty < item.quantity) {
      throw new Error(`Only ${listing.stockQty.toLocaleString('en-NG')} of ${material?.name ?? 'this item'} are available from that seller. Lower the quantity to continue.`);
    }
    picks.set(item.materialId, { id: listing.id, price: Number(listing.price) });
  }

  const mode = input.mode === 'DIRECT' ? PurchaseMode.DIRECT : PurchaseMode.POOL;
  if (mode === PurchaseMode.DIRECT) {
    const unpicked = input.items.find((item) => !picks.has(item.materialId));
    if (unpicked) {
      const name = materialById.get(unpicked.materialId)?.name ?? 'an item';
      throw new Error(`Buy Direct needs a seller for every item. Pick a seller for ${name}, or choose Pool & Save.`);
    }
  }

  // Every order routes through a fulfillment center regardless of method —
  // delivery just adds a final hop from center to site (pickup ends there).
  // With the locality picker on, the buyer's locality decides the region, the
  // zone (the pool key) and the delivery fee. Off, it is the old region flow.
  let region = input.region;
  let area: { localityId: string; zoneId: string } | null = null;
  let zoneFee: number | null = null;
  if (await getSetting<boolean>('areas.checkoutPickerEnabled')) {
    if (!input.localityId) throw new Error('Choose where you are so we can check delivery.');
    const locality = await prisma.locality.findUnique({
      where: { id: input.localityId },
      include: { zone: true, lga: { include: { state: true } } },
    });
    if (!locality || !locality.active) throw new Error('That area is not available. Choose another.');
    if (!locality.zone || !locality.zone.active) throw new Error(`We do not deliver to ${locality.name} yet.`);
    const zoneRegion = regionForState(locality.lga.state.name);
    if (!zoneRegion) throw new Error(`We do not serve ${locality.lga.state.name} yet.`);
    region = zoneRegion;
    area = { localityId: locality.id, zoneId: locality.zone.id };
    zoneFee = locality.zone.deliveryFee === null ? null : Number(locality.zone.deliveryFee);
    if (input.fulfillmentMethod === 'DELIVERY' && zoneFee === null) {
      throw new Error(`Delivery to ${locality.name} is not available yet. Choose pickup instead.`);
    }
  }

  const center = await findServingCenter(region);
  if (!center) {
    throw new Error(`No fulfillment center serves region ${region}.`);
  }

  const deliveryCost = area
    ? input.fulfillmentMethod === 'DELIVERY'
      ? (zoneFee as number)
      : 0
    : getDeliveryCost(region, input.fulfillmentMethod);

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
        region,
        localityId: area?.localityId ?? null,
        zoneId: area?.zoneId ?? null,
        status: OrderStatus.PENDING_PAYMENT,
        paymentMethod: input.paymentMethod,
        ...delivery,
      },
    });

    for (const item of input.items) {
      const material = materialById.get(item.materialId);
      if (!material) throw new Error(`Unknown material ${item.materialId}.`);

      const pick = picks.get(material.id);
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          materialId: material.id,
          quantity: item.quantity,
          priceLocked: pick ? pick.price : material.catalogPrice,
          listingId: pick?.id ?? null,
          mode,
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
