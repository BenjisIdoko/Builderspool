import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { ReferenceProductActions } from './reference-product-actions';
import type { ReferenceProduct } from '@/lib/queries/catalogueReference';

// Lean columns — common brands / unit / price note are real but secondary,
// already reachable via ReferenceProductActions' own "View" dialog (full
// detail), so no second expand toggle duplicating it here.
export function ReferenceProductRow({
  product,
  categories,
}: {
  product: ReferenceProduct;
  categories: { id: string; slug: string; name: string; productCount: number }[];
}) {
  return (
    <TableRow>
      <TableCell className="text-ink">
        <div className="font-medium">{product.name}</div>
        <div className="text-xs text-muted-foreground">
          {product.sku} · {product.category.name}
        </div>
      </TableCell>
      <TableCell className="text-ink">{product.standard ?? '—'}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="w-fit border-border text-slate">
            {product.projectScale.charAt(0) + product.projectScale.slice(1).toLowerCase()}
          </Badge>
          <Badge variant="outline" className="w-fit border-border text-slate">
            {product.sourcingModel.charAt(0) + product.sourcingModel.slice(1).toLowerCase()}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="py-2 text-right">
        <ReferenceProductActions product={product} categories={categories} />
      </TableCell>
    </TableRow>
  );
}
