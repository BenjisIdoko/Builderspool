'use server';

import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { generateToken, hashToken } from '@/lib/auth/tokens';
import { sendPasswordResetEmail } from '@/lib/email/send';
import { getRequestOrigin } from '@/lib/http/origin';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function requiredText(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing ${key}.`);
  }
  return value.trim();
}

// Always returns the same generic message regardless of whether the email
// matched a real account — revealing "no account with that email" would let
// an attacker enumerate registered addresses. The real work (or lack of it)
// happens silently behind that identical response.
export async function requestPasswordReset(formData: FormData): Promise<{ message: string } | { error: string }> {
  try {
    const email = requiredText(formData, 'email').toLowerCase();
    const genericMessage = { message: 'If an account exists with that email, we’ve sent a reset link.' };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) return genericMessage;

    const token = generateToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const origin = await getRequestOrigin();
    const resetUrl = `${origin}/reset-password?token=${token}`;
    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (err) {
      // Sending failed (e.g. RESEND_API_KEY not configured yet) — still
      // return the generic success message so this endpoint's response
      // never confirms account existence, but log it so it's not silent.
      console.error('sendPasswordResetEmail failed:', err);
    }

    return genericMessage;
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not process that request.' };
  }
}

export async function resetPassword(formData: FormData): Promise<{ error: string } | { success: true }> {
  try {
    const token = requiredText(formData, 'token');
    const password = requiredText(formData, 'password');
    const confirmPassword = requiredText(formData, 'confirmPassword');

    if (password.length < 8) throw new Error('Password must be at least 8 characters.');
    if (password !== confirmPassword) throw new Error('Passwords do not match.');

    const tokenHash = hashToken(token);
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new Error('This reset link is invalid or has expired. Request a new one.');
    }

    const passwordHash = await hashPassword(password);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      // Defense in depth — any other outstanding reset link for this user
      // (e.g. requested twice) stops working the moment one is used.
      prisma.passwordResetToken.updateMany({
        where: { userId: record.userId, usedAt: null, id: { not: record.id } },
        data: { usedAt: new Date() },
      }),
    ]);

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not reset your password.' };
  }
}
