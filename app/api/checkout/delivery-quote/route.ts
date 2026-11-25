import { NextRequest, NextResponse } from 'next/server';
import { getCurrentBuyer } from '@/lib/buyer/auth';
import { isInNigeria } from '@/lib/delivery/distance';
import { quoteDelivery, type QuoteLine } from '@/lib/delivery/quote';

const MAX_LINES = 100;
const MAX_QUANTITY = 100_000;

// The delivery fee for this cart at this site. The checkout shows it; createOrder works it out again from the same
// inputs, so what is charged never rests on this response.
export async function POST(request: NextRequest) {
  if (!(await getCurrentBuyer())) return NextResponse.json({ error: 'Log in to check out.' }, { status: 401 });

  let body: { lat?: unknown; lng?: unknown; items?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Send the site and the items.' }, { status: 400 });
  }

  const lat = body.lat;
  const lng = body.lng;
  if (typeof lat !== 'number' || typeof lng !== 'number' || !isInNigeria({ lat, lng })) {
    return NextResponse.json({ error: 'Choose a site in Nigeria.' }, { status: 400 });
  }
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > MAX_LINES) {
    return NextResponse.json({ error: 'Send the items in your cart.' }, { status: 400 });
  }
  const lines: QuoteLine[] = [];
  for (const raw of body.items as { materialId?: unknown; quantity?: unknown }[]) {
    if (typeof raw?.materialId !== 'string' || !Number.isInteger(raw.quantity) || (raw.quantity as number) < 1 || (raw.quantity as number) > MAX_QUANTITY) {
      return NextResponse.json({ error: 'One of the items is not valid.' }, { status: 400 });
    }
    lines.push({ materialId: raw.materialId, quantity: raw.quantity as number });
  }

  const result = await quoteDelivery(lines, { lat, lng });
  if (!result.ok) {
    // The reason is for the checkout to choose its wording; the detail stays on the server.
    return NextResponse.json({ ok: false, reason: result.reason });
  }
  const q = result.quote;
  return NextResponse.json({
    ok: true,
    fee: q.fee,
    distanceKm: q.distanceKm,
    centreName: q.centreName,
    totalKg: q.totalKg,
    trips: q.trips.map((t) => t.vehicleName),
  });
}
