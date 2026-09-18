'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentBuyer } from '@/lib/buyer/auth';
import { getCartLinesForBuyer } from '@/lib/cart/store';

// All of these are fire-and-forget from the client (lib/cart/CartContext.tsx
// updates local state optimistically) — a signed-out caller or an invalid
// materialId (e.g. a stale id from a localStorage cart surviving a reseed)
// just no-ops rather than surfacing an error the UI has no way to show.

export async function addCartItemAction(materialId: string, quantity: number) {
  const buyer = await getCurrentBuyer();
  if (!buyer || quantity <= 0) return;

  try {
    await prisma.cartItem.upsert({
      where: { buyerId_materialId: { buyerId: buyer.id, materialId } },
      create: { buyerId: buyer.id, materialId, quantity },
      update: { quantity: { increment: quantity } },
    });
  } catch {
    // Unknown material — nothing to add.
  }
}

export async function setCartItemQuantityAction(materialId: string, quantity: number) {
  const buyer = await getCurrentBuyer();
  if (!buyer) return;

  if (quantity <= 0) {
    await prisma.cartItem.deleteMany({ where: { buyerId: buyer.id, materialId } });
    return;
  }

  try {
    await prisma.cartItem.upsert({
      where: { buyerId_materialId: { buyerId: buyer.id, materialId } },
      create: { buyerId: buyer.id, materialId, quantity },
      update: { quantity },
    });
  } catch {
    // Unknown material — nothing to set.
  }
}

export async function removeCartItemAction(materialId: string) {
  const buyer = await getCurrentBuyer();
  if (!buyer) return;
  await prisma.cartItem.deleteMany({ where: { buyerId: buyer.id, materialId } });
}

export async function clearCartAction() {
  const buyer = await getCurrentBuyer();
  if (!buyer) return;
  await prisma.cartItem.deleteMany({ where: { buyerId: buyer.id } });
}

// Called once, right after a buyer with items already in a localStorage
// guest cart logs in — folds those lines into their real account cart
// (adding to any quantity already there) rather than silently dropping
// what they'd already picked out.
export async function mergeGuestCartAction(guestLines: { materialId: string; quantity: number }[]) {
  const buyer = await getCurrentBuyer();
  if (!buyer || guestLines.length === 0) return null;

  for (const line of guestLines) {
    if (line.quantity <= 0) continue;
    try {
      await prisma.cartItem.upsert({
        where: { buyerId_materialId: { buyerId: buyer.id, materialId: line.materialId } },
        create: { buyerId: buyer.id, materialId: line.materialId, quantity: line.quantity },
        update: { quantity: { increment: line.quantity } },
      });
    } catch {
      // Unknown material (e.g. stale id) — skip it.
    }
  }

  return getCartLinesForBuyer(buyer.id);
}
