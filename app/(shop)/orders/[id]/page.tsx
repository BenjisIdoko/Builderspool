import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CheckCircleIcon, TruckIcon, StorefrontIcon } from '@phosphor-icons/react/ssr';
import { getOrderById } from '@/lib/queries/orders';
import { formatNaira } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MaterialImage } from '@/components/material-image';

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Awaiting payment',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const subtotal = order.items.reduce((sum, item) => sum + item.priceLocked * item.quantity, 0);
  const deliveryTotal = order.items.reduce((sum, item) => sum + item.deliveryCost, 0) / (order.items.length || 1);
  const center = order.items[0]?.fulfillmentCenter;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-start gap-4 rounded-lg border border-border bg-surface p-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-success/10 text-success">
          <CheckCircleIcon className="size-5" />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-ink">Order confirmed</h1>
            <Badge variant="outline" className="bg-well text-muted-foreground">
              {STATUS_LABEL[order.status] ?? order.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Order <span className="font-mono text-ink">{order.id}</span>
            {order.status === 'PENDING_PAYMENT' &&
              ' — payment isn\'t wired up yet, so it\'s sitting here until a gateway is connected.'}
          </p>
        </div>
      </div>

      {center && (
        <div className="mb-8 flex items-start gap-3 rounded-lg border border-border bg-surface p-5">
          {order.items[0]?.fulfilmentCenterId ? (
            <TruckIcon className="mt-0.5 size-4 shrink-0 text-brand" />
          ) : (
            <StorefrontIcon className="mt-0.5 size-4 shrink-0 text-brand" />
          )}
          <div>
            <div className="text-sm font-semibold text-ink">Routed through {center.name}</div>
            <div className="text-sm text-muted-foreground">{center.address}</div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-bold text-slate">
            Items ({order.items.length})
          </h2>
        </div>
        <div className="divide-y divide-border">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-5 py-4">
              <MaterialImage
                imageUrl={item.material.imageUrl}
                category={item.material.category}
                alt={item.material.name}
                className="size-12 shrink-0 rounded-md border border-border"
                sizes="48px"
              />
              <div className="flex-1">
                <div className="font-medium text-ink">{item.material.name}</div>
                <div className="text-sm text-muted-foreground">
                  {item.quantity} {item.material.unit} × {formatNaira(item.priceLocked)}
                </div>
              </div>
              <div className="font-bold tabular-nums text-ink">
                {formatNaira(item.priceLocked * item.quantity)}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1.5 border-t border-border px-5 py-4 text-sm">
          <div className="flex justify-between text-slate">
            <span>Subtotal</span>
            <span className="font-bold tabular-nums">{formatNaira(subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate">
            <span>Delivery</span>
            <span className="font-bold tabular-nums">{deliveryTotal === 0 ? 'Free' : formatNaira(deliveryTotal)}</span>
          </div>
          <div className="flex justify-between pt-1 text-base font-bold text-ink">
            <span>Total</span>
            <span className="tabular-nums">{formatNaira(subtotal + deliveryTotal)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Button asChild size="lg">
          <Link href="/catalog">Continue browsing</Link>
        </Button>
      </div>
    </div>
  );
}
