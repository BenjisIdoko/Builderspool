import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  CaretLeftIcon,
  CheckCircleIcon,
  TruckIcon,
  StorefrontIcon,
  CurrencyNgnIcon,
  UsersThreeIcon,
  HandshakeIcon,
  PackageIcon,
  EnvelopeSimpleIcon,
  PhoneIcon,
  WhatsappLogoIcon,
} from '@phosphor-icons/react/ssr';
import { getOrderById, getOrderTrackingStages } from '@/lib/queries/orders';
import { formatNaira } from '@/lib/format';
import { orderStatusTone, pillClass } from '@/lib/statusColors';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/avatar';
import { MaterialImage } from '@/components/material-image';

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Awaiting payment',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

const STAGE_ICONS = [CheckCircleIcon, CurrencyNgnIcon, UsersThreeIcon, HandshakeIcon, TruckIcon, PackageIcon];

// Real, zero-backend contact links — no messaging/calling infrastructure
// needed, these just open the buyer's own device apps with the real stored
// phone/email pre-filled.
function digitsOnly(phone: string) {
  return phone.replace(/[^\d]/g, '');
}

// wa.me needs full international format (country code, no leading 0) —
// phone numbers here are stored in local Nigerian format (0801...), so a
// raw digitsOnly() result resolves to the wrong contact. Every seeded
// region/address in this app is Nigeria, so +234 is a safe, real
// assumption, not a guess.
function whatsAppNumber(phone: string) {
  const digits = digitsOnly(phone);
  return digits.startsWith('0') ? `234${digits.slice(1)}` : digits;
}

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const subtotal = order.items.reduce((sum, item) => sum + item.priceLocked * item.quantity, 0);
  const deliveryTotal = order.items.reduce((sum, item) => sum + item.deliveryCost, 0) / (order.items.length || 1);
  const stages = getOrderTrackingStages(order);
  const buyerName = order.buyer.businessName ?? order.buyer.name;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <Link
        href="/admin/orders"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-ink"
      >
        <CaretLeftIcon className="size-3.5" />
        Back to orders
      </Link>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-ink">{order.id}</h1>
            <Badge variant="outline" className={pillClass(orderStatusTone(order.status))}>
              {STATUS_LABEL[order.status] ?? order.status}
            </Badge>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            Placed {order.createdAt.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })} ·{' '}
            {order.region}
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-lg border border-border bg-surface p-5">
        <div className="mb-1 text-[11px] font-semibold text-muted-foreground uppercase">Buyer</div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar name={order.buyer.name} className="size-10 text-sm" />
            <div>
              <div className="text-sm font-semibold text-ink">{buyerName}</div>
              <div className="text-xs text-muted-foreground">{order.buyer.email}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href={`mailto:${order.buyer.email}`}
              aria-label={`Email ${buyerName}`}
              className="flex size-9 items-center justify-center rounded-full border border-border text-slate transition-colors hover:text-ink"
            >
              <EnvelopeSimpleIcon className="size-4" />
            </a>
            {order.buyer.phone && (
              <>
                <a
                  href={`tel:${order.buyer.phone}`}
                  aria-label={`Call ${buyerName}`}
                  className="flex size-9 items-center justify-center rounded-full border border-border text-slate transition-colors hover:text-ink"
                >
                  <PhoneIcon className="size-4" />
                </a>
                <a
                  href={`https://wa.me/${whatsAppNumber(order.buyer.phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`WhatsApp ${buyerName}`}
                  className="flex size-9 items-center justify-center rounded-full border border-border text-slate transition-colors hover:text-ink"
                >
                  <WhatsappLogoIcon className="size-4" />
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-6 text-sm font-bold text-slate">Fulfillment tracking</h2>
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
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {order.items[0]?.fulfillmentCenter && (
        <div className="mb-8 flex items-start gap-3 rounded-lg border border-border bg-surface p-5">
          {order.items[0].deliveryCost > 0 ? (
            <TruckIcon className="mt-0.5 size-4 shrink-0 text-brand" />
          ) : (
            <StorefrontIcon className="mt-0.5 size-4 shrink-0 text-brand" />
          )}
          <div>
            <div className="text-sm font-semibold text-ink">Routed through {order.items[0].fulfillmentCenter.name}</div>
            <div className="text-sm text-muted-foreground">{order.items[0].fulfillmentCenter.address}</div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-bold text-slate">Items ({order.items.length})</h2>
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
              <div className="font-bold tabular-nums text-ink">{formatNaira(item.priceLocked * item.quantity)}</div>
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
    </div>
  );
}
