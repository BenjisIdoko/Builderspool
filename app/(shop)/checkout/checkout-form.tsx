'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BankIcon, CheckCircleIcon, CircleIcon, DeviceMobileIcon, MapPinIcon, TruckIcon, CreditCardIcon, LockKeyIcon } from '@phosphor-icons/react/ssr';
import type { PaymentMethod } from '@prisma/client';
import { useCart } from '@/lib/cart/CartContext';
import { linePrice } from '@/lib/cart/types';
import type { CheckoutAreas } from '@/lib/queries/checkoutAreas';
import { CheckoutLocalityPicker, findLocality } from '@/components/checkout-locality-picker';
import { formatNaira } from '@/lib/format';
import { getDeliveryCost, type FulfillmentMethod } from '@/lib/checkout/deliveryCost';
import { MaterialImage } from '@/components/material-image';
import { PickupLocation } from '@/components/pickup-location';
import { Badge } from '@/components/ui/badge';
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

function formatYmd(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

type SubmitState = { status: 'idle' } | { status: 'submitting' } | { status: 'error'; message: string };

export function CheckoutForm({
  areas,
  centers,
  defaultContactName,
  defaultContactPhone,
  poolDay,
  poolCloseTime,
  earliestDate,
  testMode,
}: {
  /** The locality picker's data; `enabled` is false until the setting is switched on. */
  areas: CheckoutAreas;
  /** Pickup centre by region, so "Pickup from" names the real place. */
  centers: Record<string, { name: string; address: string }>;
  defaultContactName: string;
  defaultContactPhone: string;
  /** Which pool an order placed now joins. */
  poolDay: 'today' | 'tomorrow';
  poolCloseTime: string;
  /** YYYY-MM-DD, tomorrow in Lagos. */
  earliestDate: string;
  testMode: boolean;
}) {
  const router = useRouter();
  const { lines, subtotal, clear } = useCart();
  const [region, setRegion] = useState(REGIONS[0]);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>('DELIVERY');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryContactName, setDeliveryContactName] = useState(defaultContactName);
  const [deliveryContactPhone, setDeliveryContactPhone] = useState(defaultContactPhone);
  const [landmark, setLandmark] = useState('');
  const [neededBy, setNeededBy] = useState('');
  const [deliveryWindow, setDeliveryWindow] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [localityId, setLocalityId] = useState('');
  const zone = areas.enabled && localityId ? (findLocality(areas, localityId)?.zone ?? null) : null;
  // With the picker on, delivery needs a zone that has a fee; otherwise pickup only.
  const deliveryAvailable = !areas.enabled || (zone !== null && zone.fee !== null);
  const costFor = (method: FulfillmentMethod) =>
    areas.enabled ? (method === 'DELIVERY' ? (zone?.fee ?? 0) : 0) : getDeliveryCost(region, method);
  // How the whole cart is bought. Buy Direct needs a picked seller on every line.
  const [mode, setMode] = useState<'POOL' | 'DIRECT'>('POOL');
  const canBuyDirect = lines.length > 0 && lines.every((l) => l.listingId);
  const noSeller = lines.filter((l) => !l.listingId).map((l) => l.name);
  const noSellerText = `${noSeller.slice(0, 2).join(', ')}${noSeller.length > 2 ? ` and ${noSeller.length - 2} more` : ''}`;
  const center = centers[region] ?? null;
  const effectiveMode = mode === 'DIRECT' && canBuyDirect ? 'DIRECT' : 'POOL';
  const [state, setState] = useState<SubmitState>({ status: 'idle' });

  // The first required field still empty, named beside the pay button so a
  // disabled button is never a mystery.
  const missing =
    areas.enabled && !zone
      ? 'an area we deliver to'
      : fulfillmentMethod === 'DELIVERY'
      ? !deliveryAddress.trim()
        ? 'your site address'
        : !deliveryContactName.trim()
          ? 'a contact name'
          : !deliveryContactPhone.trim()
            ? 'a contact phone'
            : null
      : null;

  const deliveryCost = costFor(fulfillmentMethod);
  const total = subtotal + deliveryCost;

  if (lines.length === 0) {
    return (
      <div className="rounded-lg bg-surface p-8 text-center text-sm text-slate">
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
          region,
          localityId: areas.enabled ? localityId : null,
          fulfillmentMethod,
          paymentMethod,
          mode: effectiveMode,
          items: lines.map((l) => ({ materialId: l.materialId, quantity: l.quantity, listingId: l.listingId ?? null })),
          ...(fulfillmentMethod === 'DELIVERY'
            ? {
                deliveryAddress: landmark.trim() ? `${deliveryAddress.trim()} (Landmark: ${landmark.trim()})` : deliveryAddress,
                deliveryContactName,
                deliveryContactPhone,
                deliveryWindow: [
                  neededBy ? `Needed on site by ${formatYmd(neededBy)}` : '',
                  deliveryWindow.trim(),
                ]
                  .filter(Boolean)
                  .join(' · '),
                deliveryNotes,
              }
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
        <section aria-label="Pool & Save" className="mb-8 rounded-card border-l-4 border-cyan bg-pale-blue p-4">
          <p className="text-heading-sm text-ink">This order joins {poolDay}’s pool</p>
          <p className="mt-1 text-body-sm text-ink">
            You pay the catalogue price now. The pool {poolDay === 'today' ? 'closes' : 'for tomorrow closes'} at{' '}
            <span className="font-mono text-figure">{poolCloseTime}</span>; then verified suppliers bid blind for the
            whole pool. If the winning bid costs less than the catalogue price, you keep 50% of the saving in your
            savings wallet once delivery is confirmed. If no supplier can fill part of your order, the unfilled amount
            is refunded.
          </p>
        </section>

        <div className="mb-3.5 text-label text-slate uppercase">{areas.enabled ? '01 · Where are you?' : '01 · Region'}</div>
        {areas.enabled ? (
          <div className="mb-10">
            <CheckoutLocalityPicker
              areas={areas}
              value={localityId}
              defaultPhone={defaultContactPhone}
              onChange={(id) => {
                setLocalityId(id);
                // Switch to pickup straight away if the new area has no delivery.
                const next = findLocality(areas, id)?.zone;
                if (!next || next.fee === null) setFulfillmentMethod('PICKUP');
              }}
            />
          </div>
        ) : (
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
        )}

        <div className="mb-3.5 text-label text-slate uppercase">02 · Items ({lines.length})</div>
        <div className="divide-y divide-border rounded-lg bg-surface">
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
              <span className="font-bold tabular-nums text-slate">{formatNaira(linePrice(line) * line.quantity)}</span>
            </div>
          ))}
        </div>

        {fulfillmentMethod === 'PICKUP' && center && (
          <>
            <div className="mt-10 mb-3.5 text-label text-slate uppercase">03 · Collect your order</div>
            <PickupLocation name={center.name} address={center.address} />
          </>
        )}

        {fulfillmentMethod === 'DELIVERY' && (
          <>
            <div className="mt-10 mb-3.5 text-label text-slate uppercase">03 · Delivery details</div>
            <div className="flex flex-col gap-8 rounded-card bg-surface p-5">
              <fieldset className="flex flex-col gap-4">
                <legend className="mb-1 text-heading-sm text-ink">Site</legend>
                <div>
                  <Label htmlFor="deliveryAddress" className="mb-1.5 text-body-sm font-medium text-ink">
                    Site address
                  </Label>
                  <Textarea
                    id="deliveryAddress"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Street address and any access notes a driver would need to find the site"
                    required
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="landmark" className="mb-1.5 text-body-sm font-medium text-ink">
                    Nearest landmark <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Input id="landmark" value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="e.g. Opposite the filling station" />
                </div>
              </fieldset>

              <fieldset className="flex flex-col gap-4">
                <legend className="mb-1 text-heading-sm text-ink">Contact on site</legend>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="deliveryContactName" className="mb-1.5 text-body-sm font-medium text-ink">
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
                    <Label htmlFor="deliveryContactPhone" className="mb-1.5 text-body-sm font-medium text-ink">
                      Contact phone
                    </Label>
                    <Input
                      id="deliveryContactPhone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={deliveryContactPhone}
                      onChange={(e) => setDeliveryContactPhone(e.target.value)}
                      placeholder="A number reachable on delivery day"
                      required
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className="flex flex-col gap-4">
                <legend className="mb-1 text-heading-sm text-ink">Timing and offloading</legend>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="neededBy" className="mb-1.5 text-body-sm font-medium text-ink">
                      Needed on site by <span className="font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Input id="neededBy" type="date" min={earliestDate} value={neededBy} onChange={(e) => setNeededBy(e.target.value)} />
                    <p className="mt-1 text-caption text-muted-foreground">Earliest: {formatYmd(earliestDate)}</p>
                  </div>
                  <div>
                    <Label htmlFor="deliveryWindow" className="mb-1.5 text-body-sm font-medium text-ink">
                      Preferred time of day <span className="font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="deliveryWindow"
                      value={deliveryWindow}
                      onChange={(e) => setDeliveryWindow(e.target.value)}
                      placeholder="e.g. Weekday mornings, or any time"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="deliveryNotes" className="mb-1.5 text-body-sm font-medium text-ink">
                    Offloading notes <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Textarea
                    id="deliveryNotes"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="e.g. Manual offload only, no crane access, call on arrival"
                    rows={2}
                  />
                </div>
              </fieldset>
            </div>
          </>
        )}

        {state.status === 'error' && (
          <p className="mt-6 rounded-md border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
            {state.message}
          </p>
        )}
      </div>

      <div className="h-fit rounded-md bg-surface p-5 lg:sticky lg:top-44">
        <div className="mb-5 rounded-md bg-ink p-4 text-white">
          <div className="flex items-center gap-2 text-xs font-medium text-white/80">
            {fulfillmentMethod === 'DELIVERY' ? (
              <TruckIcon className="size-4" />
            ) : (
              <MapPinIcon className="size-4" />
            )}
            {fulfillmentMethod === 'DELIVERY' ? 'Delivering to' : 'Pickup from'}
          </div>
          {fulfillmentMethod === 'PICKUP' && center ? (
            <>
              <div className="mt-1 text-lg font-bold">{center.name}</div>
              <div className="mt-0.5 text-xs text-white/70">{center.address}</div>
            </>
          ) : (
            <div className="mt-1 text-lg font-bold">
              {areas.enabled ? (zone ? zone.name : 'Choose your area') : `${region.charAt(0) + region.slice(1).toLowerCase()} region`}
            </div>
          )}
        </div>

        <div className="mb-5 text-xl font-bold text-ink">
          {lines.length} {lines.length === 1 ? 'item' : 'items'}
        </div>

        <h2 className="mb-3 text-label text-muted-foreground uppercase">How to buy</h2>
        <div className="mb-5 flex flex-col gap-2">
          {(
            [
              { value: 'DIRECT', label: 'Buy Direct', body: 'From the seller you picked. They accept your order and send it to our fulfilment centre, where it is checked before it reaches you.', disabled: !canBuyDirect },
              { value: 'POOL', label: 'Pool & Save', body: 'Your order joins today’s pool and suppliers bid for it. You keep half of any saving, and you do not choose the supplier.', disabled: false },
            ] as const
          ).map((opt) => {
            const selected = effectiveMode === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={opt.disabled}
                onClick={() => setMode(opt.value)}
                className={`flex items-start gap-2.5 rounded-lg border p-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  selected ? 'border-brand bg-info-soft' : 'border-input hover:border-brand'
                }`}
              >
                {selected ? (
                  <CheckCircleIcon weight="fill" className="mt-0.5 size-4.5 shrink-0 text-brand" />
                ) : (
                  <CircleIcon className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" />
                )}
                <span>
                  <span className="block font-semibold text-ink">{opt.label}</span>
                  <span className="block text-xs text-slate">{opt.body}</span>
                  {opt.disabled && opt.value === 'DIRECT' && (
                    <span className="mt-1 block text-xs text-warning-text">
                      Buy Direct needs a seller picked on every item. {noSellerText} {noSeller.length === 1 ? 'has' : 'have'} none: open the product page to pick one, or no seller has listed {noSeller.length === 1 ? 'it' : 'them'} yet.
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <h2 className="mb-3 text-label text-muted-foreground uppercase">Shipping method</h2>
        <div className="mb-5 flex flex-col gap-2">
          {FULFILLMENT_OPTIONS.map(({ method, label }) => {
            const cost = costFor(method);
            const unavailable = method === 'DELIVERY' && !deliveryAvailable;
            const selected = fulfillmentMethod === method;
            return (
              <button
                key={method}
                type="button"
                disabled={unavailable}
                onClick={() => setFulfillmentMethod(method)}
                className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
                  selected ? 'border-brand bg-info-soft' : 'border-input hover:border-brand'
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
                <span className="tabular-nums text-slate">{unavailable ? 'Not available here yet' : cost === 0 ? 'Free' : formatNaira(cost)}</span>
              </button>
            );
          })}
        </div>

        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-label text-muted-foreground uppercase">Payment method</h2>
          {testMode && <Badge variant="test">Test</Badge>}
        </div>
        {testMode && (
          <p className="mb-3 rounded-md bg-warning-soft px-3 py-2 text-xs text-warning-text">
            Test payment — no real money moves. Use Paystack&apos;s test card.
          </p>
        )}
        <div className="mb-5 flex flex-col gap-2">
          {PAYMENT_OPTIONS.map(({ method, label, icon: Icon }) => {
            const selected = paymentMethod === method;
            return (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={`flex items-center gap-2.5 rounded-lg border p-3 text-left text-sm transition-colors ${
                  selected ? 'border-brand bg-info-soft' : 'border-input hover:border-brand'
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

        <Button
          type="submit"
          variant="cta"
          size="lg"
          className="mt-5 w-full"
          disabled={state.status === 'submitting' || missing !== null}
        >
          {state.status === 'submitting' ? 'Processing…' : `Pay ${formatNaira(total)} securely`}
        </Button>
        {missing && (
          <p className="mt-2 text-center text-caption text-slate" role="status">
            Add {missing} to continue.
          </p>
        )}
      </div>
    </form>
  );
}
