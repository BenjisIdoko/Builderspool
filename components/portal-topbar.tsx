'use client';

import { usePathname } from 'next/navigation';
import { Avatar } from '@/components/avatar';
import { TopbarSearchTrigger } from '@/components/portal-search';

const ADMIN_LABELS: [string, string][] = [
  ['/admin/orders', 'Orders & escrow'],
  ['/admin/sellers', 'Seller directory & verification'],
  ['/admin/materials', 'Materials & pricing oversight'],
  ['/admin/catalogue-reference', 'Master reference catalogue'],
  ['/admin/haulage', 'Haulage & dispatch'],
  ['/admin/escrow', 'Escrow settlement'],
  ['/admin/savings', 'Savings settlement'],
  ['/admin/users', 'Users'],
  ['/admin/verification', 'Vendor verification'],
  ['/admin/cycles', 'Ops desk'],
  ['/admin', 'Ops desk'],
];

const SELLER_LABELS: [string, string][] = [
  ['/seller/bids', 'My bids'],
  ['/seller/orders', 'Orders'],
  ['/seller/allocations', 'Allocations'],
  ['/seller/payouts', 'Payouts'],
  ['/seller/kyc', 'KYC verification'],
  ['/seller/settings', 'Settings'],
  ['/seller', 'Merchant dashboard'],
];

function getBreadcrumb(portal: 'admin' | 'seller', pathname: string): { parent?: string; label: string } {
  const orderDetailMatch = pathname.match(/^\/admin\/orders\/([^/]+)$/);
  if (orderDetailMatch) {
    return { parent: 'Orders', label: `#${orderDetailMatch[1].slice(-6).toUpperCase()}` };
  }

  const table = portal === 'admin' ? ADMIN_LABELS : SELLER_LABELS;
  const match = [...table].sort((a, b) => b[0].length - a[0].length).find(([prefix]) => pathname.startsWith(prefix));
  return { label: match?.[1] ?? (portal === 'admin' ? 'Ops desk' : 'Merchant dashboard') };
}

export function PortalTopbar({
  portal,
  name,
  bellSlot,
}: {
  portal: 'admin' | 'seller';
  name: string;
  bellSlot: React.ReactNode;
}) {
  const pathname = usePathname();
  const { parent, label } = getBreadcrumb(portal, pathname);

  return (
    <div className="hidden h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-8 lg:flex">
      <div className="text-[13px] text-muted-foreground">
        Console
        {parent && (
          <>
            <span className="mx-1">/</span>
            {parent}
          </>
        )}
        <span className="mx-1">/</span>
        <span className="font-semibold text-ink">{label}</span>
      </div>
      <div className="flex items-center gap-4">
        <TopbarSearchTrigger />
        {bellSlot}
        <Avatar name={name} className="size-[30px] text-xs" />
      </div>
    </div>
  );
}
