import crypto from 'node:crypto';

export const OTP_TTL_MS = 10 * 60 * 1000; // a code works for 10 minutes
export const OTP_MAX_ATTEMPTS = 5; // wrong guesses before the request is cancelled
export const OTP_MAX_SENDS = 3; // codes per request, the first one included
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

/** A six-digit code, drawn with a cryptographic random number generator. */
export function generateOtp(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

// The code is bound to its request, so a code from one request never opens another. Only this
// hash is stored.
export function hashOtp(requestId: string, code: string): string {
  return crypto.createHash('sha256').update(`${requestId}:${code}`).digest('hex');
}

export function otpMatches(requestId: string, code: string, storedHash: string | null): boolean {
  if (!storedHash || !/^\d{6}$/.test(code)) return false;
  const a = Buffer.from(hashOtp(requestId, code), 'hex');
  const b = Buffer.from(storedHash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
