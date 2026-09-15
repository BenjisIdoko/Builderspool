'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react/ssr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Icon-first so it never fights nav links for space at any breakpoint —
// the earlier inline search field broke the header at 1024px (see
// BUILDERSPOOL_PROJECT_BRIEF.md), so this collapses to just a button by
// default and only claims width once the user opens it.
export function HeaderSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/catalog?q=${encodeURIComponent(q)}` : '/catalog');
    setOpen(false);
    setQuery('');
  }

  if (!open) {
    return (
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Search materials" onClick={() => setOpen(true)}>
        <MagnifyingGlassIcon className="size-4.5" />
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1">
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => {
          if (!query.trim()) setOpen(false);
        }}
        placeholder="Search materials…"
        aria-label="Search materials"
        className="w-36 sm:w-56"
      />
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Close search" onClick={() => setOpen(false)}>
        <XIcon className="size-4" />
      </Button>
    </form>
  );
}
