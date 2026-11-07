'use client';

import { useState, useTransition } from 'react';
import { requestDeliveryAction } from '@/app/(shop)/checkout/actions';
import type { CheckoutAreas, CheckoutLocality } from '@/lib/queries/checkoutAreas';
import { formatNaira } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function findLocality(areas: CheckoutAreas, id: string): CheckoutLocality | null {
  for (const lga of areas.lgas) {
    const hit = lga.localities.find((l) => l.id === id);
    if (hit) return hit;
  }
  return null;
}

// Where the buyer is. Picking a locality sets their delivery zone (the pool key)
// and shows what that zone offers: how many sellers deliver there and the fee.
// A locality with no zone, or a zone with no fee, says so plainly and lets the
// buyer leave a phone number to ask for delivery.
export function CheckoutLocalityPicker({
  areas,
  value,
  onChange,
  defaultPhone,
}: {
  areas: CheckoutAreas;
  value: string;
  onChange: (localityId: string) => void;
  defaultPhone: string;
}) {
  const selected = value ? findLocality(areas, value) : null;
  const zone = selected?.zone ?? null;

  return (
    <div className="max-w-md space-y-3">
      <div>
        <Label htmlFor="locality" className="sr-only">
          Your area
        </Label>
        <select
          id="locality"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full rounded-md border border-input-border bg-surface px-3 text-body text-ink"
        >
          <option value="">Choose your area</option>
          {areas.lgas.map((lga) => (
            <optgroup key={lga.id} label={lga.name}>
              {lga.localities.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {selected && zone && (
        <p className="rounded-md bg-pale-blue px-4 py-3 text-body-sm text-ink" role="status">
          <span className="font-semibold">{zone.name}</span>
          <br />
          <span className="font-mono text-figure tabular-nums">{zone.sellerCount}</span>{' '}
          {zone.sellerCount === 1 ? 'seller delivers' : 'sellers deliver'} here.{' '}
          {zone.fee === null ? 'Delivery is not available here yet; pickup only.' : `Delivery to site: ${formatNaira(zone.fee)}.`}
        </p>
      )}

      {selected && (!zone || zone.fee === null) && <RequestDelivery localityId={selected.id} localityName={selected.name} noZone={!zone} defaultPhone={defaultPhone} />}
    </div>
  );
}

function RequestDelivery({ localityId, localityName, noZone, defaultPhone }: { localityId: string; localityName: string; noZone: boolean; defaultPhone: string }) {
  const [phone, setPhone] = useState(defaultPhone);
  const [message, setMessage] = useState<{ tone: 'error' | 'ok'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function send() {
    setMessage(null);
    startTransition(async () => {
      const r = await requestDeliveryAction(localityId, phone);
      setMessage('error' in r ? { tone: 'error', text: r.error } : { tone: 'ok', text: 'Thanks. We will contact you when we deliver to this area.' });
    });
  }

  return (
    <div className="space-y-2 rounded-md bg-card-alt px-4 py-3">
      {noZone && <p className="text-body-sm text-ink">We do not deliver to {localityName} yet, so we cannot take this order.</p>}
      <p className="text-body-sm text-slate">Want delivery to {localityName}? Leave your number and we will tell you when it starts.</p>
      <div className="flex flex-wrap items-center gap-2">
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" aria-label="Phone number" placeholder="0803 123 4567" className="h-9 w-48" />
        <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={send}>
          {isPending ? 'Sending…' : 'Tell us'}
        </Button>
      </div>
      {message && (
        <p className={`text-caption ${message.tone === 'error' ? 'text-danger' : 'text-success'}`} role="status">
          {message.text}
        </p>
      )}
    </div>
  );
}
