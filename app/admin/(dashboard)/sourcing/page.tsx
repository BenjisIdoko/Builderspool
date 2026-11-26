import Link from 'next/link';
import { SourcingStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { formatLagosDateTime, formatQuantity } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { SourcingForm } from '@/components/admin/sourcing-form';

export const metadata = { title: 'Sourcing' };

const INCLUDE = {
  orderItem: {
    select: {
      orderId: true,
      material: { select: { name: true, unit: true, category: true } },
      fulfillmentCenter: { select: { name: true } },
      order: { select: { buyer: { select: { name: true, businessName: true, phone: true } } } },
    },
  },
} as const;

// Lines no supplier or picked seller took. BuildersPool meets every order, so the team sources them here.
export default async function AdminSourcingPage() {
  const [open, closed] = await Promise.all([
    prisma.opsSourcing.findMany({ where: { status: SourcingStatus.OPEN }, include: INCLUDE, orderBy: { createdAt: 'asc' } }),
    prisma.opsSourcing.findMany({ where: { status: { not: SourcingStatus.OPEN } }, include: INCLUDE, orderBy: { resolvedAt: 'desc' }, take: 20 }),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20">
      <h1 className="mb-1 text-heading-lg text-ink">Sourcing</h1>
      <p className="mb-6 max-w-3xl text-sm text-muted-foreground">Lines no supplier took. Source them, or refund as a last resort.</p>

      <section className="mb-8 rounded-card bg-card-alt p-5">
        <h2 className="mb-4 text-heading-md text-ink">To source ({open.length})</h2>
        {open.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing to source.</p>
        ) : (
          <ul className="space-y-4">
            {open.map((row) => {
              const i = row.orderItem;
              const buyer = i.order.buyer.businessName?.trim() || i.order.buyer.name;
              return (
                <li key={row.id} className="space-y-3 rounded-card bg-surface p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-heading-sm text-ink">
                      {i.material.name} · {formatQuantity(row.quantity, i.material.unit)}
                    </h3>
                    <Link href={`/admin/orders/${i.orderId}`} className="text-sm font-medium text-brand hover:underline">
                      Order #{i.orderId.slice(-6).toUpperCase()}
                    </Link>
                  </div>
                  <p className="text-sm text-slate">
                    {buyer}
                    {i.order.buyer.phone ? ` · ${i.order.buyer.phone}` : ''} · {i.fulfillmentCenter?.name ?? 'No centre'} · since{' '}
                    {formatLagosDateTime(row.createdAt)}
                  </p>
                  <p className="text-sm text-muted-foreground">{row.reason}</p>
                  <SourcingForm id={row.id} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-card bg-card-alt p-5">
        <h2 className="mb-4 text-heading-md text-ink">Recently closed</h2>
        {closed.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing closed yet.</p>
        ) : (
          <ul className="divide-y divide-hairline">
            {closed.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span className="text-ink">
                  {row.orderItem.material.name} · {formatQuantity(row.quantity, row.orderItem.material.unit)}
                  {row.note && <span className="text-slate"> · {row.note}</span>}
                </span>
                <Badge variant={row.status === SourcingStatus.SOURCED ? 'success' : 'danger'}>
                  {row.status === SourcingStatus.SOURCED ? 'Sourced' : 'Refunded'}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
