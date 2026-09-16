import { BooksIcon, StackIcon, TagIcon } from '@phosphor-icons/react/ssr';
import { getReferenceCategories, getReferenceProducts, getReferenceStats } from '@/lib/queries/catalogueReference';
import { CatalogueFilterBar } from '@/components/admin/catalogue-filter-bar';
import { ReferenceProductActions } from '@/components/admin/reference-product-actions';
import { Badge } from '@/components/ui/badge';
import { pillClass } from '@/lib/statusColors';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-1 text-xs text-muted-foreground">Admin · ops desk</div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-ink">Catalogue reference library</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Researched specs, standards, and common brands across the wider Nigerian construction-materials
        market. Reference only, not the live buyer catalog: most of these have no fixed price, since real
        pricing here comes from seller bidding.
      </p>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="overflow-hidden rounded-lg border border-border bg-surface p-4">
            <div className={`mb-3 flex size-8 items-center justify-center rounded-lg ${pillClass(kpi.tone)}`}>
              <kpi.icon className="size-4" />
            </div>
            <div className="mb-1 text-[11px] text-muted-foreground">{kpi.label}</div>
            <div className="mb-2 truncate text-lg font-semibold text-ink">{kpi.value}</div>
            <Badge variant="outline" className={pillClass(kpi.tone)}>
              {kpi.chip}
            </Badge>
          </div>
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
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Standard</TableHead>
                <TableHead>Common brands</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Price note</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-muted-foreground">{p.sku}</TableCell>
                  <TableCell className="text-ink">
                    {p.name}
                    <div className="text-xs text-muted-foreground">{p.category.name}</div>
                  </TableCell>
                  <TableCell className="text-ink">{p.standard ?? '—'}</TableCell>
                  <TableCell className="max-w-56 text-ink">{p.commonBrands ?? '—'}</TableCell>
                  <TableCell className="text-ink">
                    {p.unitOfSale}
                    {p.packSize && <div className="text-xs text-muted-foreground">{p.packSize}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className="w-fit border-border text-slate">
                        {p.projectScale.charAt(0) + p.projectScale.slice(1).toLowerCase()}
                      </Badge>
                      <Badge variant="outline" className="w-fit border-border text-slate">
                        {p.sourcingModel.charAt(0) + p.sourcingModel.slice(1).toLowerCase()}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-64 text-xs text-muted-foreground">{p.priceNote ?? '—'}</TableCell>
                  <TableCell className="py-2">
                    <ReferenceProductActions product={p} categories={categories} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
