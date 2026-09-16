import Link from 'next/link';
import { TruckIcon, MapPinIcon, PackageIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@phosphor-icons/react/ssr';
import { getDispatchesForAdmin } from '@/lib/queries/adminHaulage';
import { dispatchStatusTone, pillClass } from '@/lib/statusColors';
import { nextDispatchStatus } from '@/lib/fulfillment';
import { advanceDispatchAction, cancelDispatchAction, updateDispatchLocationAction } from './actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KpiCard } from '@/components/kpi-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { DispatchStatus } from '@prisma/client';

const DISPATCH_LABEL: Record<DispatchStatus, string> = {
  ASSIGNED: 'Assigned',
  AT_PICKUP: 'At pickup',
  IN_TRANSIT: 'In transit',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const STATUS_FILTERS = ['ASSIGNED', 'AT_PICKUP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'] as const;

export default async function AdminHaulagePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const validStatus = status && (STATUS_FILTERS as readonly string[]).includes(status) ? (status as DispatchStatus) : undefined;

  const allDispatches = await getDispatchesForAdmin();
  const dispatches = validStatus ? allDispatches.filter((d) => d.status === validStatus) : allDispatches;

  const kpiCards = [
    {
      label: 'Assigned',
      value: String(allDispatches.filter((d) => d.status === 'ASSIGNED').length),
      icon: ClockIcon,
      tone: 'warning' as const,
      chip: 'Awaiting pickup',
    },
    {
      label: 'At pickup',
      value: String(allDispatches.filter((d) => d.status === 'AT_PICKUP').length),
      icon: PackageIcon,
      tone: 'warning' as const,
      chip: 'Loading',
    },
    {
      label: 'In transit',
      value: String(allDispatches.filter((d) => d.status === 'IN_TRANSIT').length),
      icon: TruckIcon,
      tone: 'info' as const,
      chip: 'Moving',
    },
    {
      label: 'Delivered',
      value: String(allDispatches.filter((d) => d.status === 'DELIVERED').length),
      icon: CheckCircleIcon,
      tone: 'success' as const,
      chip: 'Complete',
    },
    {
      label: 'Cancelled',
      value: String(allDispatches.filter((d) => d.status === 'CANCELLED').length),
      icon: XCircleIcon,
      tone: allDispatches.some((d) => d.status === 'CANCELLED') ? ('danger' as const) : ('neutral' as const),
      chip: 'Not moving',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-1 text-xs text-muted-foreground">Admin · ops desk</div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-ink">Haulage &amp; dispatch</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Real dispatch assignment and status across every delivery order — no live GPS, so location is
        exactly what ops last physically confirmed.
      </p>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {kpiCards.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} size="compact" />
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-1">
        <Link href="/admin/haulage">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              !validStatus ? 'bg-ink text-canvas' : 'text-slate hover:bg-well hover:text-ink'
            }`}
          >
            All ({allDispatches.length})
          </span>
        </Link>
        {STATUS_FILTERS.map((s) => (
          <Link key={s} href={`/admin/haulage?status=${s}`}>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                validStatus === s ? 'bg-ink text-canvas' : 'text-slate hover:bg-well hover:text-ink'
              }`}
            >
              {DISPATCH_LABEL[s]} ({allDispatches.filter((d) => d.status === s).length})
            </span>
          </Link>
        ))}
      </div>

      {dispatches.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface px-6 py-16 text-center">
          <TruckIcon className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No dispatches match this filter.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Vehicle &amp; driver</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {dispatches.map((dispatch) => {
                const next = nextDispatchStatus(dispatch.status);
                return (
                  <TableRow key={dispatch.id}>
                    <TableCell className="py-3 text-ink">
                      <Link href={`/admin/orders/${dispatch.orderItem.orderId}`} className="font-semibold hover:underline">
                        #{dispatch.orderItem.orderId.slice(-6).toUpperCase()}
                      </Link>
                      <div className="text-xs text-muted-foreground">{dispatch.orderItem.material.name}</div>
                    </TableCell>
                    <TableCell className="py-3 text-ink">
                      {dispatch.orderItem.order.buyer.businessName ?? dispatch.orderItem.order.buyer.name}
                    </TableCell>
                    <TableCell className="py-3 text-ink">
                      {dispatch.vehicle ? (
                        <>
                          <div>
                            {dispatch.vehicle.type} · {dispatch.vehicle.plateNumber}
                          </div>
                          {dispatch.vehicle.driver && (
                            <div className="text-xs text-muted-foreground">{dispatch.vehicle.driver.name}</div>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">Not yet assigned</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      <form action={updateDispatchLocationAction} className="flex items-center gap-1.5">
                        <input type="hidden" name="dispatchId" value={dispatch.id} />
                        <MapPinIcon className="size-3.5 shrink-0 text-muted-foreground" />
                        <Input
                          name="location"
                          defaultValue={dispatch.currentLocation ?? ''}
                          placeholder="Not logged"
                          className="h-8 w-40 text-xs"
                          disabled={dispatch.status === 'CANCELLED' || dispatch.status === 'DELIVERED'}
                        />
                        {dispatch.status !== 'CANCELLED' && dispatch.status !== 'DELIVERED' && (
                          <Button type="submit" variant="outline" size="sm" className="h-8">
                            Save
                          </Button>
                        )}
                      </form>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant="outline" className={pillClass(dispatchStatusTone(dispatch.status))}>
                        {DISPATCH_LABEL[dispatch.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        {next && (
                          <form action={advanceDispatchAction}>
                            <input type="hidden" name="dispatchId" value={dispatch.id} />
                            <Button type="submit" size="sm">
                              Advance to {DISPATCH_LABEL[next]}
                            </Button>
                          </form>
                        )}
                        {dispatch.status !== 'DELIVERED' && dispatch.status !== 'CANCELLED' && (
                          <form action={cancelDispatchAction}>
                            <input type="hidden" name="dispatchId" value={dispatch.id} />
                            <Button type="submit" variant="ghost" size="sm">
                              Cancel
                            </Button>
                          </form>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
