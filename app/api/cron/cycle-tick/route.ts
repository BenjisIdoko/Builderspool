import { NextRequest, NextResponse } from 'next/server';
import { advanceCycles } from '@/lib/bidding';
import { errorMessage } from '@/lib/errors';
import { verifyCronRequest } from '@/lib/cron/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handleTick(request);
}

export async function POST(request: NextRequest) {
  return handleTick(request);
}

// Advances every cycle whose deadline has passed (freeze -> award -> expire unaccepted awards -> fallback). Idempotent
// and safe to call as often as the host allows.
async function handleTick(request: NextRequest) {
  try {
    if (!verifyCronRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized cron execution' }, { status: 401 });
    }

    const report = await advanceCycles();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        cyclesFrozen: report.frozen.length,
        cyclesAwarded: report.awarded.length,
        awardsExpired: report.expiredAwards,
        cyclesFallbackProcessed: report.fallbacks.length,
        cyclesNeedingAttention: report.awarded.filter((r) => r.needsAttention).length,
        reports: report.awarded,
      },
    });
  } catch (error: unknown) {
    console.error('Error executing cycle tick:', error);
    return NextResponse.json(
      { success: false, error: errorMessage(error, 'Failed to advance demand cycles') },
      { status: 500 }
    );
  }
}
