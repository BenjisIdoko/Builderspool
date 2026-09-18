'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import {
  BellIcon,
  PackageIcon,
  ClockCountdownIcon,
  TrophyIcon,
  XCircleIcon,
} from '@phosphor-icons/react/ssr';
import { markNotificationReadAction, markAllNotificationsReadAction } from '@/app/seller/actions';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import type { getNotificationsForSeller } from '@/lib/notifications';
import type { NotificationType } from '@prisma/client';

type Notification = Awaited<ReturnType<typeof getNotificationsForSeller>>['notifications'][number];

const TYPE_ICON: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  CYCLE_OPENED: PackageIcon,
  CYCLE_CLOSING_SOON: ClockCountdownIcon,
  BID_WON: TrophyIcon,
  BID_LOST: XCircleIcon,
};

const TYPE_TONE: Record<NotificationType, string> = {
  CYCLE_OPENED: 'bg-info-soft text-info',
  CYCLE_CLOSING_SOON: 'bg-warning-soft text-warning',
  BID_WON: 'bg-success-soft text-success',
  BID_LOST: 'bg-danger-soft text-danger',
};

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function NotificationRow({ n }: { n: Notification }) {
  const [, startTransition] = useTransition();
  const Icon = TYPE_ICON[n.type];

  function handleClick() {
    if (n.read) return;
    const formData = new FormData();
    formData.set('id', n.id);
    // Fire-and-forget — navigation via the Link shouldn't wait on this.
    startTransition(() => {
      markNotificationReadAction(formData);
    });
  }

  return (
    <Link
      href={n.link ?? '#'}
      onClick={handleClick}
      className={`flex w-full items-start gap-2.5 border-b border-border px-3.5 py-3 text-left last:border-0 hover:bg-well ${
        n.read ? '' : 'bg-info-soft/40'
      }`}
    >
      <span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${TYPE_TONE[n.type]}`}>
        <Icon className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-ink">{n.title}</span>
          {!n.read && <span className="size-1.5 shrink-0 rounded-full bg-brand" />}
        </span>
        <span className="mt-0.5 block text-xs text-slate">{n.body}</span>
        <span className="mt-1 block text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
      </span>
    </Link>
  );
}

export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: Notification[];
  unreadCount: number;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" className="relative" aria-label="Notifications">
          <BellIcon className="size-4.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
          <span className="text-sm font-bold text-ink">Notifications</span>
          {unreadCount > 0 && (
            <form action={markAllNotificationsReadAction}>
              <button type="submit" className="text-xs font-medium text-brand hover:underline">
                Mark all read
              </button>
            </form>
          )}
        </div>

        {notifications.length === 0 ? (
          <p className="px-3.5 py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((n) => (
              <NotificationRow key={n.id} n={n} />
            ))}
          </div>
        )}

        {notifications.length > 0 && (
          <Link
            href="/seller"
            className="block border-t border-border px-3.5 py-2.5 text-center text-xs font-medium text-brand hover:bg-well"
          >
            View open demand pools →
          </Link>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
