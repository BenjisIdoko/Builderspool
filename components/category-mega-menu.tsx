'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRightIcon, CaretRightIcon, ListIcon } from '@phosphor-icons/react/ssr';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export type CategoryMenuItem = { name: string; count: number; products: { id: string; name: string }[] };

// The button before the logo. It opens every category on the left; pointing at or focusing one shows
// some of its products on the right. On phones only the category list shows.
export function CategoryMegaMenu({ menu }: { menu: CategoryMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const [activeName, setActiveName] = useState(menu[0]?.name ?? '');
  const active = menu.find((c) => c.name === activeName) ?? menu[0];

  if (menu.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="All categories"
          className="flex size-11 shrink-0 items-center justify-center rounded-md text-ink outline-none transition-colors duration-150 hover:bg-well hover:text-orange-text focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-well"
        >
          <ListIcon aria-hidden className="size-6" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="w-[min(94vw,48rem)] overflow-hidden p-0">
        <div className="grid md:grid-cols-[16rem_1fr]">
          <nav aria-label="All categories" className="max-h-[70vh] overflow-y-auto border-hairline p-2 md:border-r">
            <ul>
              {menu.map((c) => (
                <li key={c.name}>
                  <Link
                    href={`/catalog?category=${encodeURIComponent(c.name)}`}
                    onClick={() => setOpen(false)}
                    onMouseEnter={() => setActiveName(c.name)}
                    onFocus={() => setActiveName(c.name)}
                    className={`flex min-h-11 items-center justify-between gap-2 rounded-md px-3 text-[15px] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring ${
                      active?.name === c.name ? 'bg-well font-semibold text-ink' : 'text-text-storefront hover:bg-well'
                    }`}
                  >
                    <span className="text-pretty">{c.name}</span>
                    <CaretRightIcon aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {active && (
            <div className="hidden p-5 md:block">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h2 className="text-heading-sm text-ink">{active.name}</h2>
                <span className="text-caption tabular-nums text-muted-foreground">{active.count} products</span>
              </div>
              <ul className="grid grid-cols-2 gap-x-6">
                {active.products.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/catalog/${p.id}`}
                      onClick={() => setOpen(false)}
                      className="flex min-h-9 items-center rounded-sm text-sm text-text-storefront outline-none hover:text-orange-text hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="line-clamp-2 text-pretty">{p.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={`/catalog?category=${encodeURIComponent(active.name)}`}
                onClick={() => setOpen(false)}
                className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-sm text-sm font-semibold text-orange-text outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                Shop all in {active.name}
                <ArrowRightIcon aria-hidden className="size-4" />
              </Link>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
