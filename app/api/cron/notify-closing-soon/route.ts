import { NextRequest, NextResponse } from 'next/server';
import { notifyCyclesClosingSoon } from '@/lib/bidding';
import { errorMessage } from '@/lib/errors';
import { verifyCronRequest } from '@/lib/cron/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

async function handleCron(request: NextRequest) {
  try {
    if (!verifyCronRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized cron execution' }, { status: 401 });
    }

    const result = await notifyCyclesClosingSoon();

    return NextResponse.json({ success: true, timestamp: new Date().toISOString(), ...result });
  } catch (error: unknown) {
    console.error('Error executing notify-closing-soon cron job:', error);
    return NextResponse.json(
      { success: false, error: errorMessage(error, 'Failed to notify sellers of closing cycles') },
      { status: 500 }
    );
  }
}
