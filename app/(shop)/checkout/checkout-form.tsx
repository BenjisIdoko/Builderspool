'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BankIcon, CheckCircleIcon, CircleIcon, DeviceMobileIcon, MapPinIcon, TruckIcon, CreditCardIcon, LockKeyIcon } from '@phosphor-icons/react/ssr';
import type { PaymentMethod } from '@prisma/client';
import { useCart } from '@/lib/cart/CartContext';
import { formatNaira } from '@/lib/format';
import { getDeliveryCost, type FulfillmentMethod } from '@/lib/checkout/deliveryCost';
import { MaterialImage } from '@/components/material-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const FULFILLMENT_OPTIONS: { method: FulfillmentMethod; label: string }[] = [
  { method: 'DELIVERY', label: 'Delivery to site' },
  { method: 'PICKUP', label: 'Pickup at center' },
];

const PAYMENT_OPTIONS: { method: PaymentMethod; label: string; icon: typeof BankIcon }[] = [
  { method: 'BANK_TRANSFER', label: 'Bank transfer', icon: BankIcon },
  { method: 'CARD', label: 'Card', icon: CreditCardIcon },
  { method: 'USSD', label: 'USSD', icon: DeviceMobileIcon },
];

const REGIONS = ['ABUJA', 'LAGOS', 'KANO'];

type SubmitState = { status: 'idle' } | { status: 'submitting' } | { status: 'error'; message: string };

