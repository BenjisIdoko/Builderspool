'use client';

import { useEffect, useRef, useState } from 'react';
import { FunnelIcon } from '@phosphor-icons/react/ssr';
import { cn } from 'cn';

// Shared trigger+popover shell for a table's "Filter" affordance — checkbox/
// radio option groups differ per screen, so callers supply the panel content
// as children; this only owns open/close and click-outside behavior.
export function FilterDropdown({
  label = 'Filter',
  children,
  className,
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-[34px] items-center gap-1.5 rounded-lg border border-border-strong bg-surface px-3.5 text-[13px] font-semibold text-ink hover:bg-well"
      >
        <FunnelIcon className="size-4" />
        {label}
      </button>
      {open && (
        <div className="absolute top-10 right-0 z-20 w-56 rounded-xl border border-border bg-surface p-3.5 shadow-[0_16px_36px_rgba(16,24,40,0.15)]">
          {children}
        </div>
      )}
    </div>
  );
}

export function FilterDropdownLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2.5 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">{children}</div>
  );
}

export function FilterCheckboxRow({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 py-1 text-[13px] text-ink">
      <input type="checkbox" checked={checked} onChange={onChange} className="size-3.5 accent-brand" />
      {children}
    </label>
  );
}

export function FilterRadioRow({
  name,
  checked,
  onChange,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 py-1 text-[13px] text-ink">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="size-3.5 accent-brand" />
      {children}
    </label>
  );
}
