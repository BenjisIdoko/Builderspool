'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react/ssr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MaterialImage } from '@/components/material-image';
import { formatNaira } from '@/lib/format';
import type { BuyerMaterial } from '@/lib/queries/materials';

// Icon-first so it never fights nav links for space at any breakpoint —
// the earlier inline search field broke the header at 1024px (see
// BUILDERSPOOL_PROJECT_BRIEF.md), so this collapses to just a button by
// default and only claims width once the user opens it.
//
// Live results (2026-09-16): debounced fetch to /api/materials/search as
// the user types, showing real matches in a dropdown — no fabricated
// "trending searches" or suggestion list, just what actually matches.
export function HeaderSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BuyerMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim();
    // Nothing to fetch — the dropdown itself is hidden whenever the query
    // is empty (see `showDropdown` below), so stale results/loading state
    // simply never renders; no need to reset it here.
    if (!trimmed) return;
    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      fetch(`/api/materials/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data: { results: BuyerMaterial[] }) => {
          setResults(data.results);
          setHighlighted(-1);
        })
        .catch((err) => {
          if (err.name !== 'AbortError') setResults([]);
        })
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  function goToCatalog(q: string) {
    router.push(q ? `/catalog?q=${encodeURIComponent(q)}` : '/catalog');
    closeSearch();
  }

  function goToMaterial(id: string) {
    router.push(`/catalog/${id}`);
    closeSearch();
  }

  function closeSearch() {
    setOpen(false);
    setQuery('');
    setResults([]);
    setHighlighted(-1);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (highlighted >= 0 && results[highlighted]) {
      goToMaterial(results[highlighted].id);
    } else {
      goToCatalog(query.trim());
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      closeSearch();
    } else if (e.key === 'ArrowDown' && results.length > 0) {
      e.preventDefault();
      setHighlighted((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp' && results.length > 0) {
      e.preventDefault();
      setHighlighted((i) => (i <= 0 ? results.length - 1 : i - 1));
    }
  }

  const showDropdown = query.trim().length > 0;

  return (
    // Phones (<lg): a real search box, always visible, fills the header.
    // Desktop: collapsed to an icon that expands on click, as before.
    <div className="relative min-w-0 flex-1 lg:flex-none">
      {!open && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="hidden size-[34px] lg:inline-flex"
          aria-label="Search materials"
          onClick={() => setOpen(true)}
        >
          <MagnifyingGlassIcon className="size-4.5" />
        </Button>
      )}
      <form onSubmit={handleSubmit} className={`flex items-center gap-1 ${open ? '' : 'lg:hidden'}`}>
        <div className="relative min-w-0 flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground lg:hidden" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            if (!query.trim()) setOpen(false);
          }}
          placeholder="Search materials…"
          aria-label="Search materials"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="header-search-results"
          autoComplete="off"
          className="h-10 w-full rounded-full bg-well pl-10 text-base lg:h-8 lg:w-64 lg:rounded-lg lg:bg-transparent lg:pl-2.5 lg:text-sm"
        />
        </div>
        {open && (
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Close search" onClick={closeSearch}>
            <XIcon className="size-4" />
          </Button>
        )}
      </form>

      {showDropdown && (
        <div
          id="header-search-results"
          role="listbox"
          // Keeps the input's blur from firing before a click on a result
          // registers — the standard combobox pattern.
          onMouseDown={(e) => e.preventDefault()}
          className="fixed inset-x-4 top-[82px] z-50 overflow-hidden rounded-lg border border-border bg-surface shadow-lg lg:absolute lg:inset-x-auto lg:top-full lg:right-0 lg:mt-2 lg:w-80"
        >
          {loading ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">Searching…</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No materials match &quot;{query.trim()}&quot;.
            </div>
          ) : (
            <>
              <ul className="max-h-80 overflow-y-auto py-1">
                {results.map((m, i) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={highlighted === i}
                      onClick={() => goToMaterial(m.id)}
                      onMouseEnter={() => setHighlighted(i)}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                        highlighted === i ? 'bg-well' : ''
                      }`}
                    >
                      <MaterialImage
                        imageUrl={m.imageUrl}
                        category={m.category}
                        alt={m.name}
                        className="size-10 shrink-0 rounded-md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-ink">{m.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{m.category}</div>
                      </div>
                      <div className="shrink-0 text-sm font-semibold text-ink">{formatNaira(m.catalogPrice)}</div>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => goToCatalog(query.trim())}
                className="block w-full border-t border-border px-4 py-2.5 text-center text-sm font-medium text-brand hover:bg-well"
              >
                See all results for &quot;{query.trim()}&quot;
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
