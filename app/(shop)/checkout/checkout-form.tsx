'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BankIcon, CheckCircleIcon, CircleIcon, DeviceMobileIcon, MapPinIcon, TruckIcon, CreditCardIcon, LockKeyIcon, WalletIcon } from '@phosphor-icons/react/ssr';
import type { PaymentMethod } from '@prisma/client';
import { useCart } from '@/lib/cart/CartContext';
import type { CheckoutAreas } from '@/lib/queries/checkoutAreas';
import { CheckoutLocalityPicker, findLocality } from '@/components/checkout-locality-picker';
import { formatNaira, formatClock } from '@/lib/format';
import { AnimatedCount, AnimatedNaira } from '@/components/ui/animated-number';
import { AddMoreMaterials, CheckoutLineItems } from '@/components/checkout-line-items';
import { getDeliveryCost, type FulfillmentMethod } from '@/lib/checkout/deliveryCost';
import { checkoutFallbackText } from '@/lib/pool-stages';
import { DatePicker } from '@/components/ui/date-picker';
import { PickupLocation } from '@/components/pickup-location';
import { STATION_REGIONS } from '@/lib/areas/region';
import { PickupStationList } from '@/components/pickup-station-list';
import type { PickupCenter } from '@/lib/queries/pickupCenters';
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

const REGIONS: readonly string[] = STATION_REGIONS;
// Delivery windows a buyer can ask for, inside our Monday to Saturday, 8am to 6pm hours.
const DELIVERY_WINDOWS = ['Morning (8am–12pm)', 'Afternoon (12pm–4pm)', 'Late afternoon (4pm–6pm)'];
const AREA_MISSING = 'Choose an area we deliver to.';

