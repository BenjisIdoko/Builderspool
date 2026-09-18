'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, ReceiptIcon, StorefrontIcon, PackageIcon } from '@phosphor-icons/react/ssr';
import type { SearchResult } from '@/app/api/admin/search/route';

const SearchContext = createContext<{ open: () => void } | null>(null);

const RESULT_ICON: Record<SearchResult['type'], typeof ReceiptIcon> = {
  order: ReceiptIcon,
  seller: StorefrontIcon,
  material: PackageIcon,
};

// Real search only — no fabricated global index. Queries the same real
// order/seller/material data each portal's own pages already filter,
// through a small per-portal API route (see app/api/admin/search,
// app/api/seller/search). One overlay instance per portal, opened from
// either the sidebar's or the topbar's search box, or Cmd/Ctrl+K anywhere.
export function SearchProvider({ portal, children }: { portal: 'admin' | 'seller'; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, []);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 0);
  }, [isOpen]);

  useEffect(() => {
    const trimmed = query.trim();
    const handle = setTimeout(async () => {
      if (trimmed.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/${portal}/search?q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [query, portal]);

  function close() {
    setIsOpen(false);
    setQuery('');
    setResults([]);
  }

  function goTo(href: string) {
    close();
    router.push(href);
  }

  return (
    <SearchContext.Provider value={{ open: () => setIsOpen(true) }}>
      {children}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 px-4 pt-[15vh]"
          onClick={close}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_16px_40px_rgba(16,24,40,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 border-b border-border px-4 py-3.5">
              <MagnifyingGlassIcon className="size-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search orders, sellers, materials…"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="max-h-80 overflow-y-auto">
              {query.trim().length < 2 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">Type at least 2 characters…</p>
              ) : loading ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">Searching…</p>
              ) : results.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">No matches for &quot;{query}&quot;.</p>
              ) : (
                results.map((r, i) => {
                  const Icon = RESULT_ICON[r.type];
                  return (
                    <button
                      key={`${r.type}-${r.label}-${i}`}
                      type="button"
                      onClick={() => goTo(r.href)}
                      className="flex w-full items-center gap-3 border-b border-border px-4 py-2.5 text-left last:border-0 hover:bg-well"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-well text-slate">
                        <Icon className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-ink">{r.label}</span>
                        <span className="block truncate text-xs text-muted-foreground">{r.sublabel}</span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </SearchContext.Provider>
  );
}

function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch must be used within a SearchProvider');
  return ctx;
}

// Wide "Search anything…" pill — matches the topbar's box in the design.
// Admin's box is 240px, seller's is 220px, per every .dc.html that has one.
export function TopbarSearchTrigger({ width = 240 }: { width?: number }) {
  const { open } = useSearch();
  return (
    <button
      type="button"
      onClick={open}
      style={{ width }}
      className="flex h-[34px] shrink-0 items-center gap-2 rounded-[9px] border border-border bg-well px-3 text-left text-[12.5px] text-muted-foreground hover:bg-well/70"
    >
      <MagnifyingGlassIcon className="size-3.5 shrink-0" />
      Search anything…
    </button>
  );
}

// Compact "Search ⌘K" box — matches the sidebar's box in the design.
export function SidebarSearchTrigger() {
  const { open } = useSearch();
  return (
    <button
      type="button"
      onClick={open}
      className="flex h-[34px] w-full items-center gap-2 rounded-[9px] border border-border bg-well px-2.5 text-left text-[12.5px] text-muted-foreground hover:bg-well/70"
    >
      <MagnifyingGlassIcon className="size-3.5 shrink-0" />
      <span className="flex-1">Search</span>
      <span className="shrink-0 rounded-[5px] border border-border-strong bg-surface px-1.5 py-0.5 text-[10.5px] text-muted-foreground">
        ⌘K
      </span>
    </button>
  );
}
