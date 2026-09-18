import Link from 'next/link';
import { FilterDropdown, FilterDropdownLabel } from '@/components/ui/filter-dropdown';
import type { OrderAmountFilter } from '@/lib/queries/adminOrders';

const OPTIONS: { value: OrderAmountFilter; label: string }[] = [
  { value: 'any', label: 'Any amount' },
  { value: 'under5m', label: 'Under ₦5M' },
  { value: 'over5m', label: '₦5M and above' },
];

// URL-driven, like every other filter on this page (status pills, search,
// sort) — navigating an option is the state change, no client-side toggle
// state of its own beyond the FilterDropdown shell's open/closed.
export function OrderAmountFilterDropdown({
  current,
  hrefFor,
}: {
  current: OrderAmountFilter;
  hrefFor: (amount: OrderAmountFilter) => string;
}) {
  return (
    <FilterDropdown>
      <FilterDropdownLabel>Escrow amount</FilterDropdownLabel>
      <div className="flex flex-col gap-1.5">
        {OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={hrefFor(opt.value)}
            className="flex items-center gap-2 py-0.5 text-[13px] text-ink no-underline hover:text-brand"
          >
            <span
              className={`flex size-3.5 shrink-0 items-center justify-center rounded-full border ${
                current === opt.value ? 'border-brand' : 'border-border-strong'
              }`}
            >
              {current === opt.value && <span className="size-1.5 rounded-full bg-brand" />}
            </span>
            {opt.label}
          </Link>
        ))}
      </div>
    </FilterDropdown>
  );
}
