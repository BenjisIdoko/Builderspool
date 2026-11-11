import Link from 'next/link';
import { formatNaira } from '@/lib/format';
import type { BuyerMaterial } from '@/lib/queries/materials';
import { AddToCartButton } from './add-to-cart-button';
import { MaterialImage } from './material-image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function MaterialCard({ material, showScope = false }: { material: BuyerMaterial; showScope?: boolean }) {
  return (
    <Card className="h-full gap-2 rounded-md border-0 p-2 shadow-none transition-shadow duration-150 hover:shadow-card-hover">
      <Link href={`/catalog/${material.id}`} className="relative block overflow-hidden rounded-sm bg-canvas outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10 outline-offset-0 focus-visible:ring-2 focus-visible:ring-ring">
        <MaterialImage
          imageUrl={material.imageUrl}
          category={material.category}
          alt={material.name}
          className="aspect-square w-full"
        />
        <Badge variant="outline" className="absolute top-2 left-2 border-transparent bg-white/92 text-muted-foreground">
          {material.category}
        </Badge>
      </Link>

      <CardContent className="flex flex-1 flex-col gap-1 p-0">
        <Link href={`/catalog/${material.id}`} className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="line-clamp-2 text-sm leading-snug text-text-storefront">{material.name}</span>
        </Link>
        {material.spec && <p className="line-clamp-2 text-sm text-slate">{material.spec}</p>}
      </CardContent>

      <CardFooter className="mt-auto flex-col items-stretch gap-3 border-0 bg-transparent p-0">
        <div>
          <span className="text-price tabular-nums text-text-storefront">
            {formatNaira(material.catalogPrice)}
          </span>
          <span className="ml-1 text-xs text-muted-foreground">/ {material.unit}</span>
        </div>
        {showScope && (
          <p className="-mt-2 text-caption text-muted-foreground">
            {material.sourcingScope === 'NATIONAL' ? 'National supply' : 'Regional'}
          </p>
        )}
        <AddToCartButton material={material} />
      </CardFooter>
    </Card>
  );
}
