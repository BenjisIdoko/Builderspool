import { prisma } from '../prisma';

// Admin-only reads for the catalogue reference library (Category/Product) —
// see the schema comment in prisma/schema.prisma. Entirely separate from
// the live buyer catalog (lib/queries/materials.ts) — this is research
// data for ops to consult, not anything a buyer or seller ever sees.

export async function getReferenceCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { products: true } } },
  });
  return categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, productCount: c._count.products }));
}

export async function getReferenceProducts(categorySlug?: string, query?: string) {
  const products = await prisma.product.findMany({
    where: {
      category: categorySlug ? { slug: categorySlug } : undefined,
      OR: query
        ? [
            { name: { contains: query, mode: 'insensitive' } },
            { sku: { contains: query, mode: 'insensitive' } },
            { commonBrands: { contains: query, mode: 'insensitive' } },
          ]
        : undefined,
    },
    select: {
      id: true,
      sku: true,
      name: true,
      standard: true,
      commonBrands: true,
      unitOfSale: true,
      packSize: true,
      projectScale: true,
      sourcingModel: true,
      priceNote: true,
      category: { select: { name: true, slug: true } },
    },
    orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
  });
  return products;
}

export type ReferenceProduct = Awaited<ReturnType<typeof getReferenceProducts>>[number];
