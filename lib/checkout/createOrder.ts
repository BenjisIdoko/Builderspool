import { prisma } from '../prisma';
import { OrderStatus, PaymentProvider, PurchaseMode, WalletEntryState, type PaymentMethod, type Prisma } from '@prisma/client';
import { getDeliveryCost, type FulfillmentMethod } from './deliveryCost';
import { getSetting } from '../settings';
import { regionForState } from '../areas/region';
import { findServingCenter } from './findServingCenter';
import { getPickableListing } from '../queries/offers';
import { koboToNaira, nairaToKobo } from '../money';
import { postLedgerEntry } from '../ledger';
import { notifyBuyerOrderPlaced } from '../notifications';
import { isInNigeria } from '../delivery/distance';
import { quoteDelivery, type DeliveryQuote } from '../delivery/quote';
import { formatNaira } from '../format';

export interface CheckoutInput {
  buyerId: string;
  region: string;
  // Where the buyer is. Required when the locality picker is switched on, in
  // which case it decides the region, the zone and the delivery fee.
  localityId?: string | null;
  fulfillmentMethod: FulfillmentMethod;
  // The pickup station the buyer chose, for PICKUP orders. It must serve the
  // order's region; without one, the region's default station is used.
  pickupCenterId?: string | null;
  paymentMethod: PaymentMethod;
  paymentProvider?: PaymentProvider;
  // How the whole cart is bought by default (each item can also override its mode).
  mode?: 'POOL' | 'DIRECT';
  // Whether to apply the buyer's available Savings Wallet balance toward this order.
  applySavingsCredit?: boolean;
  // listingId is the seller offer the buyer picked; the price is always read
  // from that listing here, never from the client.
  items: { materialId: string; quantity: number; listingId?: string | null; mode?: 'POOL' | 'DIRECT' }[];
  // Required by validation below when fulfillmentMethod is DELIVERY; ignored
  // (and never persisted) for PICKUP, so a pickup order never carries stray
  // delivery-looking data.
  deliveryAddress?: string;
  deliveryContactName?: string;
  deliveryContactPhone?: string;
  deliveryWindow?: string;
  deliveryNotes?: string;
  // Where the site is on the map, from the checkout's address search. When distance pricing is on, the delivery
  // fee is worked out from this; without it (or if it cannot be priced) the zone or region fee applies.
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
  // The fee the buyer was shown. If the price has moved since, the order is refused rather than charged differently.
  expectedDeliveryFee?: number | null;
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
      throw new Error("One of the items in your cart isn't valid any more. Remove it and try again.");
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_LINE_QUANTITY) {
      throw new Error(`Quantity must be a whole number between 1 and ${MAX_LINE_QUANTITY.toLocaleString('en-NG')}.`);
    }
    if (seen.has(item.materialId)) throw new Error('An item is in your cart twice. Combine the quantities.');
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
    throw new Error('Your cart is empty. Add something to check out.');
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

  const defaultMode = input.mode === 'DIRECT' ? PurchaseMode.DIRECT : PurchaseMode.POOL;
  const itemModes = new Map<string, PurchaseMode>();
  for (const item of input.items) {
    const requestedMode = item.mode
      ? item.mode === 'DIRECT'
        ? PurchaseMode.DIRECT
        : PurchaseMode.POOL
      : defaultMode;
    // If an item requests DIRECT, it must have a picked seller offer; if cart-level
    // mode was DIRECT and only a subset has a seller, require every DIRECT line to have a seller.
    if (requestedMode === PurchaseMode.DIRECT && !picks.has(item.materialId)) {
      const name = materialById.get(item.materialId)?.name ?? 'an item';
      throw new Error(`Buy Direct needs a seller picked for ${name}. Pick a seller or switch that item to Pool & Save.`);
    }
    itemModes.set(item.materialId, requestedMode);
  }

  // Every order routes through a fulfillment center regardless of method —
  // delivery just adds a final hop from center to site (pickup ends there).
  // With the locality picker on, the buyer's locality decides the region, the
  // zone (the pool key) and the delivery fee. Off, it is the old region flow.
  let region = input.region;
  let area: { localityId: string; zoneId: string } | null = null;
  let zoneFee: number | null = null;
  let areaName = '';
  if (await getSetting<boolean>('areas.checkoutPickerEnabled')) {
    if (!input.localityId) throw new Error('Choose where you are so we can check delivery.');
    const locality = await prisma.locality.findUnique({
      where: { id: input.localityId },
      include: { zone: true, lga: { include: { state: true } } },
    });
    if (!locality || !locality.active) throw new Error("That area isn't available. Choose another.");
    if (!locality.zone || !locality.zone.active) throw new Error(`We don't deliver to ${locality.name} yet. Choose pickup, or leave your number and we'll tell you when we do.`);
    const zoneRegion = regionForState(locality.lga.state.name);
    if (!zoneRegion) throw new Error(`We don't serve ${locality.lga.state.name} yet. Choose another area.`);
    region = zoneRegion;
    area = { localityId: locality.id, zoneId: locality.zone.id };
    zoneFee = locality.zone.deliveryFee === null ? null : Number(locality.zone.deliveryFee);
    areaName = locality.name;
  }

  // Distance pricing: when the buyer pinned their site and the feature is on, the fee comes from the load, the
  // vehicles and the road distance, worked out here from the cart (never from a figure the client sent). If it
  // cannot be priced, the zone or region fee is used, as before.
  let quote: DeliveryQuote | null = null;
  const site =
    input.fulfillmentMethod === 'DELIVERY' && isInNigeria({ lat: Number(input.deliveryLatitude), lng: Number(input.deliveryLongitude) })
      ? { lat: Number(input.deliveryLatitude), lng: Number(input.deliveryLongitude) }
      : null;
  if (site) {
    const result = await quoteDelivery(input.items.map((i) => ({ materialId: i.materialId, quantity: i.quantity })), site);
    if (result.ok) quote = result.quote;
  }
  if (area && input.fulfillmentMethod === 'DELIVERY' && !quote && zoneFee === null) {
    throw new Error(`Delivery to ${areaName} isn't available yet. Choose pickup instead.`);
  }

  let center = null;
  if (input.fulfillmentMethod === 'PICKUP' && input.pickupCenterId) {
    center = await prisma.fulfillmentCenter.findFirst({ where: { id: input.pickupCenterId, region } });
    if (!center) throw new Error('That pickup station is not available for your area. Choose another.');
  }
  center ??= await findServingCenter(region);
  if (!center) {
    throw new Error(`We can't serve ${region.charAt(0)}${region.slice(1).toLowerCase()} yet. Choose another area.`);
  }

  const deliveryCost = quote
    ? quote.fee
    : area
      ? input.fulfillmentMethod === 'DELIVERY'
        ? (zoneFee as number)
        : 0
      : getDeliveryCost(region, input.fulfillmentMethod);

  if (
    input.fulfillmentMethod === 'DELIVERY' &&
    typeof input.expectedDeliveryFee === 'number' &&
    Math.round(input.expectedDeliveryFee) !== Math.round(deliveryCost)
  ) {
    throw new Error(`The delivery price is now ${formatNaira(deliveryCost)}. Check your order total and place it again.`);
  }

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

  // Compute gross order total in kobo so we can safely apply available savings credit.
  let grossSubtotalKobo = 0;
  for (const item of input.items) {
    const material = materialById.get(item.materialId);
    if (!material) throw new Error('An item in your cart is no longer in the catalogue. Remove it and try again.');
    const pick = picks.get(material.id);
    const unitKobo = nairaToKobo(pick ? pick.price : material.catalogPrice);
    grossSubtotalKobo += unitKobo * item.quantity;
  }
  const grossTotalKobo = grossSubtotalKobo + nairaToKobo(deliveryCost);

  const createdOrder = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        buyerId: input.buyerId,
        region,
        localityId: area?.localityId ?? null,
        zoneId: area?.zoneId ?? null,
        status: OrderStatus.PENDING_PAYMENT,
        paymentMethod: input.paymentMethod,
        paymentProvider: input.paymentProvider === PaymentProvider.CREDO ? PaymentProvider.CREDO : PaymentProvider.PAYSTACK,
        savingsApplied: 0,
        deliveryLatitude: site?.lat ?? null,
        deliveryLongitude: site?.lng ?? null,
        ...(quote ? { deliveryQuote: quote as unknown as Prisma.InputJsonValue } : {}),
        ...delivery,
      },
    });

    for (const item of input.items) {
      const material = materialById.get(item.materialId);
      if (!material) throw new Error('An item in your cart is no longer in the catalogue. Remove it and try again.');

      const pick = picks.get(material.id);
      const lineMode = itemModes.get(material.id) ?? defaultMode;
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          materialId: material.id,
          quantity: item.quantity,
          priceLocked: pick ? pick.price : material.catalogPrice,
          listingId: pick?.id ?? null,
          mode: lineMode,
          deliveryCost,
          fulfilmentCenterId: center.id,
        },
      });
    }

    // Apply available Savings Wallet entries (oldest first) when requested by the buyer.
    let appliedKobo = 0;
    if (input.applySavingsCredit && grossTotalKobo > 0) {
      const availableEntries = await tx.savingsWalletEntry.findMany({
        where: { buyerId: input.buyerId, state: WalletEntryState.AVAILABLE },
        orderBy: { createdAt: 'asc' },
      });

      const now = new Date();
      for (const entry of availableEntries) {
        if (appliedKobo >= grossTotalKobo) break;
        const entryKobo = nairaToKobo(entry.buyerShare);
        if (entryKobo <= 0) continue;

        const remainingKobo = grossTotalKobo - appliedKobo;
        if (entryKobo <= remainingKobo) {
          const { count } = await tx.savingsWalletEntry.updateMany({
            where: { id: entry.id, state: WalletEntryState.AVAILABLE },
            data: { state: WalletEntryState.APPLIED_TO_ORDER, appliedOrderId: order.id, appliedAt: now },
          });
          if (count > 0) {
            appliedKobo += entryKobo;
          }
        } else {
          // Entry exceeds the remaining order balance: split the entry so the
          // unused remainder stays AVAILABLE in the buyer's wallet.
          const usedKobo = remainingKobo;
          const leftoverKobo = entryKobo - usedKobo;
          const { count } = await tx.savingsWalletEntry.updateMany({
            where: { id: entry.id, state: WalletEntryState.AVAILABLE },
            data: {
              buyerShare: koboToNaira(usedKobo),
              state: WalletEntryState.APPLIED_TO_ORDER,
              appliedOrderId: order.id,
              appliedAt: now,
            },
          });
          if (count > 0) {
            await tx.savingsWalletEntry.create({
              data: {
                buyerId: input.buyerId,
                referenceValue: entry.referenceValue,
                actualValue: entry.actualValue,
                grossSaving: entry.grossSaving,
                buyerShare: koboToNaira(leftoverKobo),
                state: WalletEntryState.AVAILABLE,
              },
            });
            appliedKobo += usedKobo;
          }
        }
      }

      if (appliedKobo > 0) {
        await tx.order.update({
          where: { id: order.id },
          data: { savingsApplied: koboToNaira(appliedKobo) },
        });
        await postLedgerEntry(
          {
            account: 'BUYER_SAVINGS_CREDIT',
            amountKobo: -appliedKobo,
            entryKey: `savings-applied:${order.id}`,
            memo: 'Savings credit applied toward order at checkout',
            orderId: order.id,
            userId: input.buyerId,
          },
          tx,
        );
      }
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

  const netPayableNaira = Math.max(0, koboToNaira(grossTotalKobo) - Number(createdOrder.savingsApplied));
  await notifyBuyerOrderPlaced(input.buyerId, createdOrder.id, createdOrder.items.length, netPayableNaira);

  return createdOrder;
}
