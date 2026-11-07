import { ClipboardTextIcon, GavelIcon, StackIcon } from '@phosphor-icons/react/ssr';
import { getAdminSheets } from '@/lib/queries/sheets';
import { getSetting } from '@/lib/settings';
import { KpiCard } from '@/components/kpi-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { decideCategoryAction } from './actions';

export const metadata = { title: 'Pool sheets' };

const STATUS = {
  OPEN: { label: 'Collecting orders', variant: 'outline' },
  BIDDING: { label: 'Open for bids', variant: 'pool' },
  AWARDING: { label: 'Bids closed', variant: 'warning' },
  AWARDED: { label: 'Awarded', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'danger' },
} as const;

const when = (d: Date) => d.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Lagos' });

export default async function AdminSheetsPage() {
  const [{ requests, sheets }, engineOn] = await Promise.all([getAdminSheets(), getSetting<boolean>('sheets.enabled')]);
  const open = sheets.filter((s) => s.status === 'OPEN' || s.status === 'BIDDING').length;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20">
      <div className="mb-1 text-xs text-muted-foreground">Admin · pooling</div>
      <h1 className="mb-1 text-heading-lg text-ink">Pool sheets</h1>
      <p className="mb-6 max-w-3xl text-sm text-muted-foreground">
        A sheet is one category in one delivery zone for one day. Paid pool orders join it until the pool closes, then its reference prices are fixed and
        registered vendors price every item. The engine is {engineOn ? 'on' : 'off'}; switch it in Settings.
      </p>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <KpiCard size="compact" label="Engine" value={engineOn ? 'On' : 'Off'} icon={GavelIcon} tone={engineOn ? 'success' : 'neutral'} chip="" />
        <KpiCard size="compact" label="Sheets collecting or bidding" value={String(open)} icon={StackIcon} tone="neutral" chip="" />
        <KpiCard size="compact" label="Category requests" value={String(requests.length)} icon={ClipboardTextIcon} tone={requests.length > 0 ? 'warning' : 'neutral'} chip="" />
      </div>

      <section className="mb-8 rounded-card bg-card-alt p-5">
        <h2 className="mb-1 text-heading-md text-ink">Vendor category requests</h2>
        <p className="mb-4 text-sm text-muted-foreground">A vendor receives a category&apos;s sheets only after you approve it, and also needs approved coverage of the zone.</p>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No requests waiting.</p>
        ) : (
          <ul className="divide-y divide-hairline">
            {requests.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="text-body text-ink">
                  <span className="font-medium">{r.sellerName}</span> wants to bid for {r.category}
                </span>
                <span className="flex gap-2">
                  {(['approve', 'decline'] as const).map((decision) => (
                    <form key={decision} action={decideCategoryAction}>
                      <input type="hidden" name="categoryId" value={r.id} />
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

      <section className="rounded-card bg-card-alt p-5">
        <h2 className="mb-4 text-heading-md text-ink">Recent sheets</h2>
        {sheets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sheets yet. They appear once the engine is on and a pool order is paid.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Bids</TableHead>
                <TableHead>Bids close</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sheets.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium text-ink">{s.category}</TableCell>
                  <TableCell>{s.zoneName}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={STATUS[s.status].variant}>{STATUS[s.status].label}</Badge>
                      {s.noReference > 0 && <Badge variant="warning">{s.noReference} without reference</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{s.lineCount}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {s.bidCount}
                    {s.status !== 'OPEN' && s.status !== 'BIDDING' && <span className="text-slate"> ({s.eligibleCount} eligible)</span>}
                  </TableCell>
                  <TableCell>{when(s.bidsCloseAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
