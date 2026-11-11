'use client';

import { useState, useTransition } from 'react';
import { withdrawBid } from '@/app/seller/actions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Withdrawing a bid cannot be undone, so it asks first and shows any problem inside the dialog.
export function WithdrawBidButton({ bidId, material, price }: { bidId: string; material: string; price: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirm() {
    setError(null);
    const fd = new FormData();
    fd.set('bidId', bidId);
    startTransition(async () => {
      const r = await withdrawBid(fd);
      if ('error' in r) setError(r.error);
      else setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setError(null); }}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          Withdraw
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw this bid?</DialogTitle>
          <DialogDescription className="text-pretty">
            Your bid for {material} at {price} won&apos;t be considered, and you can&apos;t undo this.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-pretty text-sm text-danger">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Keep bid
          </Button>
          <Button type="button" variant="destructive" onClick={confirm} disabled={isPending} aria-busy={isPending}>
            {isPending ? 'Withdrawing…' : 'Withdraw bid'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
