'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckIcon, ClipboardTextIcon, DotsThreeVerticalIcon, EyeIcon } from '@phosphor-icons/react/ssr';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function OrderRowActions({ orderId, shortId }: { orderId: string; shortId: string }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  async function copyId() {
    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be denied by the browser — silently no-op,
      // the id is still visible on hover via the row's own title attribute.
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Actions for order ${shortId}`}>
          <DotsThreeVerticalIcon className="size-4.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => router.push(`/admin/orders/${orderId}`)}>
          <EyeIcon />
          Open order
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={copyId}>
          {copied ? <CheckIcon className="text-success" /> : <ClipboardTextIcon />}
          <span role="status">{copied ? 'Copied' : 'Copy order ID'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
