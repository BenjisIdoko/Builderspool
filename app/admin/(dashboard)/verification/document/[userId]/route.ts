import { NextResponse } from 'next/server';
import { isAdminSignedIn } from '@/lib/admin/session';
import { prisma } from '@/lib/prisma';
import { createKycDocumentSignedUrl } from '@/lib/storage/kycDocuments';

// The KYC bucket is private; an admin opens a document through a 60-second
// signed link minted here. Route handlers aren't covered by the dashboard
// layout's redirect, so the admin session is checked explicitly.
export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  if (!(await isAdminSignedIn())) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const { userId } = await params;
  const profile = await prisma.sellerProfile.findUnique({ where: { userId }, select: { documentPath: true } });
  if (!profile?.documentPath) {
    return NextResponse.json({ error: 'No document on file.' }, { status: 404 });
  }

  try {
    const url = await createKycDocumentSignedUrl(profile.documentPath, 60);
    return NextResponse.redirect(url, { status: 302, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('KYC document signed URL failed:', error);
    return NextResponse.json({ error: 'Could not open that document.' }, { status: 502 });
  }
}
