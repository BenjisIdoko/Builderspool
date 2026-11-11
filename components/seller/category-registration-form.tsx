'use client';

import { saveCategoriesAction } from '@/app/seller/(dashboard)/settings/actions';
import { ApprovalChecklist, type ApprovalStatus } from '@/components/seller/approval-checklist';

type CategoryRow = { name: string; status: ApprovalStatus };

export function CategoryRegistrationForm({ categories, canEdit }: { categories: CategoryRow[]; canEdit: boolean }) {
  if (categories.length === 0) {
    return <p className="text-sm text-muted-foreground">No product categories have been set up yet.</p>;
  }
  return (
    <ApprovalChecklist
      name="category"
      items={categories.map((c) => ({ key: c.name, label: c.name, status: c.status }))}
      canEdit={canEdit}
      saveLabel="Save categories"
      save={saveCategoriesAction}
    />
  );
}
