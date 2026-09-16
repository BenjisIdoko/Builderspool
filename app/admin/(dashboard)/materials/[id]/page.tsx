import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeftIcon } from '@phosphor-icons/react/ssr';
import { getMaterialForAdmin } from '@/lib/queries/adminMaterials';
import { getPriceHistory } from '@/lib/queries/materials';
import { formatNaira } from '@/lib/format';
import { updateMaterialAction } from '../actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default async function AdminMaterialEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [material, priceHistory] = await Promise.all([getMaterialForAdmin(id), getPriceHistory(id)]);
  if (!material) notFound();

  const lastSnapshot = priceHistory[priceHistory.length - 1];

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link
        href="/admin/materials"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink"
      >
        <ArrowLeftIcon className="size-3.5" />
        Catalog materials
      </Link>
      <div className="mb-1 text-xs text-muted-foreground">{material.category}</div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-ink">{material.name}</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Current catalog price {formatNaira(material.catalogPrice)}
        {lastSnapshot && ` · last recorded ${lastSnapshot.date.toLocaleDateString('en-NG', { dateStyle: 'medium' })}`}
        . Saving a new price writes a real price-history point the buyer-facing chart will show.
      </p>

      <form action={updateMaterialAction} className="space-y-8">
        <input type="hidden" name="id" value={material.id} />

        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-xs font-bold tracking-wide text-slate uppercase">Pricing &amp; availability</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="catalogPrice" className="mb-1.5 text-xs text-muted-foreground">
                Catalog price (₦)
              </Label>
              <Input
                id="catalogPrice"
                name="catalogPrice"
                type="number"
                min="1"
                step="0.01"
                defaultValue={material.catalogPrice}
                required
              />
            </div>
            <div>
              <Label htmlFor="sourcingScope" className="mb-1.5 text-xs text-muted-foreground">
                Sourcing scope
              </Label>
              <select
                id="sourcingScope"
                name="sourcingScope"
                defaultValue={material.sourcingScope}
                className="h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="NATIONAL">National</option>
                <option value="REGIONAL">Regional</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-xs font-bold tracking-wide text-slate uppercase">Specification</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="grade" className="mb-1.5 text-xs text-muted-foreground">
                Grade
              </Label>
              <Input id="grade" name="grade" defaultValue={material.grade ?? ''} placeholder="e.g. Grade 60" />
            </div>
            <div>
              <Label htmlFor="standard" className="mb-1.5 text-xs text-muted-foreground">
                Standard
              </Label>
              <Input id="standard" name="standard" defaultValue={material.standard ?? ''} placeholder="e.g. NIS 117" />
            </div>
            <div>
              <Label htmlFor="dimensions" className="mb-1.5 text-xs text-muted-foreground">
                Dimensions
              </Label>
              <Input id="dimensions" name="dimensions" defaultValue={material.dimensions ?? ''} placeholder="e.g. 12mm x 12m" />
            </div>
            <div>
              <Label htmlFor="weight" className="mb-1.5 text-xs text-muted-foreground">
                Weight
              </Label>
              <Input id="weight" name="weight" defaultValue={material.weight ?? ''} placeholder="e.g. 50kg" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="spec" className="mb-1.5 text-xs text-muted-foreground">
                Free-text spec
              </Label>
              <Input id="spec" name="spec" defaultValue={material.spec ?? ''} placeholder="Additional notes" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-xs font-bold tracking-wide text-slate uppercase">Image</h2>
          <Label htmlFor="imageUrl" className="mb-1.5 text-xs text-muted-foreground">
            Image URL
          </Label>
          <Input id="imageUrl" name="imageUrl" defaultValue={material.imageUrl ?? ''} placeholder="https://…" />
        </div>

        <div className="flex justify-end gap-3">
          <Button asChild variant="outline">
            <Link href="/admin/materials">Cancel</Link>
          </Button>
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </div>
  );
}
