const nairaFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

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
