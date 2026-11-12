'use client';

import { useState } from 'react';
import { MapPinIcon, PlusIcon } from '@phosphor-icons/react/ssr';
import { addSavedStationAction, removeSavedStationAction, setDefaultStationAction } from '@/app/(shop)/account/addresses/actions';
import { EmptyState } from '@/components/empty-state/empty-state';
import { EmptyListIllustration } from '@/components/empty-state/illustrations';
import { PickupStationList } from '@/components/pickup-station-list';
import { ActionForm } from '@/components/ui/action-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { viewOnMapUrl } from '@/lib/maps';
import { regionLabel, type PickupCenter } from '@/lib/queries/pickupCenters';

// Stations we run that the buyer has not saved yet, to choose one from.
function AddStationDialog({ available, children }: { available: PickupCenter[]; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const regions = [...new Set(available.map((c) => c.region))];
  const [region, setRegion] = useState(regions[0] ?? '');
  const [choice, setChoice] = useState('');
  const visible = available.filter((c) => c.region === (regions.includes(region) ? region : regions[0]));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a pickup station</DialogTitle>
          <DialogDescription className="text-pretty">Choose a station to save. You can collect orders from any station you save.</DialogDescription>
        </DialogHeader>
        {available.length === 0 ? (
          <p className="text-sm text-muted-foreground">You&apos;ve saved every pickup station we have. We&apos;ll list new ones here.</p>
        ) : (
          <ActionForm action={addSavedStationAction} onSuccess={() => { setOpen(false); setChoice(''); }}>
            <div className="max-h-[60vh] w-full space-y-4 overflow-y-auto">
              <input type="hidden" name="centerId" value={choice} />
              {regions.length > 1 && (
                <div className="max-w-xs space-y-1.5">
                  <span id="add-station-region" className="text-sm font-medium text-ink">
                    Region
                  </span>
                  <Select value={region} onValueChange={(r) => { setRegion(r); setChoice(''); }}>
                    <SelectTrigger aria-labelledby="add-station-region" className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((r) => (
                        <SelectItem key={r} value={r}>
                          {regionLabel(r)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <PickupStationList centers={visible} value={choice} onChange={setChoice} label="Pickup stations you can add" />
              <Button type="submit" disabled={!choice}>
                Save station
              </Button>
            </div>
          </ActionForm>
        )}
      </DialogContent>
    </Dialog>
  );
}

// The buyer's saved pickup stations, with one default that checkout uses.
export function SavedStations({ saved, available, defaultId }: { saved: PickupCenter[]; available: PickupCenter[]; defaultId: string | null }) {
  const addButton = (
    <Button type="button" className="max-sm:h-11">
      <PlusIcon aria-hidden className="size-4" />
      Add pickup station
    </Button>
  );

  if (saved.length === 0) {
    return (
      <EmptyState
        illustration={EmptyListIllustration}
        variant="inline"
        as="p"
        title="No saved pickup stations"
        description="Save the stations you collect from. Checkout uses your default one."
      >
        <AddStationDialog available={available}>{addButton}</AddStationDialog>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[60ch] text-pretty text-sm text-muted-foreground">Checkout uses your default station. You can pick another for a single order.</p>
        <AddStationDialog available={available}>{addButton}</AddStationDialog>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {saved.map((c) => {
          const isDefault = c.id === defaultId;
          return (
            <li key={c.id} className="flex flex-col rounded-card bg-surface p-4 shadow-[0_0_0_1px_var(--color-hairline)]">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-pretty text-sm font-semibold text-ink">{c.name}</h3>
                {isDefault && <Badge variant="success">Default</Badge>}
              </div>
              <p className="mt-1 flex items-start gap-1.5 text-pretty text-sm text-muted-foreground">
                <MapPinIcon aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                {c.address}
              </p>
              <a
                href={viewOnMapUrl(c.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex min-h-11 w-fit items-center rounded-sm text-sm font-medium text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                View on map
              </a>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-2">
                {isDefault ? (
                  <span className="text-sm text-muted-foreground">Your default</span>
                ) : (
                  <ActionForm action={setDefaultStationAction}>
                    <input type="hidden" name="centerId" value={c.id} />
                    <Button type="submit" variant="ghost" size="sm" className="-ml-2 max-sm:h-11">
                      Set as default
                    </Button>
                  </ActionForm>
                )}
                <ActionForm
                  action={removeSavedStationAction}
                  confirm={{
                    title: `Remove ${c.name}?`,
                    description: isDefault ? 'It’s your default, so your next saved station becomes the default. You can save it again later.' : 'You can save it again later.',
                    confirmLabel: 'Remove station',
                    destructive: true,
                  }}
                >
                  <input type="hidden" name="centerId" value={c.id} />
                  <Button type="submit" variant="ghost" size="sm" className="max-sm:h-11">
                    Remove
                  </Button>
                </ActionForm>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
