'use client';

import { useState } from 'react';
import { setPickupCenterAction } from '@/app/(shop)/account/actions';
import { PickupStationList } from '@/components/pickup-station-list';
import { Button } from '@/components/ui/button';
import { ActionForm } from '@/components/ui/action-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { regionLabel, type PickupCenter } from '@/lib/queries/pickupCenters';

// The buyer's saved pickup station, chosen from the stations we run. A region
// filter appears only when stations exist in more than one region.
export function PickupStationPicker({ centers, savedId }: { centers: PickupCenter[]; savedId: string | null }) {
  const regions = [...new Set(centers.map((c) => c.region))];
  const saved = centers.find((c) => c.id === savedId) ?? null;
  const [region, setRegion] = useState(saved?.region ?? regions[0] ?? '');
  const [choice, setChoice] = useState(saved?.id ?? '');
  const visible = centers.filter((c) => c.region === region);

  if (centers.length === 0) {
    return <p className="text-sm text-muted-foreground">No pickup stations are open yet. We&apos;ll list them here as soon as they are.</p>;
  }

  return (
    <div className="space-y-4">
      {regions.length > 1 && (
        <div className="max-w-xs space-y-1.5">
          <span id="pickup-region-label" className="text-sm font-medium text-ink">
            Region
          </span>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger aria-labelledby="pickup-region-label" className="h-11 w-full">
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

      <ActionForm action={setPickupCenterAction} successMessage="Saved. Pickup orders will default to this station.">
        <div className="space-y-4">
          <input type="hidden" name="centerId" value={choice} />
          <PickupStationList centers={visible} value={choice} onChange={setChoice} label="Pickup station" />
          <Button type="submit" disabled={!choice || choice === savedId} className="max-sm:h-11">
            Save pickup station
          </Button>
        </div>
      </ActionForm>

      {saved && (
        <ActionForm action={setPickupCenterAction} className="flex flex-wrap items-center gap-3" successMessage="Cleared. We'll use the default station for your region.">
          <input type="hidden" name="centerId" value="" />
          <Button type="submit" variant="ghost" size="sm" className="-ml-2 max-sm:h-11">
            Clear my saved station
          </Button>
        </ActionForm>
      )}
    </div>
  );
}
