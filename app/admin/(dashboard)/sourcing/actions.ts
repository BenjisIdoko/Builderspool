'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminUser } from '@/lib/admin/session';
import { recordAudit } from '@/lib/audit';
import { markSourced, refundInstead } from '@/lib/sourcing';

type Result = { error: string } | { ok: true };

// Ops close a sourcing item: either the goods were found, or (last resort) the buyer is refunded.
export async function resolveSourcingAction(formData: FormData): Promise<Result> {
  const admin = await requireAdminUser();
  try {
    const id = String(formData.get('id') ?? '');
    const decision = String(formData.get('decision') ?? '');
    const note = String(formData.get('note') ?? '').trim().slice(0, 500);
    if (decision === 'sourced') {
      await markSourced(id, admin.id, note || null);
    } else if (decision === 'refund') {
      if (note.length < 3) throw new Error('Say why it could not be sourced before refunding.');
      await refundInstead(id, admin.id, note);
    } else {
      throw new Error('Choose sourced or refund.');
    }
    await recordAudit({
      actor: { id: admin.id, role: admin.role },
      action: decision === 'sourced' ? 'sourcing.sourced' : 'sourcing.refunded',
      entityType: 'OpsSourcing',
      entityId: id,
      summary: decision === 'sourced' ? `Marked sourced${note ? `: ${note}` : ''}` : `Refunded instead: ${note}`,
    });
    revalidatePath('/admin/sourcing');
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not save that.' };
  }
}
