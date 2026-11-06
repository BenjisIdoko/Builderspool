import type { ComponentType } from 'react';
import { pillClass, type PillTone } from '@/lib/statusColors';

const TONE_TEXT_CLASS: Record<PillTone, string> = {
  success: 'text-success',
  warning: 'text-warning-text',
  danger: 'text-danger',
  info: 'text-ink',
  neutral: 'text-ink',
};

// Shared KPI-card shell, in the two real variants every .dc.html KPI strip
// uses:
// - "default" (the dashboard-only style) — label + icon on one row, a 24px
//   value below, then a plain tone-colored text line (not a pill/badge).
// - "compact" (every list page's "quick stat" style — Orders, Sellers,
//   Materials) — label + a bare 20px tone-colored value, no icon, no chip.
export function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
  chip,
  size = 'default',
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  tone: PillTone;
  chip: string;
  size?: 'default' | 'compact';
}) {
  const compact = size === 'compact';

  if (compact) {
    return (
      <div className="overflow-hidden rounded-card bg-card-alt p-4">
        <div className="mb-2 text-label text-muted-foreground uppercase">{label}</div>
        <div className={`truncate font-mono text-figure-lg tabular-nums ${TONE_TEXT_CLASS[tone]}`}>{value}</div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card bg-card-alt p-[18px]">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="line-clamp-2 text-label text-muted-foreground uppercase">{label}</div>
        <span className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${pillClass(tone)}`}>
          <Icon className="size-3.5" />
        </span>
      </div>
      <div className="truncate font-mono text-figure-lg tabular-nums text-ink">{value}</div>
      <div className={`mt-1 text-caption font-semibold ${tone === 'success' ? 'text-success' : 'text-slate'}`}>{chip}</div>
    </div>
  );
}
