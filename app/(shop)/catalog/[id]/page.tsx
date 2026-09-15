import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CaretRightIcon } from '@phosphor-icons/react/ssr';
import { getFulfillmentCenters, getMaterialById, getPriceHistory } from '@/lib/queries/materials';
import { MaterialImage } from '@/components/material-image';
import { ProductDetailPanel } from '@/components/product-detail-panel';

export default async function MaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const material = await getMaterialById(id);
  if (!material) notFound();

  const [priceHistory, fulfillmentCenters] = await Promise.all([
    getPriceHistory(id),
    getFulfillmentCenters(),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/catalog" className="hover:text-ink">
          Catalogue
        </Link>
        <CaretRightIcon className="size-3.5" />
        <Link href={`/catalog?category=${encodeURIComponent(material.category)}`} className="hover:text-ink">
          {material.category}
        </Link>
        <CaretRightIcon className="size-3.5" />
        <span className="text-ink">{material.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
        <MaterialImage
          imageUrl={material.imageUrl}
          category={material.category}
          alt={material.name}
          className="aspect-square w-full"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        <ProductDetailPanel material={material} priceHistory={priceHistory} fulfillmentCenters={fulfillmentCenters} />
      </div>
    </div>
  );
}
