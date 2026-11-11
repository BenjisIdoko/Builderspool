'use client';

import { useRef, useState, useTransition } from 'react';
import { addLocalityAction, addZoneAction, setLocalityZoneAction, setZoneFeeAction } from '@/app/admin/(dashboard)/areas/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Result = { error: string } | { ok: true };

function useAction(action: (fd: FormData) => Promise<Result>) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: 'error' | 'ok'; text: string } | null>(null);
  function run(form: HTMLFormElement, okText: string, reset = false) {
    setMessage(null);
    const fd = new FormData(form);
    startTransition(async () => {
      const r = await action(fd);
      if ('error' in r) setMessage({ tone: 'error', text: r.error });
      else {
        setMessage({ tone: 'ok', text: okText });
        if (reset) form.reset();
      }
    });
  }
  return { isPending, message, run };
}

function Message({ message }: { message: { tone: 'error' | 'ok'; text: string } | null }) {
  if (!message) return null;
  return (
    <span className={`text-caption ${message.tone === 'error' ? 'text-danger' : 'text-success'}`} role="status">
      {message.text}
    </span>
  );
}

// One zone's delivery fee. Blank = no fee set, so the zone offers pickup only.
export function ZoneFeeForm({ zoneId, fee }: { zoneId: string; fee: number | null }) {
  const { isPending, message, run } = useAction(setZoneFeeAction);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(e.currentTarget, 'Saved');
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="zoneId" value={zoneId} />
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-sans text-body-sm text-muted-foreground">₦</span>
        <Input
          name="fee"
          inputMode="numeric"
          defaultValue={fee ?? ''}
          placeholder="No fee"
          aria-label="Delivery fee in naira"
          className="h-9 w-32 pl-7 font-mono text-figure tabular-nums"
        />
      </div>
      <Button type="submit" size="sm" variant="outline" disabled={isPending}>
        {isPending ? 'Saving…' : 'Save'}
      </Button>
      <Message message={message} />
    </form>
  );
}

export function AddZoneForm() {
  const { isPending, message, run } = useAction(addZoneAction);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(e.currentTarget, 'Zone added. Set its fee and assign localities below.', true);
      }}
      className="flex flex-wrap items-end gap-3"
    >
      <div className="min-w-60 flex-1">
        <Label htmlFor="zone-name" className="mb-1.5 text-body-sm font-medium text-ink">
          New zone
        </Label>
        <Input id="zone-name" name="name" required placeholder="e.g. AMAC – City Centre" autoComplete="off" />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Adding…' : 'Add zone'}
      </Button>
      <Message message={message} />
    </form>
  );
}

export function LocalityZoneForm({
  localityId,
  zoneId,
  zones,
}: {
  localityId: string;
  zoneId: string | null;
  zones: { id: string; name: string; active: boolean }[];
}) {
  const { isPending, message, run } = useAction(setLocalityZoneAction);
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        run(e.currentTarget, 'Saved');
      }}
      className="flex flex-wrap items-center justify-end gap-2"
    >
      <input type="hidden" name="localityId" value={localityId} />
      <select
        name="zoneId"
        defaultValue={zoneId ?? ''}
        aria-label="Delivery zone"
        className="h-9 max-w-64 min-w-0 rounded-md border border-input bg-surface px-2 text-body-sm no-zoom text-ink"
        onChange={() => formRef.current?.requestSubmit()}
        disabled={isPending}
      >
        <option value="">No zone (pickup only)</option>
        {zones.map((z) => (
          <option key={z.id} value={z.id}>
            {z.name}
            {z.active ? '' : ' (inactive)'}
          </option>
        ))}
      </select>
      <Message message={message} />
    </form>
  );
}

export function AddLocalityForm({ lgas }: { lgas: { id: string; name: string }[] }) {
  const { isPending, message, run } = useAction(addLocalityAction);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(e.currentTarget, 'Locality added (no zone yet).', true);
      }}
      className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end"
    >
      <div>
        <Label htmlFor="loc-lga" className="mb-1.5 text-body-sm font-medium text-ink">
          Area Council
        </Label>
        <select id="loc-lga" name="lgaId" required className="h-11 w-full rounded-md border border-input bg-surface px-3 text-body no-zoom text-ink">
          {lgas.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="loc-name" className="mb-1.5 text-body-sm font-medium text-ink">
          Locality
        </Label>
        <Input id="loc-name" name="name" required autoComplete="off" placeholder="e.g. Katampe" />
      </div>
      <div>
        <Label htmlFor="loc-kind" className="mb-1.5 text-body-sm font-medium text-ink">
          Type
        </Label>
        <select id="loc-kind" name="kind" defaultValue="DISTRICT" className="h-11 w-full rounded-md border border-input bg-surface px-3 text-body no-zoom text-ink">
          <option value="DISTRICT">District</option>
          <option value="TOWN">Town</option>
          <option value="CITY">City</option>
        </select>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Adding…' : 'Add locality'}
      </Button>
      <div className="sm:col-span-4">
        <Message message={message} />
      </div>
    </form>
  );
}
