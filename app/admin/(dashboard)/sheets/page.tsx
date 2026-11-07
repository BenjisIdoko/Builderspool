import { ClipboardTextIcon, GavelIcon, StackIcon } from '@phosphor-icons/react/ssr';
import { getAdminSheetFulfilments, getAdminSheets } from '@/lib/queries/sheets';
import { getSetting } from '@/lib/settings';
import { KpiCard } from '@/components/kpi-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Money } from '@/components/money';
import { decideCategoryAction, disburseSheetPayoutAction, failSheetFulfilmentAction, holdSheetFulfilmentAction, issueSheetGrnAction } from './actions';

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
  const [{ requests, sheets }, engineOn, fulfilments] = await Promise.all([getAdminSheets(), getSetting<boolean>('sheets.enabled'), getAdminSheetFulfilments()]);
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

      <section className="mb-8 rounded-card bg-card-alt p-5">
        <h2 className="mb-1 text-heading-md text-ink">Goods to receive and vendors to pay</h2>
        <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
          Lines a vendor accepted on a sheet, at their bid price. Issue the goods received note once the fulfilment centre has received the goods and the quality
          check passed; that makes the vendor&rsquo;s payment due and credits the buyer&rsquo;s share of any saving. If a vendor never delivers a line, mark it as not
          supplied and it goes back to the seller the buyer picked, or is refunded.
        </p>
        {fulfilments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing waiting.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Owed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fulfilments.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="text-ink">
                    {f.material} <span className="text-slate">× {f.quantity.toLocaleString('en-NG')} {f.unit}</span>
                    <div className="text-caption text-slate">
                      {f.category} · {f.zone}
                      {f.center ? ` · ${f.center}` : ''}
                    </div>
                  </TableCell>
                  <TableCell>{f.vendor}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    <Money amount={f.amount} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={f.status === 'PENDING' ? 'pool' : 'success'}>{f.status === 'PENDING' ? 'Awaiting goods' : 'Received'}</Badge>
                      {f.payoutStatus === 'ON_HOLD' && <Badge variant="warning">On hold</Badge>}
                    </div>
                    {f.grnNumber && <div className="mt-1 font-mono text-caption text-slate">{f.grnNumber}</div>}
                    {f.holdReason && <div className="mt-1 text-caption text-slate">{f.holdReason}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-start gap-2">
                      {f.status === 'PENDING' && (
                        <form action={issueSheetGrnAction}>
                          <input type="hidden" name="id" value={f.id} />
                          <Button type="submit" size="sm">Issue GRN</Button>
                        </form>
                      )}
                      {f.status === 'FULFILLED' && f.payoutStatus === 'PROCESSED' && (
                        <form action={disburseSheetPayoutAction}>
                          <input type="hidden" name="id" value={f.id} />
                          <Button type="submit" size="sm" variant="outline">Pay vendor</Button>
                        </form>
                      )}
                      <form action={holdSheetFulfilmentAction} className="flex items-center gap-1.5">
                        <input type="hidden" name="id" value={f.id} />
                        {f.payoutStatus !== 'ON_HOLD' && <input name="note" placeholder="Hold reason" aria-label="Hold reason" maxLength={200} className="h-8 w-32 rounded-md border border-input bg-transparent px-2 text-caption" />}
                        <Button type="submit" size="sm" variant="ghost">{f.payoutStatus === 'ON_HOLD' ? 'Release hold' : 'Hold payout'}</Button>
                      </form>
                      {f.status === 'PENDING' && (
                        <form action={failSheetFulfilmentAction} className="flex items-center gap-1.5">
                          <input type="hidden" name="id" value={f.id} />
                          <input name="reason" required placeholder="Why not supplied?" aria-label="Why the vendor did not supply this line" maxLength={300} className="h-8 w-36 rounded-md border border-input bg-transparent px-2 text-caption" />
                          <Button type="submit" size="sm" variant="ghost">Not supplied</Button>
                        </form>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
                <TableHead>Award</TableHead>
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
                  <TableCell>
                    {s.status === 'CANCELLED' && s.cancelReason ? (
                      <span className="text-sm text-muted-foreground">{s.cancelReason.replaceAll('_', ' ').toLowerCase()}</span>
                    ) : s.awards.length === 0 ? (
                      <span className="text-slate">—</span>
                    ) : (
                      <ul className="space-y-0.5 text-sm">
                        {s.awards.map((a) => (
                          <li key={a.rank}>
                            <span className="font-mono tabular-nums text-slate">#{a.rank}</span> {a.vendor} · {a.status.toLowerCase()}
                          </li>
                        ))}
                      </ul>
                    )}
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
