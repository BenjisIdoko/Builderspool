import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CaretRightIcon } from '@phosphor-icons/react/ssr';
import {
  getFulfillmentCenters,
  getMaterialById,
  getPriceHistory,
  getRelatedMaterials,
} from '@/lib/queries/materials';
import { ProductGallery } from '@/components/product-gallery';
import { ProductDetailPanel } from '@/components/product-detail-panel';
import { ProductBuyBox } from '@/components/product-buy-box';
import { MaterialCard } from '@/components/material-card';

export default async function MaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const material = await getMaterialById(id);
  if (!material) notFound();

  const [priceHistory, fulfillmentCenters, related] = await Promise.all([
    getPriceHistory(id),
    getFulfillmentCenters(),
    getRelatedMaterials(id, material.category),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pt-32 pb-10">
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

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          <ProductGallery images={material.images} category={material.category} alt={material.name} />
          <div className="mt-8">
            <ProductDetailPanel material={material} priceHistory={priceHistory} fulfillmentCenters={fulfillmentCenters} />
          </div>
        </div>
        <ProductBuyBox material={material} />
      </div>

      {related.length > 0 && (
        <div className="mt-16 border-t border-border pt-10">
          <h2 className="mb-6 text-lg font-bold tracking-tight text-ink">More from {material.category}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <MaterialCard key={item.id} material={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