export function CheckoutForm({
  buyerId,
  defaultContactName,
  defaultContactPhone,
}: {
  buyerId: string;
  defaultContactName: string;
  defaultContactPhone: string;
}) {
  const router = useRouter();
  const { lines, subtotal, clear } = useCart();
  const [region, setRegion] = useState(REGIONS[0]);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>('DELIVERY');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryContactName, setDeliveryContactName] = useState(defaultContactName);
  const [deliveryContactPhone, setDeliveryContactPhone] = useState(defaultContactPhone);
  const [deliveryWindow, setDeliveryWindow] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [state, setState] = useState<SubmitState>({ status: 'idle' });

  const deliveryCost = getDeliveryCost(region, fulfillmentMethod);
  const total = subtotal + deliveryCost;

  if (lines.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-8 text-center text-sm text-slate">
        Your cart is empty.{' '}
        <Link href="/catalog" className="text-brand hover:underline">
          Browse the catalog
        </Link>
        .
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ status: 'submitting' });

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId,
          region,
          fulfillmentMethod,
          paymentMethod,
          items: lines.map((l) => ({ materialId: l.materialId, quantity: l.quantity })),
          ...(fulfillmentMethod === 'DELIVERY'
            ? { deliveryAddress, deliveryContactName, deliveryContactPhone, deliveryWindow, deliveryNotes }
            : {}),
        }),
      });

      const body = await res.json();

      // The order is created before payment is initiated, so it comes back
      // even if Paystack initialization fails — send the buyer to the order
      // page either way rather than treating a committed order as a failure.
      if (body.order?.id) {
        clear();
        if (body.payment?.authorizationUrl) {
          window.location.href = body.payment.authorizationUrl;
          return;
        }
        router.push(`/orders/${body.order.id}`);
        return;
      }

      setState({ status: 'error', message: body.error || 'Checkout failed.' });
    } catch {
      setState({ status: 'error', message: 'Could not reach the server. Try again.' });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col">
        <div className="mb-3.5 text-[13px] font-bold text-slate">01 · Region</div>
        <div className="mb-10 max-w-xs">
          <Label htmlFor="region" className="sr-only">
            Region
          </Label>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger id="region" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r.charAt(0) + r.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mb-3.5 text-[13px] font-bold text-slate">02 · Items ({lines.length})</div>
        <div className="divide-y divide-border rounded-lg border border-border bg-surface">
          {lines.map((line) => (
            <div key={line.materialId} className="flex items-center gap-3 p-4">
              <MaterialImage
                imageUrl={line.imageUrl}
                category={line.category}
                alt={line.name}
                className="size-12 shrink-0 rounded-md border border-border"
                sizes="48px"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-ink">{line.name}</div>
                <div className="text-xs text-muted-foreground">Qty {line.quantity}</div>
              </div>
              <span className="font-bold tabular-nums text-slate">{formatNaira(line.catalogPrice * line.quantity)}</span>
            </div>
          ))}
        </div>

        {fulfillmentMethod === 'DELIVERY' && (
          <>
            <div className="mt-10 mb-3.5 text-[13px] font-bold text-slate">03 · Delivery details</div>
            <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
              <div>
                <Label htmlFor="deliveryAddress" className="mb-1.5 text-xs font-semibold text-slate">
                  Site address
                </Label>
                <Textarea
                  id="deliveryAddress"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Street address, landmark, and any access notes a driver would need to find the site"
                  required
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="deliveryContactName" className="mb-1.5 text-xs font-semibold text-slate">
                    Contact name
                  </Label>
                  <Input
                    id="deliveryContactName"
                    value={deliveryContactName}
                    onChange={(e) => setDeliveryContactName(e.target.value)}
                    placeholder="Who the driver should ask for"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryContactPhone" className="mb-1.5 text-xs font-semibold text-slate">
                    Contact phone
                  </Label>
                  <Input
                    id="deliveryContactPhone"
                    type="tel"
                    value={deliveryContactPhone}
                    onChange={(e) => setDeliveryContactPhone(e.target.value)}
                    placeholder="A number reachable on delivery day"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="deliveryWindow" className="mb-1.5 text-xs font-semibold text-slate">
                  Preferred delivery window <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="deliveryWindow"
                  value={deliveryWindow}
                  onChange={(e) => setDeliveryWindow(e.target.value)}
                  placeholder="e.g. Weekday mornings, or any time"
                />
              </div>
              <div>
                <Label htmlFor="deliveryNotes" className="mb-1.5 text-xs font-semibold text-slate">
                  Offload notes <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="deliveryNotes"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="e.g. Manual offload only, no crane access, call on arrival"
                  rows={2}
                />
              </div>
            </div>
          </>
        )}

        {state.status === 'error' && (
          <p className="mt-6 rounded-md border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
            {state.message}
          </p>
        )}
      </div>

      <div className="h-fit rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_16px_40px_rgba(16,24,40,0.08)] lg:sticky lg:top-24">
        <div className="mb-5 rounded-lg bg-gradient-to-br from-brand via-brand-deep to-brand-warm p-4 text-white">
          <div className="flex items-center gap-2 text-xs font-medium text-white/80">
            {fulfillmentMethod === 'DELIVERY' ? (
              <TruckIcon className="size-4" />
            ) : (
              <MapPinIcon className="size-4" />
            )}
            {fulfillmentMethod === 'DELIVERY' ? 'Delivering to' : 'Pickup from'}
          </div>
          <div className="mt-1 text-lg font-bold">
            {region.charAt(0) + region.slice(1).toLowerCase()} region
          </div>
        </div>

        <div className="mb-5 text-xl font-bold text-ink">
          {lines.length} {lines.length === 1 ? 'item' : 'items'}
        </div>

        <h2 className="mb-3 text-xs font-bold tracking-wide text-muted-foreground uppercase">Shipping method</h2>
        <div className="mb-5 flex flex-col gap-2">
          {FULFILLMENT_OPTIONS.map(({ method, label }) => {
            const cost = getDeliveryCost(region, method);
            const selected = fulfillmentMethod === method;
            return (
              <button
                key={method}
                type="button"
                onClick={() => setFulfillmentMethod(method)}
                className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
                  selected ? 'border-brand bg-info-soft' : 'border-border hover:border-border-strong'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {selected ? (
                    <CheckCircleIcon weight="fill" className="size-4.5 shrink-0 text-brand" />
                  ) : (
                    <CircleIcon className="size-4.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="font-semibold text-ink">{label}</span>
                </span>
                <span className="tabular-nums text-slate">{cost === 0 ? 'Free' : formatNaira(cost)}</span>
              </button>
            );
          })}
        </div>

        <h2 className="mb-3 text-xs font-bold tracking-wide text-muted-foreground uppercase">Payment method</h2>
        <div className="mb-5 flex flex-col gap-2">
          {PAYMENT_OPTIONS.map(({ method, label, icon: Icon }) => {
            const selected = paymentMethod === method;
            return (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={`flex items-center gap-2.5 rounded-lg border p-3 text-left text-sm transition-colors ${
                  selected ? 'border-brand bg-info-soft' : 'border-border hover:border-border-strong'
                }`}
              >
                {selected ? (
                  <CheckCircleIcon weight="fill" className="size-4.5 shrink-0 text-brand" />
                ) : (
                  <CircleIcon className="size-4.5 shrink-0 text-muted-foreground" />
                )}
                <Icon className="size-4 shrink-0 text-slate" />
                <span className="font-semibold text-ink">{label}</span>
              </button>
            );
          })}
        </div>

        <div className="mb-5 flex items-start gap-2 rounded-lg bg-success-soft p-3 text-xs text-success">
          <LockKeyIcon className="mt-0.5 size-4 shrink-0" />
          <span>
            Funds are held by Builders Pool once payment confirms, and released to the fulfilling
            supplier only after the fulfillment center confirms receipt — never before.
          </span>
        </div>

        <div className="flex flex-col gap-1.5 border-t border-border pt-4 text-sm">
          <div className="flex justify-between text-slate">
            <span>Materials subtotal</span>
            <span className="tabular-nums font-bold text-ink">{formatNaira(subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate">
            <span>{fulfillmentMethod === 'DELIVERY' ? 'Delivery' : 'Pickup'}</span>
            <span className="tabular-nums font-bold text-ink">{deliveryCost === 0 ? 'Free' : formatNaira(deliveryCost)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2.5 text-base font-bold text-ink">
            <span>Order total</span>
            <span className="tabular-nums">{formatNaira(total)}</span>
          </div>
        </div>

        <Button type="submit" size="lg" className="mt-5 w-full" disabled={state.status === 'submitting'}>
          {state.status === 'submitting' ? 'Processing…' : `Pay ${formatNaira(total)} securely`}
        </Button>
      </div>
    </form>
  );
}
