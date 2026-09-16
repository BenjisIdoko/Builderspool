import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  PackageIcon,
  PencilSimpleIcon,
  WarningIcon,
  StackIcon,
  GlobeIcon,
  MapPinIcon,
} from '@phosphor-icons/react/ssr';
import {
  getMaterialsForAdmin,
  getAdminMaterialCategories,
  getMaterialsNeedingPriceReviewCount,
  getMaterialKpis,
} from '@/lib/queries/adminMaterials';
import { formatNaira } from '@/lib/format';
import { pillClass } from '@/lib/statusColors';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default async function AdminMaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; page?: string; review?: string }>;
}) {
  const { category, q, page: pageParam, review } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const needsReview = review === '1';

  const [{ materials, total, pageCount }, categories, needsReviewCount, kpis] = await Promise.all([
    getMaterialsForAdmin({ category, query: q, page, needsReview }),
    getAdminMaterialCategories(),
    getMaterialsNeedingPriceReviewCount(),
    getMaterialKpis(),
  ]);

  const kpiCards = [
    { label: 'Total materials', value: String(kpis.total), icon: StackIcon, tone: 'info' as const, chip: 'Live catalog' },
    {
      label: 'Needs price review',
      value: String(kpis.needsReview),
      icon: WarningIcon,
      tone: kpis.needsReview > 0 ? ('warning' as const) : ('success' as const),
      chip: kpis.needsReview > 0 ? 'Placeholder price' : 'All priced',
    },
    { label: 'National supply', value: String(kpis.national), icon: GlobeIcon, tone: 'info' as const, chip: 'Ships anywhere' },
    { label: 'Regional', value: String(kpis.regional), icon: MapPinIcon, tone: 'info' as const, chip: 'Region-limited' },
  ];

  function urlFor(overrides: { category?: string; q?: string; page?: number; review?: boolean }) {
    const params = new URLSearchParams();
    const c = overrides.category !== undefined ? overrides.category : category;
    const query = overrides.q !== undefined ? overrides.q : q;
    const p = overrides.page ?? 1;
    const r = overrides.review !== undefined ? overrides.review : needsReview;
    if (c) params.set('category', c);
    if (query) params.set('q', query);
    if (p > 1) params.set('page', String(p));
    if (r) params.set('review', '1');
    const qs = params.toString();
    return `/admin/materials${qs ? `?${qs}` : ''}`;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-1 text-xs text-muted-foreground">Admin · ops desk</div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-ink">Catalog materials</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        The live buyer catalog — {total} materials. Admin is the only place these can be edited; every
        price change is recorded as a real price-history point buyers can see.
      </p>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
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

      {needsReviewCount > 0 && (
        <Link
          href={urlFor({ review: !needsReview, category: '', page: 1 })}
          className={`mb-6 flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors ${
            needsReview ? 'border-warning bg-warning-soft text-warning' : 'border-warning/40 bg-warning-soft/50 text-warning hover:bg-warning-soft'
          }`}
        >
          <WarningIcon className="size-4 shrink-0" />
          <span>
            <strong>{needsReviewCount}</strong> material{needsReviewCount === 1 ? '' : 's'} imported from the
            catalogue reference library still {needsReviewCount === 1 ? 'has' : 'have'} a placeholder price —{' '}
            {needsReview ? 'showing only these' : 'click to review'}.
          </span>
        </Link>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          <Link href={urlFor({ category: '', page: 1 })}>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                !category ? 'bg-ink text-canvas' : 'text-slate hover:bg-well hover:text-ink'
              }`}
            >
              All categories
            </span>
          </Link>
          {categories.map((c) => (
            <Link key={c} href={urlFor({ category: c, page: 1 })}>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  category === c ? 'bg-ink text-canvas' : 'text-slate hover:bg-well hover:text-ink'
                }`}
              >
                {c}
              </span>
            </Link>
          ))}
        </div>

        <form className="flex max-w-xs flex-1 items-center gap-2">
          {category && <input type="hidden" name="category" value={category} />}
          {needsReview && <input type="hidden" name="review" value="1" />}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={q} placeholder="Search material name…" className="pl-9" />
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </div>

      {materials.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface px-6 py-16 text-center">
          <PackageIcon className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {q ? `No materials match "${q}".` : 'No materials in this category.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="py-3 text-ink">
                    <div className="max-w-64 truncate font-medium">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.category}</div>
                  </TableCell>
                  <TableCell className="py-3 text-ink">{m.unit}</TableCell>
                  <TableCell className="py-3 font-semibold text-ink">
                    <div className="flex items-center gap-1.5">
                      {formatNaira(m.catalogPrice)}
                      {m.needsPriceReview && <WarningIcon className="size-3.5 text-warning" />}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className="w-fit border-border text-slate">
                      {m.sourcingScope === 'NATIONAL' ? 'National' : 'Regional'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <Link
                      href={`/admin/materials/${m.id}`}
                      className="inline-flex items-center gap-1.5 text-sm text-brand hover:underline"
                    >
                      <PencilSimpleIcon className="size-3.5" />
                      Edit
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing page {page} of {pageCount}
          </span>
          <div className="flex gap-2">
            {page <= 1 ? (
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href={urlFor({ page: page - 1 })}>Previous</Link>
              </Button>
            )}
            {page >= pageCount ? (
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href={urlFor({ page: page + 1 })}>Next</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
