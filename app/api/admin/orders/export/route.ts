import { NextRequest, NextResponse } from 'next/server';
import { OrderStatus } from '@prisma/client';
import { isAdminSignedIn } from '@/lib/admin/session';
import { getOrdersForAdmin } from '@/lib/queries/adminOrders';

// Real export of real order data — no external system, just a formatted
// download of what's already in the database, respecting whatever
// status/search filter the admin currently has applied. Route handlers
// aren't covered by the (dashboard) layout's redirect, so the session is
// checked explicitly here.
export async function GET(request: NextRequest) {
  if (!(await isAdminSignedIn())) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') === 'json' ? 'json' : 'csv';
  const statusParam = searchParams.get('status');
  const status = statusParam && statusParam in OrderStatus ? (statusParam as OrderStatus) : undefined;
  const query = searchParams.get('q') ?? undefined;

  // pageSize in getOrdersForAdmin is fixed at 10 — export needs every
  // matching row, so page through it rather than changing that query's
  // shape for the admin list view.
  const allOrders = [];
  let page = 1;
  while (true) {
    const { orders, pageCount } = await getOrdersForAdmin({ status, query, page });
    allOrders.push(...orders);
    if (page >= pageCount) break;
    page++;
  }

  const rows = allOrders.map((o) => ({
    orderId: o.id,
    buyer: o.buyer.businessName ?? o.buyer.name,
    email: o.buyer.email,
    status: o.status,
    region: o.region,
    itemCount: o.items.length,
    total: o.total,
    fulfillmentStage: o.fulfillmentStage,
    createdAt: o.createdAt.toISOString(),
  }));

  const filename = `orders-export-${new Date().toISOString().slice(0, 10)}.${format}`;

  if (format === 'json') {
    return new NextResponse(JSON.stringify(rows, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }

  const headers = ['orderId', 'buyer', 'email', 'status', 'region', 'itemCount', 'total', 'fulfillmentStage', 'createdAt'];
  const csvEscape = (value: string | number) => {
    const s = String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => csvEscape(r[h as keyof typeof r])).join(',')),
  ].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
