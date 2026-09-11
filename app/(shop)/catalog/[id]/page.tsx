import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Tag, Truck } from 'lucide-react';
import { getMaterialById } from '@/lib/queries/materials';
import { formatNaira } from '@/lib/format';
import { AddToCartButton } from '@/components/add-to-cart-button';
import { MaterialImage } from '@/components/material-image';
import { Badge } from '@/components/ui/badge';

export default async function MaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const material = await getMaterialById(id);
  if (!material) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/catalog" className="hover:text-ink">
          Catalog
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href={`/catalog?category=${encodeURIComponent(material.category)}`} className="hover:text-ink">
          {material.category}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-ink">{material.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <MaterialImage
            imageUrl={material.imageUrl}
            category={material.category}
            alt={material.name}
            className="aspect-video w-full rounded-lg border border-border"
            sizes="(max-width: 1024px) 100vw, 60vw"
          />

          <div className="mt-6">
            <Badge variant="outline" className="bg-well text-muted-foreground">
              {material.category}
            </Badge>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">{material.name}</h1>
            {material.spec && <p className="mt-2 text-base text-slate">{material.spec}</p>}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-border pt-6 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4">
              <Tag className="mt-0.5 size-4 shrink-0 text-brand" />
              <div>
                <div className="text-sm font-semibold text-ink">Fixed price</div>
                <div className="text-xs text-muted-foreground">Locked in at checkout, no renegotiation.</div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4">
              <Truck className="mt-0.5 size-4 shrink-0 text-brand" />
              <div>
                <div className="text-sm font-semibold text-ink">Pickup or delivery</div>
                <div className="text-xs text-muted-foreground">Choose your fulfillment method at checkout.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-fit rounded-lg border border-border bg-surface p-6 lg:sticky lg:top-24">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums text-ink">{formatNaira(material.catalogPrice)}</span>
            <span className="text-sm text-muted-foreground">/ {material.unit}</span>
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <AddToCartButton material={material} />
          </div>
        </div>
      </div>
    </div>
  );
}
