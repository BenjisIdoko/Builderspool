'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ListIcon } from '@phosphor-icons/react/ssr';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose, SheetTrigger } from '@/components/ui/sheet';

export function MobileNav({
  links,
  title,
  hideFrom = 'lg',
}: {
  links: { href: string; label: string }[];
  title: string;
  /** Tailwind breakpoint at which the full nav takes over and this trigger hides. */
  hideFrom?: 'sm' | 'lg';
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Open menu"
          className={hideFrom === 'sm' ? 'sm:hidden' : 'lg:hidden'}
        >
          <ListIcon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader className="border-b border-border">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-2">
          {links.map((link) => (
            <SheetClose asChild key={link.href}>
              <Link
                href={link.href}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-slate transition-colors hover:bg-well hover:text-ink"
              >
                {link.label}
              </Link>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
