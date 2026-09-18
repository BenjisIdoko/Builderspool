'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { ProjectScale, SourcingModel } from '@prisma/client';
import { requireAdmin } from '@/lib/admin/session';

function optionalText(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requiredText(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required field: ${key}`);
  }
  return value.trim();
}

// Admin is the source of truth for the catalogue reference library too —
// this is research data (lib/queries/catalogueReference.ts), never buyer-
// facing, so edits here carry no pricing/mechanism-leak risk the live
// Material catalog editor has to worry about.
export async function updateReferenceProductAction(formData: FormData) {
  await requireAdmin();

  const id = requiredText(formData, 'id');

  const projectScaleRaw = formData.get('projectScale');
  const projectScale =
    typeof projectScaleRaw === 'string' && projectScaleRaw in ProjectScale
      ? (projectScaleRaw as ProjectScale)
      : ProjectScale.BOTH;

  const sourcingModelRaw = formData.get('sourcingModel');
  const sourcingModel =
    typeof sourcingModelRaw === 'string' && sourcingModelRaw in SourcingModel
      ? (sourcingModelRaw as SourcingModel)
      : SourcingModel.BOTH;

  await prisma.product.update({
    where: { id },
    data: {
      name: requiredText(formData, 'name'),
      sku: requiredText(formData, 'sku'),
      unitOfSale: requiredText(formData, 'unitOfSale'),
      categoryId: requiredText(formData, 'categoryId'),
      description: optionalText(formData, 'description'),
      specification: optionalText(formData, 'specification'),
      standard: optionalText(formData, 'standard'),
      commonBrands: optionalText(formData, 'commonBrands'),
      brand: optionalText(formData, 'brand'),
      packSize: optionalText(formData, 'packSize'),
      priceNote: optionalText(formData, 'priceNote'),
      imageUrl: optionalText(formData, 'imageUrl'),
      imageSearchTerm: optionalText(formData, 'imageSearchTerm'),
      notes: optionalText(formData, 'notes'),
      projectScale,
      sourcingModel,
    },
  });

  revalidatePath('/admin/catalogue-reference');
}

export async function deleteReferenceProductAction(formData: FormData) {
  await requireAdmin();

  const id = requiredText(formData, 'id');
  await prisma.product.delete({ where: { id } });
  revalidatePath('/admin/catalogue-reference');
}
