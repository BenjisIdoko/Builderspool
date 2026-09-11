import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getMaterialById } from '@/lib/queries/materials';
import { formatNaira } from '@/lib/format';
import { AddToCartButton } from '@/components/add-to-cart-button';

export default async function MaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const material = await getMaterialById(id);
  if (!material) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <Link href="/catalog" className="text-sm text-slate hover:text-ink">
        ← Back to catalog
      </Link>

      <div className="mt-6 rounded-lg border border-border bg-surface p-8">
        <span className="text-xs text-muted-foreground">{material.category}</span>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-ink">{material.name}</h1>
        {material.spec && <p className="mt-2 text-slate">{material.spec}</p>}

        <div className="mt-8 flex items-end justify-between border-t border-border pt-6">
          <div>
            <div className="text-2xl font-medium text-ink">{formatNaira(material.catalogPrice)}</div>
            <div className="text-sm text-muted-foreground">per {material.unit}</div>
          </div>
          <AddToCartButton material={material} />
        </div>
      </div>
    </div>
  );
}
