import { headers } from 'next/headers';

// Server Actions don't get a NextRequest, so the origin has to be rebuilt
// from the incoming request headers instead of request.nextUrl.
export async function getRequestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}
