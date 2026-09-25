import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';
import { cache } from 'react';

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
  grade: true,
  standard: true,
  dimensions: true,
  weight: true,
  imageUrl: true,
  images: true,
  catalogPrice: true,
  sourcingScope: true,
} as const;

export type MaterialSort = 'relevance' | 'price_asc' | 'price_desc' | 'name';
export const MATERIAL_SORT_VALUES: MaterialSort[] = ['relevance', 'price_asc', 'price_desc', 'name'];

function sortToOrderBy(sort: MaterialSort): Prisma.MaterialOrderByWithRelationInput[] {
  switch (sort) {
    case 'price_asc':
      return [{ catalogPrice: 'asc' }];
    case 'price_desc':
      return [{ catalogPrice: 'desc' }];
    case 'name':
      return [{ name: 'asc' }];
    case 'relevance':
    default:
      return [{ category: 'asc' }, { name: 'asc' }];
  }
}

// Materials still awaiting a verified price (needsPriceReview) are never
// shown to buyers — a placeholder or unverified price must not be browsable,
// searchable, linkable or purchasable. Admin queries are unaffected; clearing
// the flag (saving a price in /admin/materials) publishes the item.
const BUYER_VISIBLE = { needsPriceReview: false } as const;

export async function getMaterials({
  category,
  query,
  sourcingScope,
  sort = 'relevance',
  page = 1,
  pageSize,
}: {
  category?: string;
  query?: string;
  sourcingScope?: 'NATIONAL' | 'REGIONAL';
  sort?: MaterialSort;
  page?: number;
  pageSize?: number;
} = {}) {
  const where: Prisma.MaterialWhereInput = {
    ...BUYER_VISIBLE,
    category: category || undefined,
    sourcingScope: sourcingScope || undefined,
    name: query ? { contains: query, mode: 'insensitive' } : undefined,
  };
  const orderBy = sortToOrderBy(sort);

  if (!pageSize) {
    const rows = await prisma.material.findMany({ where, select: BUYER_SAFE_SELECT, orderBy });
    return { materials: rows.map(toPlainMaterial), total: rows.length, page: 1, pageCount: 1 };
  }

  const [rows, total] = await Promise.all([
    prisma.material.findMany({ where, select: BUYER_SAFE_SELECT, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.material.count({ where }),
  ]);
  return { materials: rows.map(toPlainMaterial), total, page, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

// Powers the navbar's live search dropdown — a small, fast lookup, not the
// full catalog page's paginated getMaterials(). Same buyer-safe fields,
// capped to `limit` so the dropdown never grows past a scrollable handful.
export async function searchMaterialsLive(query: string, limit = 6) {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const materials = await prisma.material.findMany({
    where: { ...BUYER_VISIBLE, name: { contains: trimmed, mode: 'insensitive' } },
    select: BUYER_SAFE_SELECT,
    orderBy: [{ name: 'asc' }],
    take: limit,
  });
  return materials.map(toPlainMaterial);
}

// cache() so the product page and its generateMetadata share one query per request.
export const getMaterialById = cache(async (id: string) => {
  const material = await prisma.material.findFirst({
    where: { id, ...BUYER_VISIBLE },
    select: BUYER_SAFE_SELECT,
  });
  return material ? toPlainMaterial(material) : null;
});

// Real cross-sell, not a recommendation engine — same category, excluding
// the material being viewed, newest first.
export async function getRelatedMaterials(materialId: string, category: string, limit = 4) {
  const materials = await prisma.material.findMany({
    where: { ...BUYER_VISIBLE, category, id: { not: materialId } },
    select: BUYER_SAFE_SELECT,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return materials.map(toPlainMaterial);
}

// Real "frequently procured together" — materials that actually shared a
// real order with this one, ranked by how often that happened. Returns an
// empty array (not a fallback to same-category browsing) when no order has
// ever paired this material with another; the caller decides what to show
// in that case, since "co-purchased" and "same category" are different
// claims and shouldn't be silently conflated.
export async function getFrequentlyBoughtTogether(materialId: string, limit = 4) {
  const orderItems = await prisma.orderItem.findMany({
    where: { materialId },
    select: { orderId: true },
  });
  const orderIds = [...new Set(orderItems.map((i) => i.orderId))];
  if (orderIds.length === 0) return [];

  const coItems = await prisma.orderItem.findMany({
    where: { orderId: { in: orderIds }, materialId: { not: materialId } },
    select: { materialId: true },
  });
  if (coItems.length === 0) return [];

  const counts = new Map<string, number>();
  for (const item of coItems) counts.set(item.materialId, (counts.get(item.materialId) ?? 0) + 1);
  const rankedIds = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);

  const materials = await prisma.material.findMany({ where: { ...BUYER_VISIBLE, id: { in: rankedIds } }, select: BUYER_SAFE_SELECT });
  const byId = new Map(materials.map((m) => [m.id, m]));
  return rankedIds.map((id) => byId.get(id)).filter((m): m is NonNullable<typeof m> => !!m).map(toPlainMaterial);
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

// Real fulfillment centers, for the PDP's "Serving hubs" block. There's no
// per-material hub assignment in the schema (fulfilmentCenterId is set per
// OrderItem, after checkout, based on the buyer's chosen region) — so rather
// than invent a fake material->hub mapping, this lists the real centers that
// could end up serving this material once a buyer picks a region.
export async function getFulfillmentCenters() {
  return prisma.fulfillmentCenter.findMany({
    select: { name: true, region: true },
    orderBy: { region: 'asc' },
  });
}

export async function getCategories() {
  const rows = await prisma.material.groupBy({
    by: ['category'],
    where: BUYER_VISIBLE,
    _count: { _all: true },
    orderBy: { category: 'asc' },
  });
  return rows.map((r) => ({ name: r.category, count: r._count._all }));
}

function toPlainMaterial<T extends { catalogPrice: unknown }>(material: T) {
  return { ...material, catalogPrice: Number(material.catalogPrice) };
}

export type BuyerMaterial = Awaited<ReturnType<typeof getMaterials>>['materials'][number];
