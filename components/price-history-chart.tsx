import { formatNaira } from '@/lib/format';

const WIDTH = 560;
const HEIGHT = 160;
const PAD_X = 8;
const PAD_TOP = 12;
const PAD_BOTTOM = 28;

function formatDate(date: Date) {
  return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

export function PriceHistoryChart({ points }: { points: { date: Date; price: number }[] }) {
  if (points.length < 2) {
    return (
      <p className="text-sm text-muted-foreground">
        No price history yet — this material&apos;s price will show up here once it changes.
      </p>
    );
  }

  const minDate = points[0].date.getTime();
  const maxDate = points[points.length - 1].date.getTime();
  const dateSpan = Math.max(1, maxDate - minDate);

  const prices = points.map((p) => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceSpan = maxPrice - minPrice;
  // Flat history (the common case, since nothing changes catalogPrice yet) —
  // pad the domain so the line sits mid-chart instead of glued to an edge.
  const padPrice = priceSpan === 0 ? Math.max(1, minPrice * 0.05) : priceSpan * 0.1;
  const domainMin = minPrice - padPrice;
  const domainMax = maxPrice + padPrice;

  const x = (date: Date) => PAD_X + ((date.getTime() - minDate) / dateSpan) * (WIDTH - PAD_X * 2);
  const y = (price: number) =>
    PAD_TOP + (1 - (price - domainMin) / (domainMax - domainMin)) * (HEIGHT - PAD_TOP - PAD_BOTTOM);

  // Step-after: price holds flat between snapshots, then jumps — a rate
  // chart, not a smooth continuous one.
  let linePath = `M ${x(points[0].date)} ${y(points[0].price)}`;
  let areaPath = `M ${x(points[0].date)} ${y(points[0].price)}`;
  for (let i = 1; i < points.length; i++) {
    const stepX = x(points[i].date);
    const prevY = y(points[i - 1].price);
    const curY = y(points[i].price);
    linePath += ` L ${stepX} ${prevY} L ${stepX} ${curY}`;
    areaPath += ` L ${stepX} ${prevY} L ${stepX} ${curY}`;
  }
  const floorY = HEIGHT - PAD_BOTTOM;
  areaPath += ` L ${x(points[points.length - 1].date)} ${floorY} L ${x(points[0].date)} ${floorY} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Price history">
        <path d={areaPath} fill="var(--color-brand)" fillOpacity={0.08} stroke="none" />
        <path d={linePath} fill="none" stroke="var(--color-brand)" strokeWidth={2} strokeLinejoin="round" />
        {points.slice(0, -1).map((p, i) => (
          <circle key={i} cx={x(p.date)} cy={y(p.price)} r={3} fill="var(--color-brand)" />
        ))}
        <text x={PAD_X} y={HEIGHT - 8} className="fill-muted-foreground text-[10px]">
          {formatDate(points[0].date)}
        </text>
        <text x={WIDTH - PAD_X} y={HEIGHT - 8} textAnchor="end" className="fill-muted-foreground text-[10px]">
          {formatDate(points[points.length - 1].date)}
        </text>
      </svg>
      {minPrice !== maxPrice && (
        <p className="mt-2 text-xs text-muted-foreground">
          Ranged <span>{formatNaira(minPrice)} – {formatNaira(maxPrice)}</span> over this period.
        </p>
      )}
    </div>
  );
}
