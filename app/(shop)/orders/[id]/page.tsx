import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircleIcon,
  TruckIcon,
  StorefrontIcon,
  CurrencyNgnIcon,
  UsersThreeIcon,
  HandshakeIcon,
  PackageIcon,
  ClockIcon,
  EnvelopeSimpleIcon,
  PhoneIcon,
} from '@phosphor-icons/react/ssr';
import { getOrderById, getOrderTrackingStages } from '@/lib/queries/orders';
import { requireBuyer } from '@/lib/buyer/auth';
import { formatNaira, formatElapsedSince } from '@/lib/format';
import { orderStatusTone, pillClass } from '@/lib/statusColors';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MaterialImage } from '@/components/material-image';
import { OrderActions } from '@/components/order-actions';

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Awaiting payment',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

const STAGE_ICONS = [CheckCircleIcon, CurrencyNgnIcon, UsersThreeIcon, HandshakeIcon, TruckIcon, PackageIcon];

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, buyer] = await Promise.all([getOrderById(id), requireBuyer()]);
  if (!order || order.buyerId !== buyer.id) notFound();

  const subtotal = order.items.reduce((sum, item) => sum + item.priceLocked * item.quantity, 0);
  const deliveryTotal = order.items.reduce((sum, item) => sum + item.deliveryCost, 0) / (order.items.length || 1);
  const center = order.items[0]?.fulfillmentCenter;
  const isPickup = order.items.every((item) => item.deliveryCost === 0);
  const stages = getOrderTrackingStages(order);
  const grnNumber = order.items.flatMap((i) => i.allocations).find((a) => a.grnNumber)?.grnNumber;
  const elapsed = formatElapsedSince(order.createdAt);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4 rounded-lg border border-border bg-surface p-6">
        <div className="flex items-start gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-success/10 text-success">
            <CheckCircleIcon className="size-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-ink">Order confirmed</h1>
              <Badge variant="outline" className={pillClass(orderStatusTone(order.status))}>
                {STATUS_LABEL[order.status] ?? order.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Order <span className="text-ink">{order.id}</span>
              {order.status === 'PENDING_PAYMENT' && ' — we\'ll confirm your payment shortly.'}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <ClockIcon className="size-3.5" />
              {elapsed} since order placed
            </p>
          </div>
        </div>
        <OrderActions items={order.items} />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {center && (
          <div className="rounded-lg border border-border bg-surface p-5">
            <div className="mb-1.5 text-[11px] font-semibold text-muted-foreground uppercase">From</div>
            <div className="flex items-start gap-2">
              {isPickup ? (
                <StorefrontIcon className="mt-0.5 size-4 shrink-0 text-brand" />
              ) : (
                <TruckIcon className="mt-0.5 size-4 shrink-0 text-brand" />
              )}
              <div>
                <div className="text-sm font-semibold text-ink">{center.name}</div>
                <div className="text-sm text-muted-foreground">{center.address}</div>
              </div>
            </div>
          </div>
        )}
        <div className="rounded-lg border border-border bg-surface p-5">
          <div className="mb-1.5 text-[11px] font-semibold text-muted-foreground uppercase">
            {isPickup ? 'Pickup for' : 'Ship to'}
          </div>
          <div className="text-sm font-semibold text-ink">{buyer.businessName ?? buyer.name}</div>
          <div className="text-sm text-muted-foreground">{order.region}</div>
        </div>
      </div>

      <div className="mb-8 rounded-lg border border-border bg-surface p-5">
        <div className="mb-3 text-[11px] font-semibold text-muted-foreground uppercase">Contact</div>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <span className="flex items-center gap-1.5 text-ink">
            <EnvelopeSimpleIcon className="size-4 text-slate" />
            {buyer.email}
          </span>
          {buyer.phone && (
            <span className="flex items-center gap-1.5 text-ink">
              <PhoneIcon className="size-4 text-slate" />
              {buyer.phone}
            </span>
          )}
        </div>
      </div>

      <div className="mb-8 rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-6 text-sm font-bold text-slate">Order tracking</h2>
        <div className="relative">
          <div className="absolute top-4 bottom-4 left-[13px] w-px bg-border" />
          <div className="flex flex-col gap-6">
            {stages.map((stage, i) => {
              const Icon = STAGE_ICONS[i];
              return (
                <div key={stage.key} className="relative flex items-start gap-4">
                  <div
                    className={`relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 ${
                      stage.achieved && !stage.current
                        ? 'border-ink bg-ink text-canvas'
                        : stage.current
                          ? 'border-brand bg-canvas text-brand'
                          : 'border-border-strong bg-canvas text-muted-foreground'
                    }`}
                  >
                    <Icon className="size-3.5" />
                  </div>
                  <div>
                    <span
                      className={`text-sm font-medium ${
                        stage.current ? 'text-brand' : stage.achieved ? 'text-ink' : 'text-muted-foreground'
                      }`}
                    >
                      {stage.title}
                    </span>
                    {stage.at && (
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {stage.at.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    )}
                    {stage.achieved && stage.key === (isPickup ? 'Ready for pickup' : 'Out for delivery') && grnNumber && (
                      <div className="mt-0.5 text-xs text-muted-foreground">Receipt {grnNumber}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-bold text-slate">
            Items ({order.items.length})
          </h2>
        </div>
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase">
          <div>Item</div>
          <div>Qty × unit price</div>
          <div className="text-right">Total</div>
        </div>
        <div className="divide-y divide-border border-t border-border">
          {order.items.map((item) => (
            <div key={item.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-4">
              <div className="flex items-center gap-3">
                <MaterialImage
                  imageUrl={item.material.imageUrl}
                  category={item.material.category}
                  alt={item.material.name}
                  className="size-12 shrink-0 rounded-md border border-border"
                  sizes="48px"
                />
                <div className="font-medium text-ink">{item.material.name}</div>
              </div>
              <div className="text-sm text-muted-foreground">
                {item.quantity} × {formatNaira(item.priceLocked)}
              </div>
              <div className="text-right font-bold tabular-nums text-ink">
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
