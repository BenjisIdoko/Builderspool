'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart/CartContext';
import { formatNaira } from '@/lib/format';
import { getDeliveryCost, type FulfillmentMethod } from '@/lib/checkout/deliveryCost';

const REGIONS = ['ABUJA', 'LAGOS', 'KANO'];

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'order-created'; orderId: string }
  | { status: 'error'; message: string };

export function CheckoutForm({ buyerId }: { buyerId: string }) {
  const { lines, subtotal, clear } = useCart();
  const [region, setRegion] = useState(REGIONS[0]);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>('DELIVERY');
  const [state, setState] = useState<SubmitState>({ status: 'idle' });

  const deliveryCost = getDeliveryCost(region, fulfillmentMethod);
  const total = subtotal + deliveryCost;

  if (state.status === 'order-created') {
    return (
      <div className="rounded-lg border border-border bg-surface p-8 text-center">
        <h2 className="text-lg font-medium text-ink">Order placed</h2>
        <p className="mt-2 text-sm text-slate">
          Order <span className="font-mono text-ink">{state.orderId}</span> was created. Payment
          isn&apos;t wired up yet, so it&apos;s sitting in{' '}
          <span className="font-mono">PENDING_PAYMENT</span> until a gateway is connected.
        </p>
        <Link href="/catalog" className="mt-6 inline-block text-sm text-accent hover:underline">
          Continue browsing
        </Link>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-8 text-center text-sm text-slate">
        Your cart is empty.{' '}
        <Link href="/catalog" className="text-accent hover:underline">
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
      // still carries a real order back — surface it as a success state.
      if (body.order?.id) {
        clear();
        setState({ status: 'order-created', orderId: body.order.id });
        return;
      }

      setState({ status: 'error', message: body.error || 'Checkout failed.' });
    } catch {
      setState({ status: 'error', message: 'Could not reach the server. Try again.' });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="rounded-lg border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-medium text-slate">Order summary</h2>
        <div className="flex flex-col gap-2">
          {lines.map((line) => (
            <div key={line.materialId} className="flex justify-between text-sm">
              <span className="text-ink">
                {line.name} × {line.quantity}
              </span>
              <span className="text-slate">{formatNaira(line.catalogPrice * line.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-1.5 border-t border-border pt-4 text-sm">
          <div className="flex justify-between text-slate">
            <span>Subtotal</span>
            <span>{formatNaira(subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate">
            <span>Delivery</span>
            <span>{deliveryCost === 0 ? 'Free' : formatNaira(deliveryCost)}</span>
          </div>
          <div className="flex justify-between pt-1 text-base font-medium text-ink">
            <span>Total</span>
            <span>{formatNaira(total)}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-medium text-slate">Delivery details</h2>

        <label className="mb-4 block text-sm">
          <span className="mb-1.5 block text-ink">Region</span>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-ink"
          >
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0) + r.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          {(['DELIVERY', 'PICKUP'] as const).map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setFulfillmentMethod(method)}
              className={[
                'rounded-md border px-4 py-3 text-sm font-medium transition-colors',
                fulfillmentMethod === method
                  ? 'border-ink bg-ink text-white'
                  : 'border-border text-slate hover:border-ink/30',
              ].join(' ')}
            >
              {method === 'DELIVERY' ? 'Deliver to site' : 'Pick up at center'}
            </button>
          ))}
        </div>
      </div>

      {state.status === 'error' && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={state.status === 'submitting'}
        className="rounded-md bg-ink px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {state.status === 'submitting' ? 'Placing order…' : `Place order — ${formatNaira(total)}`}
      </button>
    </form>
  );
}
