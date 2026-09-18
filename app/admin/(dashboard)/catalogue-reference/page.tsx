import { BooksIcon, StackIcon, TagIcon } from '@phosphor-icons/react/ssr';
import { getReferenceCategories, getReferenceProducts, getReferenceStats } from '@/lib/queries/catalogueReference';
import { CatalogueFilterBar } from '@/components/admin/catalogue-filter-bar';
import { ReferenceProductRow } from '@/components/admin/reference-product-row';
import { KpiCard } from '@/components/kpi-card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default async function CatalogueReferencePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
  const [categories, products, stats] = await Promise.all([
    getReferenceCategories(),
    getReferenceProducts(category, q),
    getReferenceStats(),
  ]);

  const kpiCards = [
    { label: 'Total products', value: String(stats.totalProducts), icon: StackIcon, tone: 'info' as const, chip: 'Reference only' },
    { label: 'Categories', value: String(stats.totalCategories), icon: BooksIcon, tone: 'info' as const, chip: 'Statutory taxonomy' },
    {
      label: 'With researched pricing',
      value: `${stats.withPricing} / ${stats.totalProducts}`,
      icon: TagIcon,
      tone: 'success' as const,
      chip: 'Real market survey',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1180px] px-6 py-10">
      <div className="mb-1 text-xs text-muted-foreground">Admin · ops desk</div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-ink">Catalogue reference library</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Researched specs, standards, and common brands across the wider Nigerian construction-materials
        market. Reference only, not the live buyer catalog: most of these have no fixed price, since real
        pricing here comes from seller bidding.
      </p>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {kpiCards.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} size="compact" />
        ))}
      </div>

      <CatalogueFilterBar categories={categories} category={category} q={q} />

      {products.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {q ? `No products match "${q}".` : 'No products in this category.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product & SKU</TableHead>
                <TableHead>Standard</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <ReferenceProductRow key={p.id} product={p} categories={categories} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
