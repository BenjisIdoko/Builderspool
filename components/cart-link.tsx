'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart/CartContext';

export function CartLink() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/cart"
      className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-ink transition-colors hover:border-ink/20"
    >
      Cart
      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-xs font-medium text-white">
        {itemCount}
      </span>
    </Link>
  );
}
