import { NextResponse } from 'next/server';
import { isAdminSignedIn } from '@/lib/admin/session';
import { prisma } from '@/lib/prisma';
import { getOrdersForAdmin } from '@/lib/queries/adminOrders';
import { getSellerDirectory } from '@/lib/queries/adminSellers';
import { formatNaira } from '@/lib/format';

export interface SearchResult {
  type: 'order' | 'seller' | 'material';
  label: string;
  sublabel: string;
  href: string;
}

// Backs the topbar/sidebar search box — real results only, across the three
// entity types an admin actually manages. Reuses each page's own existing
// query/filter logic rather than a separate search index, since real
// platform volume makes an in-request scan fast enough.
export async function GET(request: Request) {
  if (!(await isAdminSignedIn())) return NextResponse.json({ results: [] }, { status: 401 });

  const q = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ results: [] });

  const [{ orders }, sellers, materials] = await Promise.all([
    getOrdersForAdmin({ query: q, page: 1 }),
    getSellerDirectory(),
    prisma.material.findMany({
      where: { name: { contains: q, mode: 'insensitive' } },
      select: { id: true, name: true, category: true },
      take: 5,
    }),
  ]);

  const results: SearchResult[] = [
    ...orders.slice(0, 5).map((o) => ({
      type: 'order' as const,
      label: `#${o.id.slice(-6).toUpperCase()}`,
      sublabel: `${o.buyer.businessName ?? o.buyer.name} · ${formatNaira(o.total)}`,
      href: `/admin/orders/${o.id}`,
    })),
    ...sellers
      .filter((s) => s.name.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 5)
      .map((s) => ({
        type: 'seller' as const,
        label: s.name,
        sublabel: s.category ?? 'Seller',
        href: `/admin/sellers`,
      })),
    ...materials.map((m) => ({
      type: 'material' as const,
      label: m.name,
      sublabel: m.category,
      href: `/admin/materials/${m.id}`,
    })),
  ];

  return NextResponse.json({ results });
}
