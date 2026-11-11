'use client';

import { useRef, useState, useTransition } from 'react';
import { flushSync } from 'react-dom';
import { addLocalityAction, addZoneAction, setLocalityZoneAction, setZoneFeeAction } from '@/app/admin/(dashboard)/areas/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  // '' means no zone, but a Select item cannot have an empty value, so 'none' stands in for it.
  const [zone, setZone] = useState(zoneId ?? 'none');
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
      <input type="hidden" name="zoneId" value={zone === 'none' ? '' : zone} />
      <Select
        value={zone}
        onValueChange={(next) => {
          // Update first, so the hidden field holds the new zone when the form is submitted.
          flushSync(() => setZone(next));
          formRef.current?.requestSubmit();
        }}
        disabled={isPending}
      >
        <SelectTrigger aria-label="Delivery zone" className="max-w-64 min-w-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No zone (pickup only)</SelectItem>
          {zones.map((z) => (
            <SelectItem key={z.id} value={z.id}>
              {z.name}
              {z.active ? '' : ' (inactive)'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
        <Select name="lgaId" required>
          <SelectTrigger id="loc-lga" className="h-11 w-full">
            <SelectValue placeholder="Choose an area council" />
          </SelectTrigger>
          <SelectContent>
            {lgas.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <Select name="kind" defaultValue="DISTRICT">
          <SelectTrigger id="loc-kind" className="h-11 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DISTRICT">District</SelectItem>
            <SelectItem value="TOWN">Town</SelectItem>
            <SelectItem value="CITY">City</SelectItem>
          </SelectContent>
        </Select>
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
