'use client';

import { useRef, useState, useTransition } from 'react';
import { EyeIcon, PencilSimpleIcon, TrashIcon } from '@phosphor-icons/react/ssr';
import type { ReferenceProduct } from '@/lib/queries/catalogueReference';
import { updateReferenceProductAction, deleteReferenceProductAction } from '@/app/admin/(dashboard)/catalogue-reference/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Category = { id: string; name: string; slug: string };
type Mode = 'closed' | 'view' | 'edit' | 'delete';

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-sm text-ink">{value || '—'}</div>
    </div>
  );
}

export function ReferenceProductActions({ product, categories }: { product: ReferenceProduct; categories: Category[] }) {
  const [mode, setMode] = useState<Mode>('closed');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateReferenceProductAction(formData);
        setMode('closed');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save changes.');
      }
    });
  }

  function handleDelete() {
    setError(null);
    const formData = new FormData();
    formData.set('id', product.id);
    startTransition(async () => {
      try {
        await deleteReferenceProductAction(formData);
        setMode('closed');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not delete this product.');
      }
    });
  }

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => setMode('view')} title="View">
          <EyeIcon className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => setMode('edit')} title="Edit">
          <PencilSimpleIcon className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => setMode('delete')} title="Delete">
          <TrashIcon className="size-4 text-danger" />
        </Button>
      </div>

      {/* View */}
      <Dialog open={mode === 'view'} onOpenChange={(open) => setMode(open ? 'view' : 'closed')}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{product.name}</DialogTitle>
            <DialogDescription>
              {product.sku} · {product.category.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Standard" value={product.standard} />
            <Field label="Brand (specific)" value={product.brand} />
            <Field label="Common brands" value={product.commonBrands} />
            <Field label="Unit of sale" value={product.unitOfSale} />
            <Field label="Pack size" value={product.packSize} />
            <Field label="Project scale" value={product.projectScale} />
            <Field label="Sourcing model" value={product.sourcingModel} />
            <Field label="Price note" value={product.priceNote} />
          </div>
          <Field label="Specification" value={product.specification} />
          <Field label="Description" value={product.description} />
          <Field label="Notes" value={product.notes} />
          <Field label="Image URL" value={product.imageUrl} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMode('closed')}>
              Close
            </Button>
            <Button type="button" onClick={() => setMode('edit')}>
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={mode === 'edit'} onOpenChange={(open) => setMode(open ? 'edit' : 'closed')}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit {product.name}</DialogTitle>
            <DialogDescription>Reference-library data only — never shown to buyers or sellers.</DialogDescription>
          </DialogHeader>
          <form ref={formRef} onSubmit={handleSave} className="space-y-4">
            <input type="hidden" name="id" value={product.id} />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor={`name-${product.id}`} className="mb-1 text-xs text-muted-foreground">
                  Name
                </Label>
                <Input id={`name-${product.id}`} name="name" defaultValue={product.name} required />
              </div>
              <div>
                <Label htmlFor={`sku-${product.id}`} className="mb-1 text-xs text-muted-foreground">
                  SKU
                </Label>
                <Input id={`sku-${product.id}`} name="sku" defaultValue={product.sku} required />
              </div>
            </div>

            <div>
              <Label htmlFor={`categoryId-${product.id}`} className="mb-1 text-xs text-muted-foreground">
                Category
              </Label>
              <select
                id={`categoryId-${product.id}`}
                name="categoryId"
                defaultValue={product.categoryId}
                className="h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor={`standard-${product.id}`} className="mb-1 text-xs text-muted-foreground">
                  Standard
                </Label>
                <Input id={`standard-${product.id}`} name="standard" defaultValue={product.standard ?? ''} />
              </div>
              <div>
                <Label htmlFor={`brand-${product.id}`} className="mb-1 text-xs text-muted-foreground">
                  Brand (specific)
                </Label>
                <Input id={`brand-${product.id}`} name="brand" defaultValue={product.brand ?? ''} />
              </div>
              <div>
                <Label htmlFor={`unitOfSale-${product.id}`} className="mb-1 text-xs text-muted-foreground">
                  Unit of sale
                </Label>
                <Input id={`unitOfSale-${product.id}`} name="unitOfSale" defaultValue={product.unitOfSale} required />
              </div>
              <div>
                <Label htmlFor={`packSize-${product.id}`} className="mb-1 text-xs text-muted-foreground">
                  Pack size
                </Label>
                <Input id={`packSize-${product.id}`} name="packSize" defaultValue={product.packSize ?? ''} />
              </div>
              <div>
                <Label htmlFor={`projectScale-${product.id}`} className="mb-1 text-xs text-muted-foreground">
                  Project scale
                </Label>
                <select
                  id={`projectScale-${product.id}`}
                  name="projectScale"
                  defaultValue={product.projectScale}
                  className="h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="SMALL">Small</option>
                  <option value="MEGA">Mega</option>
                  <option value="BOTH">Both</option>
                </select>
              </div>
              <div>
                <Label htmlFor={`sourcingModel-${product.id}`} className="mb-1 text-xs text-muted-foreground">
                  Sourcing model
                </Label>
                <select
                  id={`sourcingModel-${product.id}`}
                  name="sourcingModel"
                  defaultValue={product.sourcingModel}
                  className="h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="NATIONAL">National</option>
                  <option value="REGIONAL">Regional</option>
                  <option value="BOTH">Both</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor={`commonBrands-${product.id}`} className="mb-1 text-xs text-muted-foreground">
                Common brands
              </Label>
              <Input id={`commonBrands-${product.id}`} name="commonBrands" defaultValue={product.commonBrands ?? ''} />
            </div>

            <div>
              <Label htmlFor={`specification-${product.id}`} className="mb-1 text-xs text-muted-foreground">
                Specification
              </Label>
              <Textarea id={`specification-${product.id}`} name="specification" defaultValue={product.specification ?? ''} />
            </div>

            <div>
              <Label htmlFor={`description-${product.id}`} className="mb-1 text-xs text-muted-foreground">
                Description
              </Label>
              <Textarea id={`description-${product.id}`} name="description" defaultValue={product.description ?? ''} />
            </div>

            <div>
              <Label htmlFor={`priceNote-${product.id}`} className="mb-1 text-xs text-muted-foreground">
                Price note
              </Label>
              <Input id={`priceNote-${product.id}`} name="priceNote" defaultValue={product.priceNote ?? ''} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor={`imageUrl-${product.id}`} className="mb-1 text-xs text-muted-foreground">
                  Image URL
                </Label>
                <Input id={`imageUrl-${product.id}`} name="imageUrl" defaultValue={product.imageUrl ?? ''} />
              </div>
              <div>
                <Label htmlFor={`imageSearchTerm-${product.id}`} className="mb-1 text-xs text-muted-foreground">
                  Image search term
                </Label>
                <Input id={`imageSearchTerm-${product.id}`} name="imageSearchTerm" defaultValue={product.imageSearchTerm ?? ''} />
              </div>
            </div>

            <div>
              <Label htmlFor={`notes-${product.id}`} className="mb-1 text-xs text-muted-foreground">
                Notes
              </Label>
              <Textarea id={`notes-${product.id}`} name="notes" defaultValue={product.notes ?? ''} />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <DialogFooter className="mt-0">
              <Button type="button" variant="outline" onClick={() => setMode('closed')} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={mode === 'delete'} onOpenChange={(open) => setMode(open ? 'delete' : 'closed')}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete {product.name}?</DialogTitle>
            <DialogDescription>
              This permanently removes it from the reference library. This has no effect on the live buyer
              catalog — these are separate records.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-danger">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMode('closed')} disabled={isPending}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
