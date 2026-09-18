import Link from 'next/link';
import { BellIcon } from '@phosphor-icons/react/ssr';

// No admin notification system exists (lib/notifications is seller-only) —
// rather than fabricate one, the bell surfaces the same real "needs
// attention" total the dashboard's own panel computes (pending seller
// verification + materials needing price review + allocations awaiting
// hub GRN), and links straight to it.
export function AdminAlertsBell({ count }: { count: number }) {
  return (
    <Link href="/admin" className="relative flex items-center" aria-label="Needs attention">
      <BellIcon className="size-[18px] text-slate" />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
}
