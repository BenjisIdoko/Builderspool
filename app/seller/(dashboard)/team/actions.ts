'use server';

import { revalidatePath } from 'next/cache';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSellerOwner } from '@/lib/seller/session';
import { hashPassword } from '@/lib/auth/password';
import { revokeAllSessions } from '@/lib/auth/sessionStore';
import { recordAudit } from '@/lib/audit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_STAFF = 10;

function text(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

// The owner creates a staff login with a starting password they share with
// the person (email delivery isn't live yet). Staff act on the owner's seller
// account but cannot change KYC, bank details, terms or the team itself.
export async function addStaffAction(formData: FormData): Promise<{ error: string } | { ok: true }> {
  const owner = await requireSellerOwner();
  try {
    const name = text(formData, 'name');
    const email = text(formData, 'email').toLowerCase();
    const password = text(formData, 'password');

    if (!name) throw new Error('Enter the staff member’s name.');
    if (!EMAIL_RE.test(email)) throw new Error('Enter a valid email address.');
    if (password.length < 8) throw new Error('The starting password must be at least 8 characters.');

    const count = await prisma.sellerStaff.count({ where: { sellerUserId: owner.sellerId } });
    if (count >= MAX_STAFF) throw new Error(`You can have up to ${MAX_STAFF} staff accounts.`);
    if (await prisma.user.findUnique({ where: { email } })) throw new Error('An account with that email already exists.');

    const passwordHash = await hashPassword(password);
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({ data: { role: Role.SELLER_STAFF, name, email, passwordHash } });
      await tx.sellerStaff.create({ data: { userId: created.id, sellerUserId: owner.sellerId, createdById: owner.userId } });
      return created;
    });

    await recordAudit({
      actor: { id: owner.userId, role: 'SELLER' },
      action: 'seller_staff.added',
      entityType: 'User',
      entityId: user.id,
      summary: `Added seller staff ${name}`,
    });
    revalidatePath('/seller/team');
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not add that staff member.' };
  }
}

export async function removeStaffAction(formData: FormData) {
  const owner = await requireSellerOwner();
  const staffUserId = text(formData, 'staffUserId');

  const membership = await prisma.sellerStaff.findFirst({
    where: { userId: staffUserId, sellerUserId: owner.sellerId },
    include: { user: { select: { name: true } } },
  });
  if (!membership) throw new Error('That staff member is not on your team.');

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
}
