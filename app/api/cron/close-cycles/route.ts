import { NextRequest, NextResponse } from 'next/server';
import { closeDueCycles } from '@/lib/bidding';
import { errorMessage } from '@/lib/errors';

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

    const reports = await closeDueCycles();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        closedCyclesCount: reports.length,
        cyclesNeedingAttention: reports.filter((r) => r.needsAttention).length,
        reports,
      },
    });
  } catch (error: unknown) {
    console.error('Error executing close-cycles cron job:', error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage(error, 'Failed to close and process demand cycles'),
      },
      { status: 500 }
    );
  }
}
