'use server';

import { revalidatePath } from 'next/cache';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSellerOwner } from '@/lib/seller/session';
import { issueInviteUrl } from '@/lib/auth/invite';
import { revokeAllSessions } from '@/lib/auth/sessionStore';
import { recordAudit } from '@/lib/audit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_STAFF = 10;

function text(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

// The owner adds a staff login and gets a one-time invite link to hand over
// (email delivery isn't live yet). The staff member opens it and chooses their
// own password, so the owner never knows it. Staff act on the owner's seller
// account but cannot change KYC, bank details, terms or the team itself.
export async function addStaffAction(
  formData: FormData,
): Promise<{ error: string } | { ok: true; inviteUrl: string; name: string }> {
  const owner = await requireSellerOwner();
  try {
    const name = text(formData, 'name');
    const email = text(formData, 'email').toLowerCase();

    if (!name) throw new Error('Enter the staff member’s name.');
    if (!EMAIL_RE.test(email)) throw new Error('Enter a valid email address.');

    const count = await prisma.sellerStaff.count({ where: { sellerUserId: owner.sellerId } });
    if (count >= MAX_STAFF) throw new Error(`You can have up to ${MAX_STAFF} staff accounts.`);
    if (await prisma.user.findUnique({ where: { email } })) throw new Error('An account with that email already exists.');

    // No password yet: the account cannot sign in until the invite is used.
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({ data: { role: Role.SELLER_STAFF, name, email } });
      await tx.sellerStaff.create({ data: { userId: created.id, sellerUserId: owner.sellerId, createdById: owner.userId } });
      return created;
    });
    const inviteUrl = await issueInviteUrl(user.id, 'seller');

    await recordAudit({
      actor: { id: owner.userId, role: 'SELLER' },
      action: 'seller_staff.added',
      entityType: 'User',
      entityId: user.id,
      summary: `Added seller staff ${name} (invite link issued)`,
    });
    revalidatePath('/seller/team');
    return { ok: true, inviteUrl, name };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not add that staff member.' };
  }
}

// A new link for a staff member who has not used their invite yet (the old one
// expired or was lost). Refused once they have a password, so an owner can
// never mint a link into an account that is already in use.
export async function reissueStaffInviteAction(
  formData: FormData,
): Promise<{ error: string } | { ok: true; inviteUrl: string; name: string }> {
  const owner = await requireSellerOwner();
  try {
    const staffUserId = text(formData, 'staffUserId');
    const membership = await prisma.sellerStaff.findFirst({
      where: { userId: staffUserId, sellerUserId: owner.sellerId },
      include: { user: { select: { id: true, name: true, passwordHash: true, disabledAt: true } } },
    });
    if (!membership) throw new Error('That staff member is not on your team.');
    if (membership.user.disabledAt) throw new Error('That account has been removed.');
    if (membership.user.passwordHash) throw new Error('They have already set a password. They can use "Forgot password" instead.');

    const inviteUrl = await issueInviteUrl(membership.user.id, 'seller');
    await recordAudit({
      actor: { id: owner.userId, role: 'SELLER' },
      action: 'seller_staff.invite_reissued',
      entityType: 'User',
      entityId: membership.user.id,
      summary: `Issued a new invite link for ${membership.user.name}`,
    });
    return { ok: true, inviteUrl, name: membership.user.name };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not create a new link.' };
  }
}

// Returns what went wrong as text so the team page can show it in its dialog.
export async function removeStaffAction(formData: FormData): Promise<{ error: string } | { ok: true }> {
  const owner = await requireSellerOwner();
  const staffUserId = text(formData, 'staffUserId');

  const membership = await prisma.sellerStaff.findFirst({
    where: { userId: staffUserId, sellerUserId: owner.sellerId },
    include: { user: { select: { name: true } } },
  });
  if (!membership) return { error: 'That person is no longer on your team. Refresh the page.' };

  await prisma.$transaction([
    prisma.user.update({ where: { id: staffUserId }, data: { disabledAt: new Date() } }),
    prisma.sellerStaff.delete({ where: { id: membership.id } }),
  ]);
  await revokeAllSessions(staffUserId);

  await recordAudit({
    actor: { id: owner.userId, role: 'SELLER' },
    action: 'seller_staff.removed',
    entityType: 'User',
    entityId: staffUserId,
    summary: `Removed seller staff ${membership.user.name}`,
  });
  revalidatePath('/seller/team');
  return { ok: true };
}
