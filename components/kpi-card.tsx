import type { ComponentType } from 'react';
import { pillClass, type PillTone } from '@/lib/statusColors';

const TONE_TEXT_CLASS: Record<PillTone, string> = {
  success: 'text-success',
  warning: 'text-warning',
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
      <div className="overflow-hidden rounded-[14px] border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_20px_rgba(16,24,40,0.05)]">
        <div className="mb-2 text-[11.5px] font-bold tracking-[0.04em] text-muted-foreground uppercase">{label}</div>
        <div className={`truncate text-xl font-extrabold ${TONE_TEXT_CLASS[tone]}`}>{value}</div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface p-[18px] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.05)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-xs font-bold tracking-[0.04em] text-muted-foreground uppercase">{label}</div>
        <span className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${pillClass(tone)}`}>
          <Icon className="size-3.5" />
        </span>
      </div>
      <div className="truncate text-2xl font-extrabold text-ink">{value}</div>
      <div className={`mt-1 text-xs font-semibold ${tone === 'success' ? 'text-success' : 'text-slate'}`}>{chip}</div>
    </div>
  );
}
