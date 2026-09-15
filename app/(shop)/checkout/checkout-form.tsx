'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon, CircleIcon, MapPinIcon, TruckIcon } from '@phosphor-icons/react/ssr';
import { useCart } from '@/lib/cart/CartContext';
import { formatNaira } from '@/lib/format';
import { getDeliveryCost, type FulfillmentMethod } from '@/lib/checkout/deliveryCost';
import { MaterialImage } from '@/components/material-image';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const FULFILLMENT_OPTIONS: { method: FulfillmentMethod; label: string }[] = [
  { method: 'DELIVERY', label: 'Delivery to site' },
  { method: 'PICKUP', label: 'Pickup at center' },
];

const REGIONS = ['ABUJA', 'LAGOS', 'KANO'];

type SubmitState = { status: 'idle' } | { status: 'submitting' } | { status: 'error'; message: string };

export function CheckoutForm({ buyerId }: { buyerId: string }) {
  const router = useRouter();
  const { lines, subtotal, clear } = useCart();
  const [region, setRegion] = useState(REGIONS[0]);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>('DELIVERY');
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
          items: lines.map((l) => ({ materialId: l.materialId, quantity: l.quantity })),
        }),
      });

      const body = await res.json();

      // The order is created before initiatePayment() runs, so even the
      // expected "not implemented" error (see app/api/checkout/route.ts)
      // still carries a real order back — send the buyer to its
      // confirmation page rather than treating this as a failure.
      if (body.order?.id) {
        clear();
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

        {state.status === 'error' && (
          <p className="mt-6 rounded-md border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
            {state.message}
          </p>
        )}
      </div>

      <div className="h-fit rounded-lg bg-ink p-5 text-white lg:sticky lg:top-24">
        <div className="mb-5 rounded-lg bg-gradient-to-br from-brand via-brand-deep to-brand-warm p-4">
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

        <div className="mb-5 text-2xl font-bold">
          {lines.length} {lines.length === 1 ? 'item' : 'items'}
        </div>

        <h2 className="mb-3 text-xs font-bold tracking-wide text-white/50 uppercase">Shipping method</h2>
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
                  selected ? 'border-brand bg-white/5' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {selected ? (
                    <CheckCircleIcon weight="fill" className="size-4.5 shrink-0 text-brand" />
                  ) : (
                    <CircleIcon className="size-4.5 shrink-0 text-white/30" />
                  )}
                  <span className="font-semibold">{label}</span>
                </span>
                <span className="tabular-nums text-white/70">{cost === 0 ? 'Free' : formatNaira(cost)}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-1.5 border-t border-white/10 pt-4 text-sm">
          <div className="flex justify-between text-white/60">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatNaira(subtotal)}</span>
          </div>
          <div className="flex justify-between text-white/60">
            <span>Delivery</span>
            <span className="tabular-nums">{deliveryCost === 0 ? 'Free' : formatNaira(deliveryCost)}</span>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-2.5 text-base font-bold">
            <span>Total</span>
            <span className="tabular-nums">{formatNaira(total)}</span>
          </div>
        </div>

        <Button type="submit" size="lg" className="mt-5 w-full" disabled={state.status === 'submitting'}>
          {state.status === 'submitting' ? 'Placing order…' : 'Place order →'}
        </Button>
      </div>
    </form>
  );
}
