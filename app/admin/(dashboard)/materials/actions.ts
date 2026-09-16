'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { SourcingScope } from '@prisma/client';

function optionalText(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// Admin is the source of truth for the live buyer catalog — this is the
// only place Material rows can be edited outside prisma/seed.ts. A price
// change writes a real PriceSnapshot row too, so the buyer-facing price
// history chart (lib/queries/materials.ts's getPriceHistory) picks it up
// honestly instead of silently drifting out of sync with catalogPrice.
export async function updateMaterialAction(formData: FormData) {
  const id = formData.get('id');
  if (typeof id !== 'string') throw new Error('Missing material id.');

  const priceRaw = formData.get('catalogPrice');
  const price = typeof priceRaw === 'string' ? Number(priceRaw) : NaN;
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error('Catalog price must be a positive number.');
  }

  const scopeRaw = formData.get('sourcingScope');
  const sourcingScope =
    typeof scopeRaw === 'string' && scopeRaw in SourcingScope ? (scopeRaw as SourcingScope) : SourcingScope.NATIONAL;

  const existing = await prisma.material.findUniqueOrThrow({ where: { id } });
  const priceChanged = Number(existing.catalogPrice) !== price;

  await prisma.material.update({
    where: { id },
    data: {
      catalogPrice: price,
      sourcingScope,
      spec: optionalText(formData, 'spec'),
      grade: optionalText(formData, 'grade'),
      standard: optionalText(formData, 'standard'),
      dimensions: optionalText(formData, 'dimensions'),
      weight: optionalText(formData, 'weight'),
      imageUrl: optionalText(formData, 'imageUrl'),
    },
  });

  if (priceChanged) {
    await prisma.priceSnapshot.create({ data: { materialId: id, price } });
  }

  revalidatePath('/admin/materials');
  revalidatePath(`/admin/materials/${id}`);
  revalidatePath('/catalog');
  revalidatePath(`/catalog/${id}`);
}
