import { prisma } from '../prisma';

// Buyer-facing catalog reads. These intentionally select only fields the
// buyer is allowed to see — never bid cycles, scores, or anything else that
// would leak the pooling/bidding mechanism into the shopfront.
//
// sourcingScope is the one deliberate exception (added 2026-09-13, per the
// Fable/Design handoff's region-eligibility badge): it's shipping/
// availability information a buyer reasonably needs before ordering
// ("does this ship to me"), not a hint about how procurement is priced or
// scored — unlike everything else this comment warns against.
const BUYER_SAFE_SELECT = {
  id: true,
  name: true,
  category: true,
  unit: true,
  spec: true,
  imageUrl: true,
  catalogPrice: true,
  sourcingScope: true,
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

// Buyer-safe by construction — PriceSnapshot only ever records catalogPrice
// over time, nothing bidding-related. Carries the last known price forward
// to "today" so the chart reads as "held steady since," not just a dangling
// last point — a display convenience, not a fabricated data row.
export async function getPriceHistory(materialId: string) {
  const snapshots = await prisma.priceSnapshot.findMany({
    where: { materialId },
    orderBy: { recordedAt: 'asc' },
    select: { price: true, recordedAt: true },
  });
  if (snapshots.length === 0) return [];

  const points = snapshots.map((s) => ({ date: s.recordedAt, price: Number(s.price) }));
  const last = points[points.length - 1];
  const now = new Date();
  if (now.getTime() > last.date.getTime()) {
    points.push({ date: now, price: last.price });
  }
  return points;
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
