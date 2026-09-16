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

// Selects every editable field, not just what the table displays — the
// admin edit/view modals render straight from these rows with no second
// fetch, since the reference library is small (134 rows) and admin-only.
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
      slug: true,
      description: true,
      specification: true,
      standard: true,
      commonBrands: true,
      brand: true,
      unitOfSale: true,
      packSize: true,
      projectScale: true,
      sourcingModel: true,
      priceNote: true,
      imageUrl: true,
      imageSearchTerm: true,
      notes: true,
      categoryId: true,
      category: { select: { name: true, slug: true } },
    },
    orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
  });
  return products;
}

export type ReferenceProduct = Awaited<ReturnType<typeof getReferenceProducts>>[number];
