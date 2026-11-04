export type ExpiryState = 'expired' | 'soon' | 'ok';

// How a supporting document's expiry date reads today. `warnDays` comes from
// the accounts.documentExpiryWarnDays setting. Dates are compared as calendar
// days so a document expiring "today" still counts as valid until tomorrow.
export function documentExpiryState(expiresAt: Date | null, warnDays: number, now = new Date()): { state: ExpiryState; daysLeft: number } | null {
  if (!expiresAt) return null;
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const daysLeft = Math.round((startOfDay(expiresAt) - startOfDay(now)) / 86_400_000);
  if (daysLeft < 0) return { state: 'expired', daysLeft };
  return { state: daysLeft <= warnDays ? 'soon' : 'ok', daysLeft };
}

export function describeExpiry(info: { state: ExpiryState; daysLeft: number }): string {
  if (info.state === 'expired') return `Expired ${Math.abs(info.daysLeft)} ${Math.abs(info.daysLeft) === 1 ? 'day' : 'days'} ago`;
  if (info.daysLeft === 0) return 'Expires today';
  return `Expires in ${info.daysLeft} ${info.daysLeft === 1 ? 'day' : 'days'}`;
}
