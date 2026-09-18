'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { FilterDropdown, FilterDropdownLabel, FilterCheckboxRow } from '@/components/ui/filter-dropdown';

const OPTIONS: { value: 'NATIONAL' | 'REGIONAL'; label: string }[] = [
  { value: 'NATIONAL', label: 'National' },
  { value: 'REGIONAL', label: 'Regional' },
];

export function MaterialScopeFilter({ current }: { current: ('NATIONAL' | 'REGIONAL')[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function toggle(value: 'NATIONAL' | 'REGIONAL') {
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (next.length === 0 || next.length === OPTIONS.length) {
      params.delete('scope');
    } else {
      params.set('scope', next.join(','));
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <FilterDropdown>
      <FilterDropdownLabel>Sourcing scope</FilterDropdownLabel>
      <div className="flex flex-col gap-1">
        {OPTIONS.map((opt) => (
          <FilterCheckboxRow key={opt.value} checked={current.includes(opt.value)} onChange={() => toggle(opt.value)}>
            {opt.label}
          </FilterCheckboxRow>
        ))}
      </div>
    </FilterDropdown>
  );
}
