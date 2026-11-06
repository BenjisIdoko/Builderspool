import { CheckCircleIcon, MapPinIcon, TruckIcon, WarningIcon } from '@phosphor-icons/react/ssr';
import { getAreasOverview } from '@/lib/queries/areas';
import { KpiCard } from '@/components/kpi-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddLocalityForm, AddZoneForm, LocalityZoneForm, ZoneFeeForm } from '@/components/admin/areas-forms';
import { decideCoverageAction, setNationalSupplyAction, setZoneActiveAction } from './actions';

export const metadata = { title: 'Service areas' };

export default async function AdminAreasPage() {
  const { zones, lgas, requests, sellers } = await getAreasOverview();

  const deliverable = zones.filter((z) => z.active && z.deliveryFee !== null).length;
  const allLocalities = lgas.flatMap((l) => l.localities);
  const unzoned = allLocalities.filter((l) => !l.zoneId).length;
  const zoneOptions = zones.map((z) => ({ id: z.id, name: z.name, active: z.active }));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20">
      <div className="mb-1 text-xs text-muted-foreground">Admin · logistics &amp; settlement</div>
      <h1 className="mb-1 text-heading-lg text-ink">Service areas</h1>
      <p className="mb-6 max-w-3xl text-sm text-muted-foreground">
        Area Councils contain localities; localities belong to at most one delivery zone. The zone decides pooling, the
        delivery fee and which sellers can supply. A zone with no fee offers pickup only. Moving a locality never changes
        existing orders or open pools.
      </p>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard size="compact" label="Zones with delivery on" value={`${deliverable} of ${zones.length}`} icon={TruckIcon} tone={deliverable > 0 ? 'success' : 'warning'} chip="" />
        <KpiCard size="compact" label="Localities" value={String(allLocalities.length)} icon={MapPinIcon} tone="neutral" chip="" />
        <KpiCard size="compact" label="Localities with no zone" value={String(unzoned)} icon={WarningIcon} tone={unzoned > 0 ? 'warning' : 'success'} chip="" />
        <KpiCard size="compact" label="Coverage requests" value={String(requests.length)} icon={CheckCircleIcon} tone={requests.length > 0 ? 'warning' : 'neutral'} chip="" />
      </div>

      <section className="mb-8 rounded-card bg-card-alt p-5">
        <h2 className="mb-4 text-heading-md text-ink">Delivery zones</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zone</TableHead>
              <TableHead className="text-right">Localities</TableHead>
              <TableHead className="text-right">Sellers</TableHead>
              <TableHead>Delivery fee</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zones.map((z) => (
              <TableRow key={z.id}>
                <TableCell className="font-medium text-ink">{z.name}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{z.localityCount}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{z.approvedSellerCount}</TableCell>
                <TableCell>
                  <ZoneFeeForm zoneId={z.id} fee={z.deliveryFee} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {!z.active ? (
                      <Badge variant="outline">Inactive</Badge>
                    ) : z.deliveryFee === null ? (
                      <Badge variant="warning">Pickup only (no fee)</Badge>
                    ) : (
                      <Badge variant="success">Delivery on</Badge>
                    )}
                    <form action={setZoneActiveAction}>
                      <input type="hidden" name="zoneId" value={z.id} />
                      <input type="hidden" name="active" value={String(!z.active)} />
                      <Button type="submit" size="sm" variant="ghost">
                        {z.active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </form>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-5 border-t border-hairline pt-5">
          <AddZoneForm />
        </div>
      </section>

      <section className="mb-8 rounded-card bg-card-alt p-5">
        <h2 className="mb-1 text-heading-md text-ink">Seller coverage requests</h2>
        <p className="mb-4 text-sm text-muted-foreground">A seller can bid in a zone only after you approve their coverage of it.</p>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No requests waiting.</p>
        ) : (
          <ul className="divide-y divide-hairline">
            {requests.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="text-body text-ink">
                  <span className="font-medium">{r.sellerName}</span> wants to cover {r.zoneName}
                </span>
                <span className="flex gap-2">
                  {(['approve', 'decline'] as const).map((decision) => (
                    <form key={decision} action={decideCoverageAction}>
                      <input type="hidden" name="coverageId" value={r.id} />
                      <input type="hidden" name="decision" value={decision} />
                      <Button type="submit" size="sm" variant={decision === 'approve' ? 'default' : 'outline'}>
                        {decision === 'approve' ? 'Approve' : 'Decline'}
                      </Button>
                    </form>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-8 rounded-card bg-card-alt p-5">
        <h2 className="mb-1 text-heading-md text-ink">Sellers</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          &ldquo;National supply&rdquo; covers every zone (products that come from far away). Otherwise a seller covers only the zones you approved.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Seller</TableHead>
              <TableHead>Approved zones</TableHead>
              <TableHead className="text-right">National supply</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sellers.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium text-ink">{s.name}</TableCell>
                <TableCell className="whitespace-normal text-body-sm text-slate">
                  {s.nationalSupply ? 'Every zone' : s.zones.length > 0 ? s.zones.join(', ') : 'None yet'}
                </TableCell>
                <TableCell className="text-right">
                  <form action={setNationalSupplyAction} className="inline">
                    <input type="hidden" name="sellerId" value={s.id} />
                    <input type="hidden" name="national" value={String(!s.nationalSupply)} />
                    <Button type="submit" size="sm" variant={s.nationalSupply ? 'default' : 'outline'}>
                      {s.nationalSupply ? 'On' : 'Off'}
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="rounded-card bg-card-alt p-5">
        <h2 className="mb-4 text-heading-md text-ink">Localities by Area Council</h2>
        <div className="flex flex-col gap-6">
          {lgas.map((lga) => (
            <div key={lga.id}>
              <h3 className="mb-2 text-heading-sm text-ink">
                {lga.name} <span className="font-normal text-muted-foreground">· {lga.stateName}</span>
              </h3>
              <ul className="divide-y divide-hairline rounded-md bg-surface">
                {lga.localities.map((loc) => (
                  <li key={loc.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
                    <span className="text-body text-ink">
                      {loc.name}
                      <span className="ml-2 text-caption text-muted-foreground">{loc.kind.toLowerCase()}</span>
                    </span>
                    <LocalityZoneForm localityId={loc.id} zoneId={loc.zoneId} zones={zoneOptions} />
                  </li>
                ))}
                {lga.localities.length === 0 && <li className="px-4 py-3 text-sm text-muted-foreground">No localities yet.</li>}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-6 border-t border-hairline pt-5">
          <AddLocalityForm lgas={lgas.map((l) => ({ id: l.id, name: l.name }))} />
        </div>
      </section>
    </div>
  );
}
