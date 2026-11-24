'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import {
  BellIcon,
  PackageIcon,
  ClockCountdownIcon,
  TrophyIcon,
  XCircleIcon,
  ReceiptIcon,
  WalletIcon,
  TruckIcon,
  TagIcon,
  ShoppingCartIcon,
} from '@phosphor-icons/react/ssr';
import { EmptyState } from '@/components/empty-state/empty-state';
import { NoNotificationsIllustration } from '@/components/empty-state/illustrations';
import { markBuyerNotificationReadAction, markAllBuyerNotificationsReadAction } from '@/app/(shop)/account/actions';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { formatBadgeCount } from '@/lib/format';
import type { getNotificationsForBuyer } from '@/lib/notifications';
import type { NotificationType } from '@prisma/client';

type BuyerNotification = Awaited<ReturnType<typeof getNotificationsForBuyer>>['notifications'][number];

export const BUYER_NOTIFICATION_ICON: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  CYCLE_OPENED: PackageIcon,
  CYCLE_CLOSING_SOON: ClockCountdownIcon,
  BID_WON: TrophyIcon,
  BID_LOST: XCircleIcon,
  SHEET_OPENED: PackageIcon,
  SHEET_OFFERED: TrophyIcon,
  DIRECT_ORDER_RECEIVED: PackageIcon,
  ACCEPT_REMINDER: ClockCountdownIcon,
  ORDER_PLACED: ReceiptIcon,
  ORDER_PAID: ReceiptIcon,
  PAYMENT_REMINDER: ClockCountdownIcon,
  CART_REMINDER: ShoppingCartIcon,
  ORDER_UPDATE: PackageIcon,
  SAVINGS_CREDITED: WalletIcon,
  DISPATCH_UPDATE: TruckIcon,
  PRICE_ALERT_REACHED: TagIcon,
};

export const BUYER_NOTIFICATION_TONE: Record<NotificationType, string> = {
  CYCLE_OPENED: 'bg-pale-blue text-cyan-text',
  CYCLE_CLOSING_SOON: 'bg-warning-soft text-warning-text',
  BID_WON: 'bg-success-soft text-success',
  BID_LOST: 'bg-danger-soft text-danger',
  SHEET_OPENED: 'bg-pale-blue text-cyan-text',
  SHEET_OFFERED: 'bg-success-soft text-success',
  DIRECT_ORDER_RECEIVED: 'bg-pale-blue text-cyan-text',
  ACCEPT_REMINDER: 'bg-warning-soft text-warning-text',
  ORDER_PLACED: 'bg-pale-blue text-cyan-text',
  ORDER_PAID: 'bg-success-soft text-success',
  PAYMENT_REMINDER: 'bg-warning-soft text-warning-text',
  CART_REMINDER: 'bg-warning-soft text-warning-text',
  ORDER_UPDATE: 'bg-pale-blue text-cyan-text',
  SAVINGS_CREDITED: 'bg-success-soft text-success',
  DISPATCH_UPDATE: 'bg-pale-blue text-cyan-text',
  PRICE_ALERT_REACHED: 'bg-success-soft text-success',
};

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function NotificationRow({ n }: { n: BuyerNotification }) {
  const [, startTransition] = useTransition();
  const Icon = BUYER_NOTIFICATION_ICON[n.type];

  function handleClick() {
    if (n.read) return;
    const formData = new FormData();
    formData.set('id', n.id);
    startTransition(() => {
      markBuyerNotificationReadAction(formData);
    });
  }

  return (
    <Link
      href={n.link ?? '/account/notifications'}
      onClick={handleClick}
      className={`flex w-full items-start gap-2.5 border-b border-border px-3.5 py-3 text-left outline-none transition-colors duration-150 last:border-0 hover:bg-well focus-visible:bg-well focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
        n.read ? '' : 'bg-info-soft/40'
      }`}
    >
      <span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${BUYER_NOTIFICATION_TONE[n.type]}`}>
        <Icon className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-ink">{n.title}</span>
          {!n.read && (
            <>
              <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-brand" />
              <span className="sr-only">Unread</span>
            </>
          )}
        </span>
        <span className="mt-0.5 block text-xs text-slate">{n.body}</span>
        <span className="mt-1 block text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
      </span>
    </Link>
  );
}

export function BuyerNotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: BuyerNotification[];
  unreadCount: number;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="relative size-11 rounded-md p-0 text-text-storefront hover:text-orange-text"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        >
          <BellIcon className="size-5.5" />
          {unreadCount > 0 && (
            <span
              aria-hidden
              className="absolute top-0.5 right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[11px] font-bold tabular-nums text-white"
            >
              {formatBadgeCount(unreadCount)}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
          <span className="text-sm font-bold text-ink">Notifications</span>
          {unreadCount > 0 && (
            <form action={markAllBuyerNotificationsReadAction}>
              <button
                type="submit"
                className="-my-3 rounded-sm py-3 text-xs font-medium text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                Mark all read
              </button>
            </form>
          )}
        </div>

        {notifications.length === 0 ? (
          <EmptyState
            illustration={NoNotificationsIllustration}
            variant="inline"
            as="p"
            title="No notifications yet"
            description="Order updates, savings credits, and price alerts will appear here."
          />
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((n) => (
              <NotificationRow key={n.id} n={n} />
            ))}
          </div>
        )}

        <Link
          href="/account/notifications"
          className="block border-t border-border px-3.5 py-3 text-center text-xs font-medium text-brand outline-none hover:bg-well focus-visible:bg-well focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
          View all notifications →
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
