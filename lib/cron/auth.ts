import type { NextRequest } from 'next/server';

// Fails closed: an unset CRON_SECRET rejects every request rather than
// silently letting all of them through. The previous version treated a
// missing secret as "auth not required," which meant both cron endpoints
// were completely unauthenticated in production for as long as the env var
// was never configured.
export function verifyCronRequest(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${cronSecret}`) return true;

  const urlSecret = request.nextUrl.searchParams.get('secret');
  return urlSecret === cronSecret;
}
