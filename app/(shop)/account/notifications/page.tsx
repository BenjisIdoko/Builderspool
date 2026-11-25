import Link from 'next/link';
import { BellRingingIcon } from '@phosphor-icons/react/ssr';
import { requireBuyer } from '@/lib/buyer/auth';
import { getNotificationsForBuyer } from '@/lib/notifications';
import { formatLagosDateTime } from '@/lib/format';
import { AccountShell, ACCOUNT_CARD } from '@/components/account-shell';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state/empty-state';
import { NoNotificationsIllustration } from '@/components/empty-state/illustrations';
import { markBuyerNotificationReadAction, markAllBuyerNotificationsReadAction, saveBuyerNotificationPreferencesAction } from '../actions';
import { getSettings } from '@/lib/settings';
import { getNotificationPreferences } from '@/lib/notifications/preferences';
import { NotificationPreferences } from '@/components/notification-preferences';
import { BUYER_NOTIFICATION_ICON, BUYER_NOTIFICATION_TONE } from '@/components/buyer-notification-bell';

export const metadata = { title: 'Notifications' };

export default async function AccountNotificationsPage() {
  const buyer = await requireBuyer();
  const [{ notifications, unreadCount }, prefs, settings] = await Promise.all([
    getNotificationsForBuyer(buyer.id, 50),
    getNotificationPreferences(buyer.id),
    getSettings(),
  ]);

  return (
    <AccountShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-1 flex items-center gap-2 text-ink">
            <BellRingingIcon aria-hidden className="size-7 shrink-0" />
            Notifications
          </h1>
          <p className="max-w-[64ch] text-pretty text-sm text-muted-foreground">
            Updates on your orders, delivery status, savings credits, reminders, and price alerts.
          </p>
        </div>
        {unreadCount > 0 && (
          <form action={markAllBuyerNotificationsReadAction}>
            <Button type="submit" variant="outline" size="sm" className="max-sm:h-11">
              Mark all as read ({unreadCount})
            </Button>
          </form>
        )}
      </div>

      <section aria-labelledby="channels-heading" className={`${ACCOUNT_CARD} mb-4 p-5 sm:p-6`}>
        <h2 id="channels-heading" className="mb-3 text-heading-sm text-ink">
          How we reach you
        </h2>
        <NotificationPreferences
          action={saveBuyerNotificationPreferencesAction}
          values={prefs}
          phone={prefs.phone}
          phoneHref="/account/profile"
          smsEnabled={Boolean(settings['notifications.smsEnabled'])}
          whatsappEnabled={Boolean(settings['notifications.whatsappEnabled'])}
          textEvents="Only key updates: payment confirmed, order and delivery updates, and payment reminders."
        />
      </section>

      <section aria-label="Your notifications" className={ACCOUNT_CARD}>
        {notifications.length === 0 ? (
          <EmptyState
            illustration={NoNotificationsIllustration}
            variant="inline"
            as="p"
            title="No notifications yet"
            description="When your orders move, savings are credited, or price alerts trigger, they'll show up here."
          >
            <Button asChild variant="outline">
              <Link href="/catalog">Browse materials</Link>
            </Button>
          </EmptyState>
        ) : (
          <ul className="divide-y divide-border">
            {notifications.map((n) => {
              const Icon = BUYER_NOTIFICATION_ICON[n.type];
              return (
                <li
                  key={n.id}
                  className={`flex flex-wrap items-start justify-between gap-4 px-5 py-4 ${
                    n.read ? '' : 'bg-info-soft/30'
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span
                      className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${BUYER_NOTIFICATION_TONE[n.type]}`}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {n.link ? (
                          <Link
                            href={n.link}
                            className="text-pretty text-sm font-semibold text-ink outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {n.title}
                          </Link>
                        ) : (
                          <span className="text-pretty text-sm font-semibold text-ink">{n.title}</span>
                        )}
                        {!n.read && (
                          <span className="inline-flex items-center rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white">
                            New
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-pretty text-sm text-slate">{n.body}</p>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatLagosDateTime(n.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {n.link && (
                      <Button asChild variant="outline" size="sm">
                        <Link href={n.link}>View</Link>
                      </Button>
                    )}
                    {!n.read && (
                      <form action={markBuyerNotificationReadAction}>
                        <input type="hidden" name="id" value={n.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Mark read
                        </Button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </AccountShell>
  );
}
