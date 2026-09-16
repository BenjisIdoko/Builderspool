import { NextRequest, NextResponse } from 'next/server';
import { searchMaterialsLive } from '@/lib/queries/materials';

// Backs the navbar's live search dropdown (components/header-search.tsx).
// GET so the client can use a plain debounced fetch + AbortController for
// cheap request cancellation as the user keeps typing.
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') ?? '';
  const results = await searchMaterialsLive(query);
  return NextResponse.json({ results });
}
