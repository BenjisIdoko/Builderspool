import { getDemoBuyer } from '@/lib/demoBuyer';
import { getOrdersForBuyer } from '@/lib/queries/orders';
import { formatNaira } from '@/lib/format';
import { updateBuyerProfile } from './actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Awaiting payment',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

export default async function AccountPage() {
  const buyer = await getDemoBuyer();
  const orders = await getOrdersForBuyer(buyer.id);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-ink">Account</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Buyer accounts aren&apos;t built yet, so this is the one demo profile every checkout uses —
        edits here save to that same account.
      </p>

      <div className="mb-8 rounded-lg border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-bold text-slate">Profile</h2>
        <form action={updateBuyerProfile} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={buyer.email} disabled />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required defaultValue={buyer.name} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={buyer.phone ?? ''} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="businessName">Business name</Label>
            <Input id="businessName" name="businessName" defaultValue={buyer.businessName ?? ''} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">Job site / delivery location</Label>
            <Input id="location" name="location" defaultValue={buyer.location ?? ''} />
          </div>

          <div className="sm:col-span-2">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-bold text-slate">Order history</h2>
        </div>
        {orders.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            No orders yet —{' '}
            <Link href="/catalog" className="text-brand hover:underline">
              browse the catalog
            </Link>{' '}
            to place your first one.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-well"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-ink">{order.id}</span>
                    <Badge variant="outline" className="bg-well text-muted-foreground">
                      {STATUS_LABEL[order.status] ?? order.status}
                    </Badge>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {order.createdAt.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })} ·{' '}
                    {order.itemCount} item{order.itemCount === 1 ? '' : 's'}
                  </div>
                </div>
                <div className="font-bold tabular-nums text-ink">{formatNaira(order.total)}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
