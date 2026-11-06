import { prisma } from '@/lib/prisma';
import { generateToken, hashToken } from '@/lib/auth/tokens';
import { getRequestOrigin } from '@/lib/http/origin';

// An invite is a password-reset token the owner hands to a new staff member:
// the staff member opens the link and chooses their own password, so nobody
// else ever knows it. Only the token's hash is stored. A link lasts 72 hours
// (longer than an emailed reset, because it travels by hand) and works once.
const INVITE_TTL_MS = 72 * 60 * 60 * 1000;

/**
 * Issues a fresh invite link for a user, retiring any earlier unused links.
 * Call only for a user who has no password yet (a pending invite); never
 * generate one for an account that is already active, or the owner could take
 * it over.
 */
export async function issueInviteUrl(userId: string, role: 'seller' | 'buyer' | 'admin'): Promise<string> {
  const token = generateToken();
  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } }),
    prisma.passwordResetToken.create({
      data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + INVITE_TTL_MS) },
    }),
  ]);
  const origin = await getRequestOrigin();
  return `${origin}/reset-password?token=${token}&role=${role}`;
}
