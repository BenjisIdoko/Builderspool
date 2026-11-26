import Link from 'next/link';
import { formatNaira } from '@/lib/format';
import type { BuyerMaterial } from '@/lib/queries/materials';
import { AddToCartButton } from './add-to-cart-button';
import { MaterialImage } from './material-image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

export function MaterialCard({
  material,
  offerCount = 0,
}: {
  material: BuyerMaterial;
  offerCount?: number;
}) {
  return (
    <Card className="h-full gap-2 rounded-md border-0 p-2 shadow-none transition-shadow duration-150 hover:shadow-card-hover">
      <Link href={`/catalog/${material.id}`} className="relative block overflow-hidden rounded-sm bg-canvas outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10 outline-offset-0 focus-visible:ring-2 focus-visible:ring-ring">
        <MaterialImage
          imageUrl={material.imageUrl}
          category={material.category}
          alt={material.name}
          className="aspect-square w-full"
        />
        {/* On the image, not in the footer, so cards with and without offers keep their prices aligned. */}
        {offerCount > 0 && (
          <span className="absolute bottom-2 left-2 rounded-full bg-white/92 px-2 py-0.5 text-caption font-medium text-success">
            {offerCount} seller {offerCount === 1 ? 'offer' : 'offers'}
          </span>
        )}
      </Link>

      <CardContent className="flex flex-1 flex-col gap-1 p-0">
        <Link href={`/catalog/${material.id}`} className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="line-clamp-2 text-base font-semibold leading-snug text-ink">{material.name.split(/(\S*\d-[A-Za-z]\S*)/).map((part, i) =>
              // "6-inch" stays on one line instead of breaking after the hyphen.
              i % 2 === 1 ? (
                <span key={i} className="whitespace-nowrap">
                  {part}
                </span>
              ) : (
                part
              ),
            )}</span>
        </Link>
        {material.spec && <p className="line-clamp-2 text-sm text-muted-foreground">{material.spec}</p>}
      </CardContent>

      <CardFooter className="mt-auto flex-col items-stretch gap-3 border-0 bg-transparent p-0">
        <div>
          <span className="text-price tabular-nums text-text-storefront">
            {formatNaira(material.catalogPrice)}
          </span>
          <span className="ml-1 text-sm text-muted-foreground">/ {material.unit}</span>
        </div>
        <AddToCartButton material={material} />
      </CardFooter>
    </Card>
  );
}
