import { NextResponse } from 'next/server';
import { getSellerIdFromSession } from '@/lib/seller/session';
import { getSellerAllocations } from '@/lib/queries/sellerPortal';
import { prisma } from '@/lib/prisma';
import { formatNaira } from '@/lib/format';
import type { SearchResult } from '../../admin/search/route';

// Scoped strictly to the signed-in seller's own real allocations and the
// public material catalog — never another seller's orders/identity, same
// blind-bidding boundary lib/queries/sellerPortal.ts already enforces.
export async function GET(request: Request) {
  const sellerId = await getSellerIdFromSession();
  if (!sellerId) return NextResponse.json({ results: [] }, { status: 401 });

  const q = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ results: [] });

  const [allocations, materials] = await Promise.all([
    getSellerAllocations(sellerId),
    prisma.material.findMany({
      where: { name: { contains: q, mode: 'insensitive' } },
      select: { id: true, name: true, category: true },
      take: 5,
    }),
  ]);

  const qLower = q.toLowerCase();
  const matchingOrders = allocations
    .filter(
      (a) =>
        a.bid.material.name.toLowerCase().includes(qLower) ||
        a.orderItem.order.buyer.businessName?.toLowerCase().includes(qLower) ||
        a.orderItem.order.buyer.name.toLowerCase().includes(qLower) ||
        a.id.toLowerCase().includes(qLower)
    )
    .slice(0, 5);

  const results: SearchResult[] = [
    ...matchingOrders.map((a) => ({
      type: 'order' as const,
      label: `#${a.id.slice(-6).toUpperCase()}`,
      sublabel: `${a.orderItem.order.buyer.businessName ?? a.orderItem.order.buyer.name} · ${formatNaira(Number(a.bid.unitPrice) * a.quantityFilled)}`,
      href: `/seller/orders`,
    })),
    ...materials.map((m) => ({
      type: 'material' as const,
      label: m.name,
      sublabel: m.category,
      href: `/seller`,
    })),
  ];

  return NextResponse.json({ results });
}
