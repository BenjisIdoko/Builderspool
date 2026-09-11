import Link from 'next/link';
import { formatNaira } from '@/lib/format';
import type { BuyerMaterial } from '@/lib/queries/materials';
import { AddToCartButton } from './add-to-cart-button';

export function MaterialCard({ material }: { material: BuyerMaterial }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <Link href={`/catalog/${material.id}`} className="flex flex-col gap-1 p-5">
        <span className="text-xs text-muted">{material.category}</span>
        <span className="text-[15px] font-medium leading-snug text-ink">{material.name}</span>
        {material.spec && <span className="text-sm text-slate">{material.spec}</span>}
      </Link>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border p-5">
        <div>
          <div className="text-[15px] font-medium text-ink">{formatNaira(material.catalogPrice)}</div>
          <div className="text-xs text-muted">per {material.unit}</div>
        </div>
        <AddToCartButton material={material} />
      </div>
    </div>
  );
}
