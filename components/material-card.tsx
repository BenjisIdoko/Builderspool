import Link from 'next/link';
import { formatNaira } from '@/lib/format';
import type { BuyerMaterial } from '@/lib/queries/materials';
import { AddToCartButton } from './add-to-cart-button';
import { MaterialImage } from './material-image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function MaterialCard({ material }: { material: BuyerMaterial }) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <Link href={`/catalog/${material.id}`} className="flex flex-col">
        <MaterialImage
          imageUrl={material.imageUrl}
          category={material.category}
          alt={material.name}
          className="aspect-[4/3] w-full border-b border-border"
        />
        <CardContent className="flex flex-col gap-1.5 p-4">
          <Badge variant="outline" className="w-fit bg-well text-muted-foreground">
            {material.category}
          </Badge>
          <span className="text-[15px] leading-snug font-semibold text-ink">{material.name}</span>
          {material.spec && <span className="text-sm text-slate">{material.spec}</span>}
        </CardContent>
      </Link>
      <CardFooter className="mt-auto flex-col items-stretch gap-3 border-t border-border bg-surface p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-lg font-semibold tabular-nums text-ink">
            {formatNaira(material.catalogPrice)}
          </span>
          <span className="text-xs text-muted-foreground">/ {material.unit}</span>
        </div>
        <AddToCartButton material={material} />
      </CardFooter>
    </Card>
  );
}
