import { prisma } from '../prisma';

// Buyer-facing catalog reads. These intentionally select only fields the
// buyer is allowed to see — never sourcingScope, bid cycles, or anything
// that would leak the pooling/bidding mechanism into the shopfront.
const BUYER_SAFE_SELECT = {
  id: true,
  name: true,
  category: true,
  unit: true,
  spec: true,
  imageUrl: true,
  catalogPrice: true,
} as const;

export async function getMaterials(category?: string, query?: string) {
  const materials = await prisma.material.findMany({
    where: {
      category: category || undefined,
      name: query ? { contains: query, mode: 'insensitive' } : undefined,
    },
    select: BUYER_SAFE_SELECT,
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });
  return materials.map(toPlainMaterial);
}

export async function getMaterialById(id: string) {
  const material = await prisma.material.findUnique({
    where: { id },
    select: BUYER_SAFE_SELECT,
  });
  return material ? toPlainMaterial(material) : null;
}

export async function getCategories() {
  const rows = await prisma.material.findMany({
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });
  return rows.map((r) => r.category);
}

function toPlainMaterial<T extends { catalogPrice: unknown }>(material: T) {
  return { ...material, catalogPrice: Number(material.catalogPrice) };
}

export type BuyerMaterial = Awaited<ReturnType<typeof getMaterials>>[number];
