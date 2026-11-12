'use client';

import { useState, useTransition } from 'react';
import { MapPinIcon, PencilSimpleIcon, PlusIcon } from '@phosphor-icons/react/ssr';
import { deleteAddressAction, saveAddressAction, setDefaultAddressAction } from '@/app/(shop)/account/addresses/actions';
import { EmptyState } from '@/components/empty-state/empty-state';
import { EmptyListIllustration } from '@/components/empty-state/illustrations';
import { ActionForm } from '@/components/ui/action-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CheckoutAreas } from '@/lib/queries/checkoutAreas';

export type SavedAddress = {
  id: string;
  contactName: string;
  contactPhone: string;
  address: string;
  landmark: string | null;
  localityId: string | null;
  localityName: string | null;
  isDefault: boolean;
};

function AddressForm({
  address,
  areas,
  defaultName,
  defaultPhone,
  onSaved,
}: {
  address?: SavedAddress;
  areas: CheckoutAreas;
  defaultName: string;
  defaultPhone: string;
  onSaved: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [localityId, setLocalityId] = useState(address?.localityId ?? '');
  const prefix = address ? `edit-${address.id}` : 'new-address';

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await saveAddressAction(fd);
      if ('error' in r) setError(r.error);
      else onSaved();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {address && <input type="hidden" name="id" value={address.id} />}
      <input type="hidden" name="localityId" value={localityId} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${prefix}-name`}>Name of the person receiving</Label>
          <Input id={`${prefix}-name`} name="contactName" required autoComplete="name" defaultValue={address?.contactName ?? defaultName} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${prefix}-phone`}>Phone</Label>
          <Input id={`${prefix}-phone`} name="contactPhone" type="tel" inputMode="tel" required autoComplete="tel" defaultValue={address?.contactPhone ?? defaultPhone} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-address`}>Delivery address</Label>
        <Input id={`${prefix}-address`} name="address" required minLength={8} maxLength={200} autoComplete="street-address" placeholder="Site, street and area" defaultValue={address?.address} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-landmark`}>
          Nearest landmark <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input id={`${prefix}-landmark`} name="landmark" maxLength={120} autoComplete="off" placeholder="e.g. Opposite the filling station" defaultValue={address?.landmark ?? ''} />
      </div>
      {areas.enabled && (
        <div className="max-w-sm space-y-1.5">
          <span id={`${prefix}-area`} className="text-sm font-medium text-ink">
            Area
          </span>
          <Select value={localityId} onValueChange={setLocalityId}>
            <SelectTrigger aria-labelledby={`${prefix}-area`} className="h-11 w-full">
              <SelectValue placeholder="Choose the area" />
            </SelectTrigger>
            <SelectContent>
              {areas.lgas.map((lga) => (
                <SelectGroup key={lga.id}>
                  <SelectLabel>{lga.name}</SelectLabel>
                  {lga.localities.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isPending} aria-busy={isPending}>
          {isPending ? 'Saving…' : address ? 'Save changes' : 'Save address'}
        </Button>
        {error && (
          <span role="alert" className="min-w-0 flex-1 basis-56 text-pretty text-sm text-danger">
            {error}
          </span>
        )}
      </div>
    </form>
  );
}

function AddressDialog({
  address,
  areas,
  defaultName,
  defaultPhone,
  children,
}: {
  address?: SavedAddress;
  areas: CheckoutAreas;
  defaultName: string;
  defaultPhone: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{address ? 'Edit address' : 'Add a delivery address'}</DialogTitle>
          <DialogDescription className="text-pretty">Checkout fills this in for you whenever you choose delivery.</DialogDescription>
        </DialogHeader>
        <AddressForm address={address} areas={areas} defaultName={defaultName} defaultPhone={defaultPhone} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

// The buyer's saved delivery addresses, with one default that checkout fills in.
export function DeliveryAddresses({
  addresses,
  areas,
  defaultName,
  defaultPhone,
}: {
  addresses: SavedAddress[];
  areas: CheckoutAreas;
  defaultName: string;
  defaultPhone: string;
}) {
  const addButton = (
    <Button type="button" className="max-sm:h-11">
      <PlusIcon aria-hidden className="size-4" />
      Add new address
    </Button>
  );

  if (addresses.length === 0) {
    return (
      <EmptyState
        illustration={EmptyListIllustration}
        variant="inline"
        as="p"
        title="No saved delivery addresses"
        description="Save the sites you order for, and checkout fills them in."
      >
        <AddressDialog areas={areas} defaultName={defaultName} defaultPhone={defaultPhone}>
          {addButton}
        </AddressDialog>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[60ch] text-pretty text-sm text-muted-foreground">Checkout starts with your default address. You can pick another for a single order.</p>
        <AddressDialog areas={areas} defaultName={defaultName} defaultPhone={defaultPhone}>
          {addButton}
        </AddressDialog>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {addresses.map((a) => (
          <li key={a.id} className="flex flex-col rounded-card bg-surface p-4 shadow-[0_0_0_1px_var(--color-hairline)]">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-pretty text-sm font-semibold text-ink">{a.contactName}</h3>
              {a.isDefault && <Badge variant="success">Default</Badge>}
            </div>
            <p className="mt-1 flex items-start gap-1.5 text-pretty text-sm text-muted-foreground">
              <MapPinIcon aria-hidden className="mt-0.5 size-3.5 shrink-0" />
              <span>
                {a.address}
                {a.landmark && <span className="block">Landmark: {a.landmark}</span>}
                {a.localityName && <span className="block">{a.localityName}</span>}
              </span>
            </p>
            <p className="mt-1 text-sm tabular-nums text-muted-foreground">{a.contactPhone}</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-2">
              {a.isDefault ? (
                <span className="text-sm text-muted-foreground">Your default</span>
              ) : (
                <ActionForm action={setDefaultAddressAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <Button type="submit" variant="ghost" size="sm" className="-ml-2 max-sm:h-11">
                    Set as default
                  </Button>
                </ActionForm>
              )}
              <div className="flex items-center gap-1">
                <AddressDialog address={a} areas={areas} defaultName={defaultName} defaultPhone={defaultPhone}>
                  <Button type="button" variant="ghost" size="sm" className="max-sm:h-11">
                    <PencilSimpleIcon aria-hidden className="size-3.5" />
                    Edit
                  </Button>
                </AddressDialog>
                <ActionForm
                  action={deleteAddressAction}
                  confirm={{
                    title: 'Delete this address?',
                    description: a.isDefault ? 'It’s your default, so your oldest saved address becomes the default. You can’t undo this.' : 'You can’t undo this.',
                    confirmLabel: 'Delete address',
                    destructive: true,
                  }}
                >
                  <input type="hidden" name="id" value={a.id} />
                  <Button type="submit" variant="ghost" size="sm" className="max-sm:h-11">
                    Delete
                  </Button>
                </ActionForm>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
