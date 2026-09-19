'use server';

import { prisma } from '@/lib/prisma';
import { generateToken, hashToken } from '@/lib/auth/tokens';
import { sendVerificationEmail } from '@/lib/email/send';
import { getRequestOrigin } from '@/lib/http/origin';
import { getBuyerIdFromSession } from '@/lib/buyer/session';
import { getSellerIdFromSession } from '@/lib/seller/session';

const VERIFICATION_TOKEN_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

// Issuing the token always succeeds (it's just a DB write); sending the
// email is the part that can fail (e.g. RESEND_API_KEY not configured yet)
// and is caught separately by each caller — neither caller should surface
// that internal config error as the user-facing result.
async function issueAndSendVerification(userId: string, email: string): Promise<void> {
  const token = generateToken();
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    },
  });

  const origin = await getRequestOrigin();
  await sendVerificationEmail(email, `${origin}/verify-email?token=${token}`);
}

// Called right after signup. Fire-and-forget by design — a hiccup sending
// this email should never fail account creation itself; verification is
// non-blocking everywhere else in the app for the same reason.
export async function sendVerificationForNewUser(userId: string, email: string): Promise<void> {
  try {
    await issueAndSendVerification(userId, email);
  } catch (err) {
    console.error('sendVerificationForNewUser failed:', err);
  }
}

export async function verifyEmailToken(token: string): Promise<{ success: true } | { error: string }> {
  try {
    const tokenHash = hashToken(token);
    const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new Error('This verification link is invalid or has expired.');
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }),
      prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not verify that link.' };
  }
}

// Used by the dismissible banner's "resend" link — works for whichever of
// buyer/seller is currently signed in, since both share the same User row
// and verification model.
export async function resendVerificationEmailAction(): Promise<{ message: string } | { error: string }> {
  try {
    const buyerId = await getBuyerIdFromSession();
    const sellerId = await getSellerIdFromSession();
    const userId = buyerId ?? sellerId;
    if (!userId) throw new Error('You must be signed in to resend a verification email.');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Account not found.');
    if (user.emailVerifiedAt) return { message: 'Your email is already verified.' };

    try {
      await issueAndSendVerification(user.id, user.email);
    } catch (err) {
      console.error('resendVerificationEmailAction failed:', err);
      return { error: "Couldn't send the verification email right now — try again shortly." };
    }
    return { message: 'Verification email sent — check your inbox.' };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not resend the verification email.' };
  }
}
