'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireBuyer } from '@/lib/buyer/auth';

// Stores a "notify me at this price" request — see prisma/schema.prisma's
// PriceAlert model comment: there's no email/SMS infrastructure yet, so this
// only saves the row. The buyer can see whether it's already been reached
// (computed against the real catalogPrice) on their account page.
export async function createPriceAlert(materialId: string, targetPrice: number) {
  if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
    throw new Error('Enter a valid target price.');
  }

  const buyer = await requireBuyer();
  await prisma.priceAlert.create({
    data: { materialId, buyerId: buyer.id, targetPrice },
  });

  revalidatePath('/account');
}

export async function cancelPriceAlert(alertId: string) {
  const buyer = await requireBuyer();
  await prisma.priceAlert.updateMany({
    where: { id: alertId, buyerId: buyer.id },
    data: { active: false },
  });

  revalidatePath('/account');
}
