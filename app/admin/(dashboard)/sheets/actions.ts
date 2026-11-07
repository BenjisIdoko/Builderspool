'use server';

import { revalidatePath } from 'next/cache';
import { CoverageStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdminUser } from '@/lib/admin/session';
import { recordAudit } from '@/lib/audit';

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
