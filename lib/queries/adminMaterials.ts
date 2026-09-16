import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';

const PAGE_SIZE = 12;

// Admin-only material reads — every real field, including catalogPrice as a
// live-editable value. Unlike lib/queries/materials.ts's BUYER_SAFE_SELECT
// this is not scoped down; admin is the source of truth for the catalog.
export async function getMaterialsForAdmin({
  category,
  query,
  page = 1,
  needsReview,
}: {
  category?: string;
  query?: string;
  page?: number;
  needsReview?: boolean;
}) {
  const where: Prisma.MaterialWhereInput = {
    category: category || undefined,
    name: query ? { contains: query, mode: 'insensitive' } : undefined,
    needsPriceReview: needsReview ? true : undefined,
  };

  const [rows, total] = await Promise.all([
    prisma.material.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.material.count({ where }),
  ]);

  return {
    materials: rows.map(toPlainMaterial),
    total,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getMaterialForAdmin(id: string) {
  const material = await prisma.material.findUnique({ where: { id } });
  return material ? toPlainMaterial(material) : null;
}

export async function getAdminMaterialCategories() {
  const rows = await prisma.material.findMany({
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });
  return rows.map((r) => r.category);
}

// Powers the "Needs price review" quick filter — rows created with a
// placeholder price by the catalogue-reference bulk import (see
// prisma/seed.ts's seedMaterialsFromReference), not yet given a real price.
export async function getMaterialsNeedingPriceReviewCount() {
  return prisma.material.count({ where: { needsPriceReview: true } });
}

function toPlainMaterial<T extends { catalogPrice: unknown }>(material: T) {
  return { ...material, catalogPrice: Number(material.catalogPrice) };
}

export type AdminMaterial = Awaited<ReturnType<typeof getMaterialsForAdmin>>['materials'][number];
