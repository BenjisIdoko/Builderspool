'use server';

import { revalidatePath } from 'next/cache';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdminUser } from '@/lib/admin/session';
import { hashPassword } from '@/lib/auth/password';
import { revokeAllSessions } from '@/lib/auth/sessionStore';
import { recordAudit } from '@/lib/audit';
import { safeAction } from '@/lib/actions/safe';

// The internal operations roles an admin can create (Transfer File 5.1).
// Their sign-in and consoles ship with the catalogue (QC) and fulfilment
// phases; until then the accounts exist, can be disabled, and are audited.
const INTERNAL_ROLES = [Role.QC_OFFICER, Role.FULFILMENT_OPERATOR, Role.DELIVERY_PARTNER] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

export async function createTeamMemberAction(formData: FormData): Promise<{ error: string } | { ok: true }> {
  const admin = await requireAdminUser();
  try {
    const name = text(formData, 'name');
    const email = text(formData, 'email').toLowerCase();
    const password = text(formData, 'password');
    const role = text(formData, 'role');

    if (!INTERNAL_ROLES.some((r) => r === role)) throw new Error('Choose a role.');
    if (!name) throw new Error('Enter a name.');
    if (!EMAIL_RE.test(email)) throw new Error('Enter a valid email address.');
    if (password.length < 8) throw new Error('The starting password must be at least 8 characters.');
    if (await prisma.user.findUnique({ where: { email } })) throw new Error('An account with that email already exists.');

    const user = await prisma.user.create({
      data: { role: role as Role, name, email, passwordHash: await hashPassword(password) },
    });
    await recordAudit({
      actor: { id: admin.id, role: admin.role },
      action: 'team.member_created',
      entityType: 'User',
      entityId: user.id,
      summary: `Created ${role.toLowerCase().replace(/_/g, ' ')} account for ${name}`,
    });
    revalidatePath('/admin/team');
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not create that account.' };
  }
}

async function setTeamMemberDisabledActionImpl(formData: FormData) {
  const admin = await requireAdminUser();
  const userId = text(formData, 'userId');
  const disable = text(formData, 'disable') === 'true';

  const member = await prisma.user.findFirst({
    where: { id: userId, role: { in: [...INTERNAL_ROLES] } },
    select: { id: true, name: true },
  });
  if (!member) throw new Error('That team member was not found.');

  await prisma.user.update({ where: { id: member.id }, data: { disabledAt: disable ? new Date() : null } });
  if (disable) await revokeAllSessions(member.id);

  await recordAudit({
    actor: { id: admin.id, role: admin.role },
    action: disable ? 'team.member_disabled' : 'team.member_enabled',
    entityType: 'User',
    entityId: member.id,
    summary: `${disable ? 'Disabled' : 'Re-enabled'} the account of ${member.name}`,
  });
  revalidatePath('/admin/team');
}

export const setTeamMemberDisabledAction = safeAction(setTeamMemberDisabledActionImpl);
