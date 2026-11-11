'use client';

import { useRef, useState, useTransition } from 'react';
import { removeListingPhotoAction, saveListingAction, setListingPausedAction } from '@/app/seller/(dashboard)/listings/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type ListingFormValues = {
  id?: string;
  materialId: string;
  price: string;
  stockQty: string;
  leadTimeDays: string;
  shelfLifeDays: string;
  status?: 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'PAUSED' | 'REJECTED';
  reasons: string[];
  reviewNote?: string | null;
  photos: { id: string; url: string; widthPx: number; heightPx: number }[];
};

export type MaterialOption = { id: string; name: string; unit: string; perishable: boolean };

const STATUS_BADGE = {
  DRAFT: { label: 'Draft', variant: 'warning' },
  PENDING_REVIEW: { label: 'Being checked', variant: 'warning' },
  ACTIVE: { label: 'Live', variant: 'success' },
  PAUSED: { label: 'Paused', variant: 'secondary' },
  REJECTED: { label: 'Needs a fix', variant: 'danger' },
} as const;

export function ListingForm({
  materials,
  values,
  reasonText,
  uploadsEnabled,
}: {
  materials: MaterialOption[];
  values: ListingFormValues | null;
  reasonText: Record<string, string>;
  uploadsEnabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: 'error' | 'ok'; text: string } | null>(null);
  const [materialId, setMaterialId] = useState(values?.materialId ?? '');
  const formRef = useRef<HTMLFormElement>(null);
  const selected = materials.find((m) => m.id === materialId);
  const badge = values?.status ? STATUS_BADGE[values.status] : null;

  function run(fn: () => Promise<{ error: string } | { ok: true; message: string }>) {
    setMessage(null);
    startTransition(async () => {
      const r = await fn();
      setMessage('error' in r ? { tone: 'error', text: r.error } : { tone: 'ok', text: r.message });
      if (!('error' in r) && !values) formRef.current?.reset();
    });
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (values) fd.set('materialId', values.materialId);
    run(() => saveListingAction(fd));
  }

  return (
    <form ref={formRef} onSubmit={submit} className="space-y-4">
      {values ? (
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-heading-sm text-ink">{selected?.name}</h3>
          {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="new-material">Product</Label>
          <select
            id="new-material"
            name="materialId"
            required
            value={materialId}
            onChange={(e) => setMaterialId(e.target.value)}
            className="h-11 w-full rounded-md border border-input-border bg-surface px-3 text-body text-ink"
          >
            <option value="">Choose a product</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.unit})
              </option>
            ))}
          </select>
        </div>
      )}

      {values?.reviewNote && (
        <p className="rounded-md bg-card-alt px-4 py-3 text-sm text-ink">
          <span className="font-medium">Note from BuildersPool:</span> {values.reviewNote}
        </p>
      )}

      {values && values.reasons.length > 0 && (
        <div
          role="group"
          aria-label={values.status === 'REJECTED' ? 'What to fix' : 'What we will check'}
          className={`rounded-md px-4 py-3 text-sm ${values.status === 'REJECTED' ? 'bg-danger-soft text-danger' : 'bg-card-alt text-ink'}`}
        >
          <div className="mb-1 font-semibold">{values.status === 'REJECTED' ? 'To go live, fix:' : 'Our team will check:'}</div>
          <ul className="list-disc space-y-0.5 pl-5">
            {values.reasons.map((r) => (
              <li key={r}>{reasonText[r] ?? r}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`price-${values?.id ?? 'new'}`}>Your price{selected ? ` per ${selected.unit}` : ''} (₦)</Label>
          <Input id={`price-${values?.id ?? 'new'}`} name="price" inputMode="decimal" required defaultValue={values?.price} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`stock-${values?.id ?? 'new'}`}>Stock on hand</Label>
          <Input id={`stock-${values?.id ?? 'new'}`} name="stockQty" inputMode="numeric" required defaultValue={values?.stockQty ?? '0'} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`lead-${values?.id ?? 'new'}`}>Lead time (days)</Label>
          <Input id={`lead-${values?.id ?? 'new'}`} name="leadTimeDays" inputMode="numeric" required defaultValue={values?.leadTimeDays ?? '1'} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`shelf-${values?.id ?? 'new'}`}>Shelf life (days){selected?.perishable ? '' : ', if it applies'}</Label>
          <Input id={`shelf-${values?.id ?? 'new'}`} name="shelfLifeDays" inputMode="numeric" required={selected?.perishable} defaultValue={values?.shelfLifeDays} />
        </div>
      </div>

      {values && values.photos.length > 0 && (
        <ul className="flex flex-wrap gap-3">
          {values.photos.map((p) => (
            <li key={p.id} className="w-28 space-y-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="aspect-square w-full rounded-md bg-well object-cover" />
              <div className="text-caption text-muted-foreground">
                {p.widthPx}×{p.heightPx}px
              </div>
              <button type="button" disabled={isPending} onClick={() => run(() => removeListingPhotoAction(p.id))} className="text-caption text-danger underline">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-1.5">
        <Label htmlFor={`photos-${values?.id ?? 'new'}`}>Photos</Label>
        {uploadsEnabled ? (
          <>
            <Input id={`photos-${values?.id ?? 'new'}`} name="photos" type="file" accept="image/jpeg,image/png" multiple />
            <p className="text-caption text-muted-foreground">JPEG or PNG, at least 1000px on the shorter side, 4 MB or smaller each.</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Photo upload is not switched on yet, so listings cannot go live. The BuildersPool team is setting it up.</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : values ? 'Save changes' : 'Add listing'}
        </Button>
        {values?.id && (values.status === 'ACTIVE' || values.status === 'PAUSED') && (
          <Button type="button" variant="outline" disabled={isPending} onClick={() => run(() => setListingPausedAction(values.id!, values.status === 'ACTIVE'))}>
            {values.status === 'ACTIVE' ? 'Pause' : 'Resume'}
          </Button>
        )}
        {message && (
          <span className={`max-w-prose text-pretty text-sm ${message.tone === 'error' ? 'text-danger' : 'text-success'}`} role={message.tone === 'error' ? 'alert' : 'status'}>
            {message.text}
          </span>
        )}
      </div>
    </form>
  );
}
