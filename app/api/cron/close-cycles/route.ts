import { NextRequest, NextResponse } from 'next/server';
import { closeAndProcessCycles } from '@/lib/bidding';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

async function handleCron(request: NextRequest) {
  try {
    // Optional secret verification for Vercel Cron or custom trigger
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const urlSecret = request.nextUrl.searchParams.get('secret');
      if (urlSecret !== cronSecret) {
        return NextResponse.json(
          { error: 'Unauthorized cron execution' },
          { status: 401 }
        );
      }
    }

    const result = await closeAndProcessCycles();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        lockedCyclesCount: result.lockedCyclesCount,
        resolvedCyclesCount: result.resolvedCycles.length,
        resolvedCycles: result.resolvedCycles,
      },
    });
  } catch (error: any) {
    console.error('Error executing close-cycles cron job:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to close and process demand cycles',
      },
      { status: 500 }
    );
  }
}
