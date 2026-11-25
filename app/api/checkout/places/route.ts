import { NextRequest, NextResponse } from 'next/server';
import { getCurrentBuyer } from '@/lib/buyer/auth';
import { autocompletePlaces, isValidPlaceId, placeSite } from '@/lib/delivery/places';

// Address search for the checkout. Signed-in buyers only, so the Google key cannot be used by strangers.
//   GET ?q=...&s=<session>  -> suggestions
//   GET ?id=...&s=<session> -> the chosen place's coordinates
export async function GET(request: NextRequest) {
  if (!(await getCurrentBuyer())) return NextResponse.json({ error: 'Log in to check out.' }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const session = params.get('s');
  const id = params.get('id');
  if (id !== null) {
    if (!isValidPlaceId(id)) return NextResponse.json({ error: 'Not a valid place.' }, { status: 400 });
    const site = await placeSite(id, session);
    return site ? NextResponse.json({ site }) : NextResponse.json({ error: 'We could not find that place.' }, { status: 404 });
  }

  const suggestions = await autocompletePlaces(params.get('q') ?? '', session);
  if (suggestions === null) return NextResponse.json({ error: 'Address search is unavailable.' }, { status: 503 });
  return NextResponse.json({ suggestions });
}
