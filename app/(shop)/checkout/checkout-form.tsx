'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart/CartContext';
import { formatNaira } from '@/lib/format';
import { getDeliveryCost, type FulfillmentMethod } from '@/lib/checkout/deliveryCost';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-6">
        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate">Delivery details</h2>

          <div className="mb-4 flex flex-col gap-1.5">
            <Label htmlFor="region">Region</Label>
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

          <Label className="mb-2 block">Fulfillment method</Label>
          <div className="grid grid-cols-2 gap-3">
            {(['DELIVERY', 'PICKUP'] as const).map((method) => (
              <Button
                key={method}
                type="button"
                variant={fulfillmentMethod === method ? 'default' : 'outline'}
                className="h-auto py-3"
                onClick={() => setFulfillmentMethod(method)}
              >
                {method === 'DELIVERY' ? 'Deliver to site' : 'Pick up at center'}
              </Button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate">Items ({lines.length})</h2>
          <div className="flex flex-col gap-2">
            {lines.map((line) => (
              <div key={line.materialId} className="flex justify-between text-sm">
                <span className="text-ink">
                  {line.name} × {line.quantity}
                </span>
                <span className="tabular-nums text-slate">{formatNaira(line.catalogPrice * line.quantity)}</span>
              </div>
            ))}
          </div>
        </div>

        {state.status === 'error' && (
          <p className="rounded-md border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
            {state.message}
          </p>
        )}
      </div>

      <div className="h-fit rounded-lg border border-border bg-surface p-5 lg:sticky lg:top-24">
        <h2 className="mb-4 text-sm font-semibold text-slate">Order summary</h2>
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between text-slate">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatNaira(subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate">
            <span>Delivery</span>
            <span className="tabular-nums">{deliveryCost === 0 ? 'Free' : formatNaira(deliveryCost)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2.5 text-base font-semibold text-ink">
            <span>Total</span>
            <span className="tabular-nums">{formatNaira(total)}</span>
          </div>
        </div>

        <Button type="submit" size="lg" className="mt-5 w-full" disabled={state.status === 'submitting'}>
          {state.status === 'submitting' ? 'Placing order…' : 'Place order'}
        </Button>
      </div>
    </form>
  );
}