function formatYmd(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

// Selected / unselected mark for the option rows. Both icons stay mounted and cross-fade (scale
// 0.25 to 1, opacity, 4px blur, 300ms, no overshoot), so it animates only when the choice changes.
function RadioDot({ selected, className = '' }: { selected: boolean; className?: string }) {
  const swap = 'absolute inset-0 size-4.5 transition-[opacity,filter,scale] duration-300 [transition-timing-function:cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none';
  const on = 'scale-100 opacity-100 blur-0';
  const off = 'scale-[0.25] opacity-0 blur-[4px]';
  return (
    <span aria-hidden className={`relative size-4.5 shrink-0 ${className}`}>
      <CheckCircleIcon weight="fill" className={`${swap} text-brand ${selected ? on : off}`} />
      <CircleIcon className={`${swap} text-muted-foreground ${selected ? off : on}`} />
    </span>
  );
}

export type SavedCheckoutAddress = {
  id: string;
  contactName: string;
  contactPhone: string;
  address: string;
  landmark: string | null;
  localityId: string | null;
  isDefault: boolean;
};

type SubmitState = { status: 'idle' } | { status: 'submitting' } | { status: 'error'; message: string };

export function CheckoutForm({
  areas,
  centers,
  savedCenterId,
  savedCenterIds,
  savedAddresses,
  defaultContactName,
  defaultContactPhone,
  poolDay,
  poolCloseTime,
  earliestDate,
  availableSavingsCredit = 0,
  testMode,
}: {
  /** The locality picker's data; `enabled` is false until the setting is switched on. */
  areas: CheckoutAreas;
  /** Every pickup station; the ones in the order's region are offered. */
  centers: PickupCenter[];
  /** The buyer's default pickup station, if any. */
  savedCenterId: string | null;
  /** Every station the buyer saved, listed first. */
  savedCenterIds: string[];
  /** The buyer's saved delivery addresses; the default one fills the form in. */
  savedAddresses: SavedCheckoutAddress[];
  defaultContactName: string;
  defaultContactPhone: string;
  /** Which pool an order placed now joins. */
  poolDay: 'today' | 'tomorrow';
  poolCloseTime: string;
  /** YYYY-MM-DD, tomorrow in Lagos. */
  earliestDate: string;
  /** Available Savings Wallet credit in Naira that can be applied at checkout. */
  availableSavingsCredit?: number;
  testMode: boolean;
}) {
  const router = useRouter();
  const { lines, subtotal, clear } = useCart();
  const [region, setRegion] = useState(REGIONS[0]);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>('DELIVERY');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  // The default saved address fills the form in; the buyer can pick another or type a new one.
  const initialAddress = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0] ?? null;
  const [addressChoice, setAddressChoice] = useState(initialAddress?.id ?? '');
  const [deliveryAddress, setDeliveryAddress] = useState(initialAddress?.address ?? '');
  const [deliveryContactName, setDeliveryContactName] = useState(initialAddress?.contactName ?? defaultContactName);
  const [deliveryContactPhone, setDeliveryContactPhone] = useState(initialAddress?.contactPhone ?? defaultContactPhone);
  const [landmark, setLandmark] = useState(initialAddress?.landmark ?? '');
  const [neededBy, setNeededBy] = useState('');
  const [deliveryWindow, setDeliveryWindow] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [localityId, setLocalityId] = useState(areas.enabled && initialAddress?.localityId && findLocality(areas, initialAddress.localityId) ? initialAddress.localityId : '');
  const zone = areas.enabled && localityId ? (findLocality(areas, localityId)?.zone ?? null) : null;
  // With the picker on, delivery needs a zone that has a fee; otherwise pickup only.
  const deliveryAvailable = !areas.enabled || (zone !== null && zone.fee !== null);
  const costFor = (method: FulfillmentMethod) =>
    areas.enabled ? (method === 'DELIVERY' ? (zone?.fee ?? 0) : 0) : getDeliveryCost(region, method);
  // How the cart is bought. Buyers can set all eligible items to Buy Direct or Pool & Save,
  // or customize each line item individually when they have a mixed cart.
  const [mode, setMode] = useState<'POOL' | 'DIRECT'>('POOL');
  const [itemModeOverrides, setItemModeOverrides] = useState<Record<string, 'POOL' | 'DIRECT'>>({});
  const [applySavingsCredit, setApplySavingsCredit] = useState(availableSavingsCredit > 0);
  const hasAnyPickableSeller = lines.some((l) => Boolean(l.listingId));
  const canBuyDirectAll = lines.length > 0 && lines.every((l) => Boolean(l.listingId));
  const noSeller = lines.filter((l) => !l.listingId).map((l) => l.name);
  const noSellerText = `${noSeller.slice(0, 2).join(', ')}${noSeller.length > 2 ? ` and ${noSeller.length - 2} more` : ''}`;

  const resolvedItemModes: Record<string, 'POOL' | 'DIRECT'> = {};
  for (const l of lines) {
    if (!l.listingId) {
      resolvedItemModes[l.materialId] = 'POOL';
    } else {
      resolvedItemModes[l.materialId] = itemModeOverrides[l.materialId] ?? mode;
    }
  }
  const directCount = lines.filter((l) => resolvedItemModes[l.materialId] === 'DIRECT').length;
  const poolCount = lines.length - directCount;

  // Stations in the order's region: this order's own pick, else the buyer's saved
  // station if it is here, else the region's first.
  const regionCenters = centers
    .filter((c) => c.region === region)
    .sort((a, b) => Number(savedCenterIds.includes(b.id)) - Number(savedCenterIds.includes(a.id)));
  const [pickedCenterId, setPickedCenterId] = useState('');
  const center =
    regionCenters.find((c) => c.id === pickedCenterId) ?? regionCenters.find((c) => c.id === savedCenterId) ?? regionCenters[0] ?? null;
  const effectiveMode = directCount > 0 && poolCount === 0 ? 'DIRECT' : 'POOL';
  const [state, setState] = useState<SubmitState>({ status: 'idle' });

  // The first required field still empty, named beside the pay button so a
  // disabled button is never a mystery.
  const missing =
    areas.enabled && !zone
      ? AREA_MISSING
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
  const grossTotal = subtotal + deliveryCost;
  const savingsDiscount = applySavingsCredit ? Math.min(availableSavingsCredit, grossTotal) : 0;
  const total = Math.max(0, grossTotal - savingsDiscount);

  if (lines.length === 0) {
    return (
      <div className="rounded-lg bg-surface p-8 text-center text-sm text-slate">
        Your cart is empty.{' '}
        <Link href="/catalog" className="text-brand hover:underline">
          Browse materials
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
          pickupCenterId: fulfillmentMethod === 'PICKUP' ? (center?.id ?? null) : null,
          paymentMethod,
          mode: effectiveMode,
          applySavingsCredit,
          items: lines.map((l) => ({
            materialId: l.materialId,
            quantity: l.quantity,
            listingId: l.listingId ?? null,
            mode: resolvedItemModes[l.materialId],
          })),
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
        router.push(`/orders/${body.order.id}${body.paymentError ? '?payment=failed' : ''}`);
        return;
      }

      setState({ status: 'error', message: body.error || "We couldn't place your order. Check your details and try again. If it keeps happening, contact us." });
    } catch {
      setState({ status: 'error', message: "We couldn't connect. Check your internet and try again." });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col">
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

        <div className="mb-3.5 text-label text-slate uppercase">
          02 · Items (<AnimatedCount value={lines.length} />)
        </div>
        <CheckoutLineItems
          itemModes={resolvedItemModes}
          onToggleItemMode={(materialId, lineMode) =>
            setItemModeOverrides((prev) => ({ ...prev, [materialId]: lineMode }))
          }
        />
        <AddMoreMaterials />

        {fulfillmentMethod === 'PICKUP' && center && (
          <>
            <div className="mt-10 mb-3.5 text-label text-slate uppercase">03 · Collect your order</div>
            {regionCenters.length > 1 && (
              <div className="mb-4">
                <PickupStationList centers={regionCenters} value={center.id} onChange={setPickedCenterId} label="Pickup station for this order" />
                <p className="mt-2 text-caption text-muted-foreground">
                  Save a default on your{' '}
                  <Link href="/account/addresses" className="rounded-sm font-medium text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
                    account page
                  </Link>
                  .
                </p>
              </div>
            )}
            <PickupLocation name={center.name} address={center.address} />
          </>
        )}

        {fulfillmentMethod === 'DELIVERY' && (
          <>
            <div className="mt-10 mb-3.5 text-label text-slate uppercase">03 · Delivery details</div>
            <div className="flex flex-col gap-8 rounded-card bg-surface p-5">
              {savedAddresses.length > 0 && (
                <fieldset className="flex flex-col gap-3">
                  <legend className="mb-1 text-heading-sm text-ink">Deliver to</legend>
                  <div className="flex flex-col gap-2">
                    {[...savedAddresses, null].map((a) => {
                      const id = a?.id ?? '';
                      const selected = addressChoice === id;
                      return (
                        <label
                          key={id || 'new'}
                          className={`flex cursor-pointer items-start gap-3 rounded-md p-3 shadow-[0_0_0_1px_var(--color-hairline)] transition-[box-shadow,background-color] duration-150 has-focus-visible:ring-2 has-focus-visible:ring-ring ${
                            selected ? 'bg-info-soft shadow-[0_0_0_2px_var(--color-brand)]' : 'hover:bg-well/60'
                          }`}
                        >
                          <input
                            type="radio"
                            name="savedAddress"
                            checked={selected}
                            onChange={() => {
                              setAddressChoice(id);
                              setDeliveryAddress(a?.address ?? '');
                              setLandmark(a?.landmark ?? '');
                              if (a) {
                                setDeliveryContactName(a.contactName);
                                setDeliveryContactPhone(a.contactPhone);
                                if (areas.enabled && a.localityId && findLocality(areas, a.localityId)) setLocalityId(a.localityId);
                              }
                            }}
                            className="mt-1 size-4 shrink-0 accent-brand outline-none"
                          />
                          <span className="min-w-0 flex-1 text-pretty text-sm">
                            {a ? (
                              <>
                                <span className="block font-semibold text-ink">
                                  {a.contactName}
                                  {a.isDefault && <span className="ml-2 text-caption font-normal text-success">Default</span>}
                                </span>
                                <span className="block text-muted-foreground">{a.address}</span>
                              </>
                            ) : (
                              <span className="font-semibold text-ink">A different address</span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-caption text-muted-foreground">
                    <Link href="/account/addresses?tab=delivery" className="rounded-sm font-medium text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
                      Manage your saved addresses
                    </Link>
                  </p>
                </fieldset>
              )}
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
                    placeholder="Street address and access notes"
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
                    <DatePicker id="neededBy" min={earliestDate} value={neededBy} onChange={setNeededBy} placeholder="Pick a date" />
                    <p className="mt-1 text-caption text-muted-foreground">Earliest: {formatYmd(earliestDate)}</p>
                  </div>
                  <div>
                    <Label htmlFor="deliveryWindow" className="mb-1.5 text-body-sm font-medium text-ink">
                      Preferred time of day <span className="font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Select value={deliveryWindow || 'any'} onValueChange={(v) => setDeliveryWindow(v === 'any' ? '' : v)}>
                      <SelectTrigger id="deliveryWindow" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any time</SelectItem>
                        {DELIVERY_WINDOWS.map((w) => (
                          <SelectItem key={w} value={w}>
                            {w}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
              {
                value: 'DIRECT',
                label: canBuyDirectAll ? 'Buy Direct' : 'Buy Direct (where seller picked)',
                body: canBuyDirectAll
                  ? 'From the seller you picked.'
                  : 'Items with a seller go direct; others join Pool & Save.',
                disabled: !hasAnyPickableSeller,
              },
              {
                value: 'POOL',
                label: 'Pool & Save',
                body: `Joins ${poolDay === 'today' ? 'today’s' : 'tomorrow’s'} pool, which closes at ${formatClock(poolCloseTime)}. You keep half of any saving.`,
                disabled: false,
              },
            ] as const
          ).map((opt) => {
            const selected =
              opt.value === 'DIRECT'
                ? directCount > 0 && (canBuyDirectAll ? poolCount === 0 : mode === 'DIRECT')
                : directCount === 0;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={opt.disabled}
                onClick={() => {
                  setMode(opt.value);
                  setItemModeOverrides({});
                }}
                className={`flex items-start gap-2.5 rounded-lg border p-3 text-left text-sm transition-[border-color,background-color,scale] duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-ring active:not-disabled:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
                  selected ? 'border-brand bg-info-soft' : 'border-input enabled:hover:border-brand'
                }`}
              >
                <RadioDot selected={selected} className="mt-0.5" />
                <span>
                  <span className="block font-semibold text-ink">{opt.label}</span>
                  <span className="block text-pretty text-xs text-slate">{opt.body}</span>
                  {selected && opt.value === 'POOL' && (
                    <span className="mt-1 block text-pretty text-xs text-slate">{checkoutFallbackText(noSeller.length === 0)}</span>
                  )}
                  {opt.disabled && opt.value === 'DIRECT' && (
                    <span className="mt-1 block text-pretty text-xs text-warning-text">
                      Pick a seller offer on any material page to use Buy Direct. Missing: {noSellerText}.
                    </span>
                  )}
                  {!opt.disabled && opt.value === 'DIRECT' && directCount > 0 && poolCount > 0 && (
                    <span className="mt-1 block text-pretty text-xs text-brand">
                      {directCount} direct · {poolCount} pooled (you can toggle each item on the left).
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
                className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-left text-sm transition-[border-color,background-color,scale] duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-ring active:not-disabled:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
                  selected ? 'border-brand bg-info-soft' : 'border-input enabled:hover:border-brand'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <RadioDot selected={selected} />
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
        <div className="mb-5 flex flex-col gap-2">
          {PAYMENT_OPTIONS.map(({ method, label, icon: Icon }) => {
            const selected = paymentMethod === method;
            return (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={`flex items-center gap-2.5 rounded-lg border p-3 text-left text-sm transition-[border-color,background-color,scale] duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-ring active:not-disabled:scale-[0.98] ${
                  selected ? 'border-brand bg-info-soft' : 'border-input hover:border-brand'
                }`}
              >
                <RadioDot selected={selected} />
                <Icon className="size-4 shrink-0 text-slate" />
                <span className="font-semibold text-ink">{label}</span>
              </button>
            );
          })}
        </div>

        {availableSavingsCredit > 0 && (
          <div className="mb-5">
            <h2 className="mb-3 text-label text-muted-foreground uppercase">Savings credit</h2>
            <label
              className={`flex cursor-pointer items-start justify-between gap-3 rounded-lg border p-3 text-sm transition-colors ${
                applySavingsCredit ? 'border-brand bg-info-soft' : 'border-input hover:border-brand'
              }`}
            >
              <span className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={applySavingsCredit}
                  onChange={(e) => setApplySavingsCredit(e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 accent-brand"
                />
                <span>
                  <span className="flex items-center gap-1.5 font-semibold text-ink">
                    <WalletIcon className="size-4 text-brand" />
                    Apply savings credit
                  </span>
                  <span className="block text-xs text-slate">
                    Available balance: {formatNaira(availableSavingsCredit)}
                  </span>
                </span>
              </span>
              <span className="font-bold tabular-nums text-success">
                −{formatNaira(Math.min(availableSavingsCredit, grossTotal))}
              </span>
            </label>
          </div>
        )}

        <p className="mb-5 flex items-center gap-2 text-xs text-slate">
          <LockKeyIcon className="size-4 shrink-0" />
          Suppliers are paid only after we receive your goods.
        </p>

        <div className="flex flex-col gap-1.5 border-t border-border pt-4 text-sm">
          <div className="flex justify-between text-slate">
            <span>Materials subtotal</span>
            <AnimatedNaira value={subtotal} className="font-bold text-ink" />
          </div>
          <div className="flex justify-between text-slate">
            <span>{fulfillmentMethod === 'DELIVERY' ? 'Delivery' : 'Pickup'}</span>
            {deliveryCost === 0 ? <span className="font-bold text-ink">Free</span> : <AnimatedNaira value={deliveryCost} className="font-bold text-ink" />}
          </div>
          {savingsDiscount > 0 && (
            <div className="flex justify-between text-success">
              <span>Savings credit applied</span>
              <span className="font-bold tabular-nums">−{formatNaira(savingsDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-2.5 text-base font-bold text-ink">
            <span>Order total</span>
            <AnimatedNaira value={total} />
          </div>
        </div>

        <Button
          type="submit"
          variant="cta"
          size="lg"
          className="mt-5 w-full"
          disabled={state.status === 'submitting' || missing !== null}
        >
          {state.status === 'submitting'
            ? total > 0
              ? 'Opening secure payment…'
              : 'Placing order…'
            : total > 0
              ? <>Pay <AnimatedNaira value={total} /> securely</>
              : 'Place order with savings credit'}
        </Button>
        {missing && (
          <p className="mt-2 text-center text-caption text-slate" role="status">
            {missing === AREA_MISSING ? missing : `Add ${missing} to continue.`}
          </p>
        )}
      </div>
    </form>
  );
}
