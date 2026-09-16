import type { ComponentType } from 'react';
import { pillClass, type PillTone } from '@/lib/statusColors';
import { Badge } from '@/components/ui/badge';

// Shared KPI-card shell — used on every admin list page, the admin
// dashboard, and the seller dashboard. Radius + subtle shadow match the
// Fable handoff's real markup (confirmed across buyer, seller, and admin
// screens alike, not just buyer marketing — see DESIGN.md).
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
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.05)] ${
        compact ? 'p-4' : 'p-5'
      }`}
    >
      <div
        className={`flex items-center justify-center rounded-lg ${pillClass(tone)} ${
          compact ? 'mb-3 size-8' : 'mb-4 size-9'
        }`}
      >
        <Icon className={compact ? 'size-4' : 'size-4.5'} />
      </div>
      <div className={`text-muted-foreground ${compact ? 'mb-1 text-[11px]' : 'mb-1.5 text-[11.5px]'}`}>{label}</div>
      <div className={`truncate font-semibold text-ink ${compact ? 'mb-2 text-lg' : 'mb-2.5 text-xl'}`}>{value}</div>
      <Badge variant="outline" className={pillClass(tone)}>
        {chip}
      </Badge>
    </div>
  );
}
