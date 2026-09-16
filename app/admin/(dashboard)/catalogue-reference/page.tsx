import { getReferenceCategories, getReferenceProducts } from '@/lib/queries/catalogueReference';
import { CatalogueFilterBar } from '@/components/admin/catalogue-filter-bar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default async function CatalogueReferencePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
  const [categories, products] = await Promise.all([
    getReferenceCategories(),
    getReferenceProducts(category, q),
  ]);

  const totalProducts = categories.reduce((sum, c) => sum + c.productCount, 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-1 text-xs text-muted-foreground">Admin · ops desk</div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-ink">Catalogue reference library</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Researched specs, standards, and common brands across the wider Nigerian construction-materials
        market — {totalProducts} products in {categories.length} categories. Reference only, not the live
        buyer catalog: most of these have no fixed price, since real pricing here comes from seller bidding.
      </p>

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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
