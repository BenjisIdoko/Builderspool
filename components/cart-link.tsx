'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function CartLink() {
  const { itemCount } = useCart();

  return (
    <Button asChild variant="outline">
      <Link href="/cart" className="gap-2">
        Cart
        <Badge className="rounded-full">{itemCount}</Badge>
      </Link>
    </Button>
  );
}
