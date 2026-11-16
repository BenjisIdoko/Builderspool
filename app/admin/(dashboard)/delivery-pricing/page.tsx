import { CheckCircleIcon, CircleIcon } from '@phosphor-icons/react/ssr';
import { prisma } from '@/lib/prisma';
import { getSettings } from '@/lib/settings';
import { getDeliveryReadiness } from '@/lib/delivery/readiness';
import { Button } from '@/components/ui/button';
import { ActionForm } from '@/components/ui/action-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveMaterialWeightAction, saveVehicleClassAction } from './actions';

export const metadata = { title: 'Delivery pricing' };

export default async function AdminDeliveryPricingPage() {
  const [readiness, settings, vehicles, materials] = await Promise.all([
    getDeliveryReadiness(),
    getSettings(),
    prisma.vehicleClass.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.material.findMany({
      where: { needsPriceReview: false, retired: false },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, category: true, unit: true, unitWeightKg: true, longestSideM: true, weightConfirmedAt: true },
    }),
  ]);
  const live = Boolean(settings['delivery.distancePricingEnabled']);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20">
      <div className="mb-1 text-xs text-muted-foreground">Admin · logistics &amp; settlement</div>
      <h1 className="mb-1 text-heading-lg text-ink">Delivery pricing</h1>
      <p className="mb-6 max-w-3xl text-pretty text-sm text-muted-foreground">
        The delivery fee is worked out from what is ordered. We add up the weight, choose the smallest vehicle that can carry it, and charge the
        base fare plus that vehicle&apos;s rate for each kilometre from the nearest fulfilment centre. A load too big for one truck is split
        into trips, and each trip pays the base fare.
      </p>

      <section aria-labelledby="ready-heading" className="mb-8 max-w-3xl rounded-card bg-card-alt p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="ready-heading" className="text-heading-sm text-ink">
            Before it can go live
          </h2>
          <span className={`text-sm font-medium ${live ? 'text-success' : 'text-muted-foreground'}`}>
            {live ? 'Live: buyers are quoted by distance' : 'Off: checkout still uses the zone or region fee'}
          </span>
        </div>
        <ul className="space-y-2">
          {readiness.checks.map((c) => (
            <li key={c.id} className="flex items-start gap-2 text-sm">
              {c.ready ? <CheckCircleIcon aria-hidden weight="fill" className="mt-0.5 size-4 shrink-0 text-success" /> : <CircleIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
              <span className="min-w-0 text-pretty">
                <span className="font-medium text-ink">{c.label}.</span> <span className="text-muted-foreground">{c.detail}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-pretty text-caption text-muted-foreground">
          Base fare is ₦{Number(settings['delivery.baseFare']).toLocaleString('en-NG')} and fees round up to the next ₦{Number(settings['delivery.roundTo'])}. Change
          those, and switch pricing on, in Settings once every check above is ticked. Centre map positions are set on the Pickup stations page.
        </p>
      </section>

      <section aria-labelledby="vehicles-heading" className="mb-8 rounded-card bg-card-alt p-5 sm:p-6">
        <h2 id="vehicles-heading" className="mb-1 text-heading-sm text-ink">
          Vehicle classes
        </h2>
        <p className="mb-4 max-w-3xl text-pretty text-sm text-muted-foreground">
          Each class carries up to its maximum load and its longest item. Leave the rate empty and the class is never used. Rates are in naira per
          kilometre.
        </p>
        <div className="space-y-4">
          {vehicles.map((v) => (
            <ActionForm key={v.id} action={saveVehicleClassAction} successMessage="Saved." className="rounded-lg bg-background p-4">
              <input type="hidden" name="id" value={v.id} />
              <div className="mb-3 text-sm font-medium text-ink">{v.name}</div>
              <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto_auto]">
                <div className="space-y-1.5">
                  <Label htmlFor={`kg-${v.id}`}>Maximum load (kg)</Label>
                  <Input id={`kg-${v.id}`} name="maxLoadKg" inputMode="numeric" required defaultValue={v.maxLoadKg} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`len-${v.id}`}>Longest item (m)</Label>
                  <Input id={`len-${v.id}`} name="maxLengthM" inputMode="decimal" defaultValue={v.maxLengthM?.toString() ?? ''} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`rate-${v.id}`}>Rate per km (₦)</Label>
                  <Input id={`rate-${v.id}`} name="ratePerKm" inputMode="decimal" placeholder="Not set" defaultValue={v.ratePerKm?.toString() ?? ''} />
                </div>
                <label className="flex min-h-11 items-center gap-2 text-sm">
                  <input type="checkbox" name="active" defaultChecked={v.active} className="size-4" />
                  In use
                </label>
                <Button type="submit" className="max-sm:h-11">
                  Save
                </Button>
              </div>
            </ActionForm>
          ))}
        </div>
      </section>

      <section aria-labelledby="weights-heading" className="rounded-card bg-card-alt p-5 sm:p-6">
        <h2 id="weights-heading" className="mb-1 text-heading-sm text-ink">
          Item weights
        </h2>
        <p className="mb-4 max-w-3xl text-pretty text-sm text-muted-foreground">
          What one unit weighs, as sold, and the longest side of one unit. A weight counts only after you tick confirmed, so an estimate never sets a
          fee. An item with no confirmed weight sends that order back to the zone or region fee.
        </p>
        <div className="space-y-3">
          {materials.map((m) => (
            <ActionForm key={m.id} action={saveMaterialWeightAction} successMessage="Saved." className="rounded-lg bg-background p-4">
              <input type="hidden" name="id" value={m.id} />
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3">
                <div className="min-w-0 text-sm font-medium text-ink">{m.name}</div>
                <div className="text-caption text-muted-foreground">
                  {m.category} · sold per {m.unit}
                </div>
              </div>
              <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto]">
                <div className="space-y-1.5">
                  <Label htmlFor={`w-${m.id}`}>Weight per unit (kg)</Label>
                  <Input id={`w-${m.id}`} name="unitWeightKg" inputMode="decimal" placeholder="Not set" defaultValue={m.unitWeightKg?.toString() ?? ''} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`l-${m.id}`}>Longest side (m)</Label>
                  <Input id={`l-${m.id}`} name="longestSideM" inputMode="decimal" placeholder="Optional" defaultValue={m.longestSideM?.toString() ?? ''} />
                </div>
                <label className="flex min-h-11 items-center gap-2 text-sm">
                  <input type="checkbox" name="confirmed" defaultChecked={Boolean(m.weightConfirmedAt)} className="size-4" />
                  Confirmed
                </label>
                <Button type="submit" variant="outline" className="max-sm:h-11">
                  Save
                </Button>
              </div>
            </ActionForm>
          ))}
        </div>
      </section>
    </div>
  );
}
