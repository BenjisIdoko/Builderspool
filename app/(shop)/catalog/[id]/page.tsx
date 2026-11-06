import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CaretRightIcon } from '@phosphor-icons/react/ssr';
import {
  getFulfillmentCenters,
  getMaterialById,
  getPriceHistory,
  getRelatedMaterials,
  getFrequentlyBoughtTogether,
} from '@/lib/queries/materials';
import { ProductGallery } from '@/components/product-gallery';
import { ProductDetailPanel } from '@/components/product-detail-panel';
import { ProductBuyBox } from '@/components/product-buy-box';
import { ProductPoolPanel } from '@/components/product-pool-panel';
import { ProductOffers } from '@/components/product-offers';
import { getOffers } from '@/lib/queries/offers';
import { getPoolSnapshot } from '@/lib/queries/pool';
import { MaterialCard } from '@/components/material-card';
import { formatNaira } from '@/lib/format';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const material = await getMaterialById(id);
  if (!material) return { title: 'Product not found' };
  const description = `${material.name} — ${formatNaira(material.catalogPrice)} per ${material.unit}. Fixed catalogue price, held in escrow until delivery is confirmed.`;
  return {
    title: material.name,
    description,
    openGraph: { siteName: 'Builders Pool', type: 'website', title: material.name, description, images: material.imageUrl ? [material.imageUrl] : undefined },
  };
}

export default async function MaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const material = await getMaterialById(id);
  if (!material) notFound();

  const [priceHistory, fulfillmentCenters, related, boughtTogether, pool, offers] = await Promise.all([
    getPriceHistory(id),
    getFulfillmentCenters(),
    getRelatedMaterials(id, material.category),
    getFrequentlyBoughtTogether(id),
    getPoolSnapshot(id),
    getOffers(id),
  ]);
  const bundleItems = boughtTogether.length > 0 ? boughtTogether : related;
  const bundleTitle = boughtTogether.length > 0 ? 'Frequently procured together' : `More from ${material.category}`;

  return (
    <div className="mx-auto w-full max-w-section pt-6 pb-28 lg:pb-10">
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

      <div className="grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-[1fr_380px]">
        <div className="lg:col-start-1 lg:row-start-1">
          <ProductGallery images={material.images} category={material.category} alt={material.name} />
        </div>

        <div className="flex flex-col gap-5 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <header>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-cyan px-3 py-1 text-caption font-bold text-ink">
                Pool &amp; Save
              </span>
              <span className="inline-flex items-center rounded-full border border-input bg-surface px-3 py-1 text-caption font-medium text-ink">
                {material.category}
              </span>
              <span className="inline-flex items-center rounded-full border border-input bg-surface px-3 py-1 text-caption font-medium text-ink">
                {material.sourcingScope === 'NATIONAL' ? 'National supply' : 'Regional'}
              </span>
            </div>
            <h1 className="text-ink">{material.name}</h1>
            <p className="mt-1 text-body-sm text-slate">Sold per {material.unit}</p>
            <p className="mt-3 text-price-lg tabular-nums text-ink lg:hidden">
              {formatNaira(material.catalogPrice)}
              <span className="ml-1 font-sans text-body-sm font-medium text-muted-foreground">/ {material.unit}</span>
            </p>
          </header>
          <ProductBuyBox material={material} />
          <ProductPoolPanel pool={pool} unit={material.unit} />
          <ProductOffers offers={offers} unit={material.unit} />
        </div>

        <div className="lg:col-start-1 lg:row-start-2">
          <ProductDetailPanel material={material} priceHistory={priceHistory} fulfillmentCenters={fulfillmentCenters} />
        </div>
      </div>

      {bundleItems.length > 0 && (
        <div className="mt-16 border-t border-border pt-10">
          <h2 className="mb-6 text-ink">{bundleTitle}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {bundleItems.map((item) => (
              <MaterialCard key={item.id} material={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
