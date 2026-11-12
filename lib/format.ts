const nairaFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

/** A count for a small badge: exact up to 99, then "99+" so it never crowds its icon. */
export function formatBadgeCount(count: number) {
  return count > 99 ? '99+' : String(count);
}

export function formatNaira(amount: number) {
  return nairaFormatter.format(amount);
}

// "2 days, 6 hours" since `since`, rounded down to whole units — always at
// least "under an hour" rather than "0 hours". Takes a Date (not a
// precomputed ms figure) so the Date.now() call lives in this plain utility
// rather than in a component's render body.
export function formatElapsedSince(since: Date) {
  const ms = Date.now() - since.getTime();
  const totalHours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days === 0 && hours === 0) return 'Under an hour';
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  return parts.join(', ');
}

// ---- Times, shown to people the way Nigerians say them: "5pm", "7:50pm", "12pm".
// Stored and compared times stay "HH:MM" (24-hour); these only format what is displayed.
const LAGOS = 'Africa/Lagos';

/** "17:00" -> "5pm", "19:50" -> "7:50pm", "12:00" -> "12pm", "00:30" -> "12:30am". */
export function formatClock(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
  const suffix = h % 24 >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, '0')}${suffix}`;
}

/** The time of day of `date` in Lagos, as "5pm" or "7:50pm". */
export function formatLagosClock(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: LAGOS }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return formatClock(`${get('hour')}:${get('minute')}`);
}

/** "10 Nov 2026, 5pm" in Lagos time (never the server's own time zone). */
export function formatLagosDateTime(date: Date): string {
  return `${date.toLocaleDateString('en-NG', { dateStyle: 'medium', timeZone: LAGOS })}, ${formatLagosClock(date)}`;
}

/** "10 Nov 2026" in Lagos time (never the server's own time zone). */
export function formatLagosDate(date: Date | null | undefined): string {
  if (!date) return '';
  return date.toLocaleDateString('en-NG', { dateStyle: 'medium', timeZone: LAGOS });
}
