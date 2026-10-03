import crypto from 'node:crypto';
import type { NextRequest } from 'next/server';

// Fails closed: an unset CRON_SECRET rejects every request rather than
// silently letting all of them through. Accepts only the Authorization
// header (Vercel Cron sends `Bearer $CRON_SECRET` itself) — never a query
// parameter, which would end up in access logs and referrers — and compares
// in constant time.
export function verifyCronRequest(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const provided = Buffer.from(request.headers.get('authorization') ?? '');
  const expected = Buffer.from(`Bearer ${cronSecret}`);
  return provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
}
