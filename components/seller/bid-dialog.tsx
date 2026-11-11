'use client';

import { useState } from 'react';
import { ShieldCheckIcon } from '@phosphor-icons/react/ssr';
import { submitBid } from '@/app/seller/actions';
import { formatNaira } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function BidDialog({
  cycle,
}: {
  cycle: {
    id: string;
    region: string | null;
    material: { name: string; category: string; unit: string };
    totalQuantityRequested: number;
    myBid: { unitPrice: number; quantityOffered: number; estimatedDeliveryDays: number } | null;
  };
}) {
  const [open, setOpen] = useState(false);
  const [unitPrice, setUnitPrice] = useState(cycle.myBid?.unitPrice ?? 0);
  const [quantity, setQuantity] = useState(cycle.myBid?.quantityOffered ?? 0);
  const totalBidValue = unitPrice * quantity;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant={cycle.myBid ? 'outline' : 'default'} className="w-full">
          {cycle.myBid ? 'Update bid' : 'Submit bid'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <Badge variant="outline" className="w-fit bg-pale-blue text-cyan-text border-cyan/30">
            Blind auction submission
          </Badge>
          <DialogTitle className="text-lg">{cycle.material.name}</DialogTitle>
          <p className="text-pretty text-sm text-slate">
            Consolidated pool:{' '}
            <span className="font-bold text-ink">
              {cycle.totalQuantityRequested} {cycle.material.unit}
            </span>{' '}
            ({cycle.region ?? 'National'})
          </p>
        </DialogHeader>

        <div className="rounded-lg bg-canvas p-4 shadow-[0_0_0_1px_var(--color-hairline)]">
          <div className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-bold text-ink">
            <ShieldCheckIcon className="size-4 text-success" />
            Confidential blind auction guarantee
          </div>
          <p className="text-xs leading-relaxed text-slate">
            Other suppliers can&apos;t see your unit price or capacity. Awards are scored on price,
            performance, capacity, delivery, geography and responsiveness.
          </p>
        </div>

        <form
          action={submitBid}
          onSubmit={() => setOpen(false)}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="cycleId" value={cycle.id} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`unitPrice-${cycle.id}`}>Wholesale unit bid price (₦ per {cycle.material.unit})</Label>
            <Input
              id={`unitPrice-${cycle.id}`}
              type="number"
              inputMode="numeric"
              name="unitPrice"
              min="1"
              step="1"
              required
              value={unitPrice || ''}
              onChange={(e) => setUnitPrice(Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`quantityOffered-${cycle.id}`}>Offered supply quantity</Label>
              <Input
                id={`quantityOffered-${cycle.id}`}
                type="number"
                inputMode="numeric"
                name="quantityOffered"
                min="1"
                step="1"
                required
                value={quantity || ''}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Can be partial capacity</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`estimatedDeliveryDays-${cycle.id}`}>Hub delivery lead time (days)</Label>
              <Input
                id={`estimatedDeliveryDays-${cycle.id}`}
                type="number"
                inputMode="numeric"
                name="estimatedDeliveryDays"
                min="0"
                step="1"
                required
                defaultValue={cycle.myBid?.estimatedDeliveryDays}
              />
              <p className="text-xs text-muted-foreground">Days to reach regional hub</p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              <div className="text-xs text-muted-foreground">Total bid value</div>
              <div className="text-lg font-bold tabular-nums text-ink">{formatNaira(totalBidValue)}</div>
            </div>
            <Button type="submit">{cycle.myBid ? 'Update bid' : 'Seal & submit bid'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
