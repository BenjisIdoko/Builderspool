import { MapPinIcon, UsersIcon, PackageIcon } from '@phosphor-icons/react/ssr';
import { prisma } from '@/lib/prisma';
import { KpiCard } from '@/components/kpi-card';
import { Button } from '@/components/ui/button';
import { ActionForm } from '@/components/ui/action-form';
import { EmptyState } from '@/components/empty-state/empty-state';
import { EmptyListIllustration } from '@/components/empty-state/illustrations';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddPickupStationForm, EditPickupStationButton } from '@/components/admin/pickup-station-form';
import { viewOnMapUrl } from '@/lib/maps';
import { regionLabel } from '@/lib/queries/pickupCenters';
import { deletePickupStationAction } from './actions';

export const metadata = { title: 'Pickup stations' };

export default async function AdminPickupStationsPage() {
  const stations = await prisma.fulfillmentCenter.findMany({
    orderBy: [{ region: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { orderItems: true, buyers: true } } },
  });
  const regions = new Set(stations.map((s) => s.region)).size;
  const savedBy = stations.reduce((sum, s) => sum + s._count.buyers, 0);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20">
      <div className="mb-1 text-xs text-muted-foreground">Admin · logistics &amp; settlement</div>
      <h1 className="mb-1 text-heading-lg text-ink">Pickup stations</h1>
      <p className="mb-6 max-w-3xl text-pretty text-sm text-muted-foreground">
        The places buyers can collect orders from. Every station shows on buyers&apos; account pages and at checkout for their region, and a
        buyer can save one as their default. A station that orders have already used can be edited but not deleted.
      </p>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard size="compact" label="Pickup stations" value={String(stations.length)} icon={MapPinIcon} tone="neutral" chip="" />
        <KpiCard size="compact" label="Regions covered" value={String(regions)} icon={PackageIcon} tone="neutral" chip="" />
        <KpiCard size="compact" label="Buyers with a saved station" value={String(savedBy)} icon={UsersIcon} tone="neutral" chip="" />
      </div>

      <section aria-labelledby="add-station-heading" className="mb-8 max-w-3xl rounded-card bg-card-alt p-5 sm:p-6">
        <h2 id="add-station-heading" className="mb-4 text-heading-sm text-ink">
          Add a pickup station
        </h2>
        <AddPickupStationForm />
      </section>

      <section aria-labelledby="stations-heading" className="overflow-hidden rounded-card bg-card-alt">
        <div className="border-b border-border px-5 py-4">
          <h2 id="stations-heading" className="text-heading-sm text-ink">
            All stations (<span className="tabular-nums">{stations.length}</span>)
          </h2>
        </div>
        {stations.length === 0 ? (
          <EmptyState illustration={EmptyListIllustration} variant="inline" as="p" title="No pickup stations yet" description="Add one above and buyers can choose it." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Station</TableHead>
                <TableHead>Region</TableHead>
                <TableHead className="text-right">Saved by</TableHead>
                <TableHead className="text-right">Order lines</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {stations.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="py-3">
                    <div className="font-medium text-ink">{s.name}</div>
                    <div className="max-w-md text-pretty text-caption text-muted-foreground">{s.address}</div>
                    <a
                      href={viewOnMapUrl(s.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-sm text-caption font-medium text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      View on map
                    </a>
                  </TableCell>
                  <TableCell className="py-3">{regionLabel(s.region)}</TableCell>
                  <TableCell className="py-3 text-right tabular-nums">{s._count.buyers}</TableCell>
                  <TableCell className="py-3 text-right tabular-nums">{s._count.orderItems}</TableCell>
                  <TableCell className="py-3">
                    <div className="flex flex-wrap items-start justify-end gap-2">
                      <EditPickupStationButton station={{ id: s.id, name: s.name, region: s.region, address: s.address }} />
                      <ActionForm
                        action={deletePickupStationAction}
                        confirm={{
                          title: `Delete ${s.name}?`,
                          description:
                            s._count.buyers > 0
                              ? `${s._count.buyers} ${s._count.buyers === 1 ? 'buyer has' : 'buyers have'} saved it and will fall back to their region’s default station. You can’t undo this.`
                              : 'Buyers will no longer see it. You can’t undo this.',
                          confirmLabel: 'Delete station',
                          destructive: true,
                        }}
                      >
                        <input type="hidden" name="id" value={s.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Delete
                        </Button>
                      </ActionForm>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
