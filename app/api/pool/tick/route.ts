import { NextResponse } from 'next/server';
import { advanceIfDue } from '@/lib/bidding';
import { errorMessage } from '@/lib/errors';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// The pooling clock. A per-minute external trigger (a Supabase pg_cron job) calls this so
// bids close, offers expire and sheets settle on time even when nobody has a page open.
//
// It takes no input and returns nothing about the data. All it can do is run steps whose
// deadline has already passed, and every step is a compare-and-swap, so calling it
// repeatedly, or from anywhere, is harmless: the same thing any seller or admin page load
// already does. A short per-instance guard stops a flood from turning into a flood of queries.
let lastRun = 0;

async function tick() {
  const now = Date.now();
  if (now - lastRun < 10_000) return NextResponse.json({ ok: true, skipped: true });
  lastRun = now;
  try {
    return NextResponse.json({ ok: true, advanced: await advanceIfDue() });
  } catch (error: unknown) {
    console.error('Pool tick failed:', error);
    return NextResponse.json({ ok: false, error: errorMessage(error, 'Tick failed') }, { status: 500 });
  }
}

export const GET = tick;
export const POST = tick;
