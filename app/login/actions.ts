'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { assertNotRateLimited, recordLoginAttempt } from '@/lib/auth/rateLimit';
import { sendVerificationForNewUser } from '@/lib/auth/emailVerification';
import { BUYER_COOKIE } from '@/lib/buyer/session';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days, used only when "remember me" is checked

function requiredText(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing ${key}.`);
  }
  return value.trim();
}

// Errors are caught and returned as plain data (not thrown across the
// server/client boundary) — Next.js redacts a thrown Server Action error's
// message in production builds, replacing it with a generic digest-only
// message on the client. Returning { error } instead sidesteps that
// entirely, since it's just normal serializable data, not an exception.
export async function signInBuyer(formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const email = requiredText(formData, 'email').toLowerCase();
    const password = requiredText(formData, 'password');
    const remember = formData.get('remember') === 'on';

    await assertNotRateLimited(email);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== Role.BUYER || !user.passwordHash) {
      await recordLoginAttempt(email, false);
      throw new Error('No buyer account matches that email and password.');
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      await recordLoginAttempt(email, false);
      throw new Error('No buyer account matches that email and password.');
    }
    await recordLoginAttempt(email, true);

    const store = await cookies();
    store.set(BUYER_COOKIE, user.id, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: remember ? SESSION_MAX_AGE : undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not sign in.' };
  }
}

export async function signUpBuyer(formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const name = requiredText(formData, 'name');
    const email = requiredText(formData, 'email').toLowerCase();
    const password = requiredText(formData, 'password');
    const confirmPassword = requiredText(formData, 'confirmPassword');
    const phoneRaw = formData.get('phone');
    const businessNameRaw = formData.get('businessName');
    const locationRaw = formData.get('location');

    if (!EMAIL_RE.test(email)) throw new Error('Enter a valid email address.');
    if (password.length < 8) throw new Error('Password must be at least 8 characters.');
    if (password !== confirmPassword) throw new Error('Passwords do not match.');

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error('An account with that email already exists.');

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        role: Role.BUYER,
        name,
        email,
        passwordHash,
        phone: typeof phoneRaw === 'string' && phoneRaw.trim() ? phoneRaw.trim() : null,
        businessName: typeof businessNameRaw === 'string' && businessNameRaw.trim() ? businessNameRaw.trim() : null,
        location: typeof locationRaw === 'string' && locationRaw.trim() ? locationRaw.trim() : null,
      },
    });
    await sendVerificationForNewUser(user.id, user.email);

    const store = await cookies();
    store.set(BUYER_COOKIE, user.id, { httpOnly: true, sameSite: 'lax', path: '/' });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not create your account.' };
  }
}

export async function signOutBuyer() {
  const store = await cookies();
  store.delete(BUYER_COOKIE);
  redirect('/');
}
