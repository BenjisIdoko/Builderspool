import Link from 'next/link';
import { formatNaira } from '@/lib/format';
import type { BuyerMaterial } from '@/lib/queries/materials';
import { AddToCartButton } from './add-to-cart-button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

export function MaterialCard({ material }: { material: BuyerMaterial }) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <Link href={`/catalog/${material.id}`} className="flex flex-col">
        <CardContent className="flex flex-col gap-1 p-5">
          <span className="text-xs text-muted-foreground">{material.category}</span>
          <span className="text-[15px] font-medium leading-snug text-ink">{material.name}</span>
          {material.spec && <span className="text-sm text-slate">{material.spec}</span>}
        </CardContent>
      </Link>
      <CardFooter className="mt-auto flex items-center justify-between gap-3 border-t border-border p-5">
        <div>
          <div className="text-[15px] font-medium text-ink">{formatNaira(material.catalogPrice)}</div>
          <div className="text-xs text-muted-foreground">per {material.unit}</div>
        </div>
        <AddToCartButton material={material} />
      </CardFooter>
    </Card>
  );
}
