'use server';

import { revalidatePath } from 'next/cache';
import { CoverageStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdminUser } from '@/lib/admin/session';
import { recordAudit } from '@/lib/audit';
import { disburseSheetPayout, failSheetFulfilment, issueSheetGrn, toggleSheetFulfilmentHold } from '@/lib/sheets';

// Ops approve or decline a vendor's request to bid for a category. Only a
// request still waiting can be decided, so a double click does nothing twice.
export async function decideCategoryAction(formData: FormData) {
  const admin = await requireAdminUser();
  const id = String(formData.get('categoryId') ?? '');
  const approve = formData.get('decision') === 'approve';
  const row = await prisma.sellerCategory.findUnique({
    where: { id },
    include: { seller: { select: { name: true, businessName: true } } },
  });
  if (!row || row.status !== CoverageStatus.PENDING) return;

  const { count } = await prisma.sellerCategory.updateMany({
    where: { id, status: CoverageStatus.PENDING },
    data: { status: approve ? CoverageStatus.APPROVED : CoverageStatus.REVOKED, decidedAt: new Date(), decidedById: admin.id },
  });
  if (count === 0) return;
  await recordAudit({
    actor: { id: admin.id, role: admin.role },
    action: approve ? 'sheets.category_approved' : 'sheets.category_declined',
    entityType: 'SellerCategory',
    entityId: id,
    summary: `${approve ? 'Approved' : 'Declined'} ${row.seller.businessName ?? row.seller.name} for ${row.category}`,
  });
  revalidatePath('/admin/sheets');
}

function lineId(formData: FormData): string {
  const id = formData.get('id');
  if (typeof id !== 'string' || !id) throw new Error('Missing order line.');
  return id;
}

function refresh() {
  revalidatePath('/admin/sheets');
  revalidatePath('/admin/direct');
  revalidatePath('/admin/escrow');
  revalidatePath('/seller/rfqs');
}

// The fulfilment centre has received the goods and the quality check passed.
export async function issueSheetGrnAction(formData: FormData) {
  const admin = await requireAdminUser();
  const id = lineId(formData);
  await issueSheetGrn(id);
  await recordAudit({ actor: { id: admin.id, role: admin.role }, action: 'sheet.grn_issued', entityType: 'SheetFulfilment', entityId: id, summary: 'Issued a goods received note for a sheet line' });
  refresh();
}

export async function disburseSheetPayoutAction(formData: FormData) {
  const admin = await requireAdminUser();
  const id = lineId(formData);
  await disburseSheetPayout(id);
  await recordAudit({ actor: { id: admin.id, role: admin.role }, action: 'sheet.payout_disbursed', entityType: 'SheetFulfilment', entityId: id, summary: 'Disbursed a sheet vendor payout' });
  refresh();
}

export async function holdSheetFulfilmentAction(formData: FormData) {
  const admin = await requireAdminUser();
  const id = lineId(formData);
  const note = String(formData.get('note') ?? '');
  const row = await toggleSheetFulfilmentHold(id, note);
  await recordAudit({
    actor: { id: admin.id, role: admin.role },
    action: row.payoutStatus === 'ON_HOLD' ? 'sheet.payout_held' : 'sheet.payout_released',
    entityType: 'SheetFulfilment',
    entityId: id,
    summary: row.payoutStatus === 'ON_HOLD' ? `Held a sheet vendor payout: ${row.holdReason}` : 'Released the hold on a sheet vendor payout',
  });
  refresh();
}

// The vendor accepted the sheet but did not supply this line. It goes back to the
// seller the buyer picked, or is refunded.
export async function failSheetFulfilmentAction(formData: FormData) {
  const admin = await requireAdminUser();
  const id = lineId(formData);
  const reason = String(formData.get('reason') ?? '');
  await failSheetFulfilment(id, reason);
  await recordAudit({ actor: { id: admin.id, role: admin.role }, action: 'sheet.line_failed', entityType: 'SheetFulfilment', entityId: id, summary: `Marked a sheet line as not supplied: ${reason.trim().slice(0, 200)}` });
  refresh();
}
