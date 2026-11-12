'use client';

import { useState, useTransition } from 'react';
import { addPickupStationAction, updatePickupStationAction } from '@/app/admin/(dashboard)/pickup-stations/actions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STATION_REGIONS } from '@/lib/areas/region';

export type StationValues = { id: string; name: string; region: string; address: string };

const label = (region: string) => region.charAt(0) + region.slice(1).toLowerCase();

// Name, region and address of one pickup station. Used to add a station and,
// inside a dialog, to edit one. Problems appear beside the button.
function StationFields({
  idPrefix,
  values,
  submitLabel,
  action,
  resetOnSuccess,
  onSaved,
}: {
  idPrefix: string;
  values?: StationValues;
  submitLabel: string;
  action: (fd: FormData) => Promise<{ error: string } | { ok: true }>;
  resetOnSuccess?: boolean;
  onSaved?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [region, setRegion] = useState(values?.region ?? STATION_REGIONS[0]);
  const [message, setMessage] = useState<{ tone: 'error' | 'ok'; text: string } | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const r = await action(fd);
      if ('error' in r) {
        setMessage({ tone: 'error', text: r.error });
        return;
      }
      setMessage({ tone: 'ok', text: values ? 'Saved.' : 'Station added. Buyers can choose it now.' });
      if (resetOnSuccess) form.reset();
      onSaved?.();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {values && <input type="hidden" name="id" value={values.id} />}
      <input type="hidden" name="region" value={region} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-name`}>Station name</Label>
          <Input id={`${idPrefix}-name`} name="name" required minLength={3} maxLength={80} autoComplete="off" placeholder="e.g. Bwari Pickup Station" defaultValue={values?.name} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-region`}>Region</Label>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger id={`${idPrefix}-region`} className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATION_REGIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {label(r)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-address`}>Street address</Label>
        <Input id={`${idPrefix}-address`} name="address" required minLength={8} maxLength={200} autoComplete="off" placeholder="Shop or plot number, street, area, city" defaultValue={values?.address} />
        <p className="text-caption text-muted-foreground">Buyers see this and get a map link from it, so include a landmark if it helps.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isPending} aria-busy={isPending}>
          {isPending ? 'Saving…' : submitLabel}
        </Button>
        {message && (
          <span role={message.tone === 'error' ? 'alert' : 'status'} className={`min-w-0 flex-1 basis-56 text-pretty text-sm ${message.tone === 'error' ? 'text-danger' : 'text-success'}`}>
            {message.text}
          </span>
        )}
      </div>
    </form>
  );
}

export function AddPickupStationForm() {
  return <StationFields idPrefix="add-station" submitLabel="Add station" action={addPickupStationAction} resetOnSuccess />;
}

export function EditPickupStationButton({ station }: { station: StationValues }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {station.name}</DialogTitle>
          <DialogDescription className="text-pretty">Changes show on buyers&apos; account pages, at checkout and on orders already placed here.</DialogDescription>
        </DialogHeader>
        <StationFields idPrefix={`edit-${station.id}`} values={station} submitLabel="Save changes" action={updatePickupStationAction} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
