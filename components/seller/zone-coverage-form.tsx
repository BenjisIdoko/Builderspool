'use client';

import { saveZoneCoverageAction } from '@/app/seller/(dashboard)/settings/actions';
import { ApprovalChecklist, type ApprovalStatus } from '@/components/seller/approval-checklist';

type ZoneRow = { id: string; name: string; status: ApprovalStatus };

export function ZoneCoverageForm({ zones, nationalSupply, canEdit }: { zones: ZoneRow[]; nationalSupply: boolean; canEdit: boolean }) {
  if (nationalSupply) {
    return <p className="text-pretty text-sm text-ink">Your account supplies <strong>every delivery zone</strong>, so there is nothing to choose.</p>;
  }
  if (zones.length === 0) {
    return <p className="text-sm text-muted-foreground">No delivery zones have been set up yet.</p>;
  }
  return (
    <ApprovalChecklist
      name="zoneId"
      items={zones.map((z) => ({ key: z.id, label: z.name, status: z.status }))}
      canEdit={canEdit}
      saveLabel="Save delivery zones"
      save={saveZoneCoverageAction}
    />
  );
}
