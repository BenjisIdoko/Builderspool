import Link from 'next/link';
import { formatNaira } from '@/lib/format';
import type { BuyerMaterial } from '@/lib/queries/materials';
import { AddToCartButton } from './add-to-cart-button';
import { MaterialImage } from './material-image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function MaterialCard({ material }: { material: BuyerMaterial }) {
  return (
    <Card className="gap-3 rounded-[14px] p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-[transform,box-shadow] duration-150 hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(16,24,40,0.12)]">
      <Link href={`/catalog/${material.id}`} className="relative block overflow-hidden rounded-lg">
        <MaterialImage
          imageUrl={material.imageUrl}
          category={material.category}
          alt={material.name}
          className="aspect-square w-full"
        />
        <Badge
          variant="outline"
          className="absolute top-2.5 left-2.5 border-transparent bg-white/92 text-muted-foreground"
        >
          {material.category}
        </Badge>
      </Link>

      <CardContent className="flex flex-1 flex-col gap-1 p-0">
        <Link href={`/catalog/${material.id}`}>
          <span className="text-[15px] leading-snug font-semibold text-ink">{material.name}</span>
        </Link>
        {material.spec && <p className="line-clamp-2 text-sm text-slate">{material.spec}</p>}
      </CardContent>

      <CardFooter className="flex-col items-stretch gap-3 p-0">
        <div>
          <span className="text-lg font-bold tabular-nums text-ink">
            {formatNaira(material.catalogPrice)}
          </span>
          <span className="ml-1 text-xs text-muted-foreground">/ {material.unit}</span>
        </div>
        <AddToCartButton material={material} />
      </CardFooter>
    </Card>
  );
}
