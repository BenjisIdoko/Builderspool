'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PencilSimpleIcon, WarningIcon } from '@phosphor-icons/react/ssr';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';

// Detail toggle reveals the real spec fields (grade/standard/dimensions/
// weight) already fetched for every material but not worth a permanent
// column — most rows only have one or two of them set.
export function MaterialTableRow({
  id,
  name,
  category,
  unit,
  priceFormatted,
  needsPriceReview,
  scopeLabel,
  spec,
  grade,
  standard,
  dimensions,
  weight,
}: {
  id: string;
  name: string;
  category: string;
  unit: string;
  priceFormatted: string;
  needsPriceReview: boolean;
  scopeLabel: string;
  spec: string | null;
  grade: string | null;
  standard: string | null;
  dimensions: string | null;
  weight: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const details = [
    grade && { label: 'Grade', value: grade },
    standard && { label: 'Standard', value: standard },
    dimensions && { label: 'Dimensions', value: dimensions },
    weight && { label: 'Weight', value: weight },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <TableRow>
      <TableCell className="py-3 text-ink">
        <div className="max-w-64 truncate font-medium">{name}</div>
        <div className="text-xs text-muted-foreground">{category}</div>
        {expanded && (
          <div className="mt-1.5 flex flex-col gap-0.5 text-[11.5px] text-slate">
            {details.length > 0 ? (
              details.map((d) => (
                <span key={d.label}>
                  <span className="font-semibold">{d.label}:</span> {d.value}
                </span>
              ))
            ) : (
              <span className="italic">No additional spec on file.</span>
            )}
            {spec && <span>{spec}</span>}
          </div>
        )}
      </TableCell>
      <TableCell className="py-3 text-ink">{unit}</TableCell>
      <TableCell className="py-3 font-semibold text-ink">
        <div className="flex items-center gap-1.5">
          {priceFormatted}
          {needsPriceReview && <WarningIcon className="size-3.5 text-warning" />}
        </div>
      </TableCell>
      <TableCell className="py-3">
        <Badge variant="outline" className="w-fit border-border text-slate">
          {scopeLabel}
        </Badge>
      </TableCell>
      <TableCell className="py-3 text-right whitespace-nowrap">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mr-1.5 h-7 rounded-full border border-border-strong bg-surface px-3 text-xs font-bold text-ink hover:bg-well"
        >
          {expanded ? 'Hide' : 'View'}
        </button>
        <Link href={`/admin/materials/${id}`} className="inline-flex items-center gap-1.5 text-sm text-brand hover:underline">
          <PencilSimpleIcon className="size-3.5" />
          Edit
        </Link>
      </TableCell>
    </TableRow>
  );
}
