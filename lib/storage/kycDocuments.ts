import crypto from 'node:crypto';

const BUCKET = 'kyc-documents';

// Vercel caps a serverless request body at 4.5MB, so a Server Action upload
// can't safely exceed this regardless of what the storage bucket allows.
export const MAX_KYC_DOCUMENT_BYTES = 4 * 1024 * 1024;

function getConfig(): { baseUrl: string; serviceKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set — document upload is not configured yet.');
  }
  return { baseUrl: `${url.replace(/\/$/, '')}/storage/v1`, serviceKey };
}

// Content type comes from the file's own bytes, never the client-supplied
// Content-Type or extension — a renamed script can't pass as a PDF/image.
function detectType(bytes: Uint8Array): { contentType: string; ext: string } | null {
  const starts = (sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (starts([0x25, 0x50, 0x44, 0x46])) return { contentType: 'application/pdf', ext: 'pdf' };
  if (starts([0xff, 0xd8, 0xff])) return { contentType: 'image/jpeg', ext: 'jpg' };
  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { contentType: 'image/png', ext: 'png' };
  return null;
}

export interface StoredKycDocument {
  path: string;
  displayName: string;
}

// Stores a seller's KYC document in a private bucket under a random,
// server-generated path. The original filename is kept only as display text.
export async function uploadKycDocument(sellerId: string, file: File): Promise<StoredKycDocument> {
  if (file.size === 0) throw new Error('The selected file is empty.');
  if (file.size > MAX_KYC_DOCUMENT_BYTES) throw new Error('Document must be 4 MB or smaller.');

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectType(bytes);
  if (!detected) throw new Error('Document must be a PDF, JPEG or PNG file.');

  const { baseUrl, serviceKey } = getConfig();
  const path = `${sellerId}/${crypto.randomUUID()}.${detected.ext}`;

  const res = await fetch(`${baseUrl}/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': detected.contentType,
      'x-upsert': 'false',
    },
    body: bytes,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Document upload failed (${res.status}).`);
  }

  const displayName = file.name.replace(/[^\w.\- ()]/g, '_').slice(0, 120) || `document.${detected.ext}`;
  return { path, displayName };
}

export async function deleteKycDocument(path: string): Promise<void> {
  const { baseUrl, serviceKey } = getConfig();
  await fetch(`${baseUrl}/object/${BUCKET}/${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${serviceKey}` },
  }).catch(() => {});
}

// Short-lived signed link — the bucket is private, so a document is only
// ever reachable through one of these, minted for an authenticated admin.
export async function createKycDocumentSignedUrl(path: string, expiresInSeconds = 60): Promise<string> {
  const { baseUrl, serviceKey } = getConfig();
  const res = await fetch(`${baseUrl}/object/sign/${BUCKET}/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn: expiresInSeconds }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.signedURL) throw new Error(body.message ?? 'Could not open that document.');
  return `${baseUrl}${body.signedURL}`;
}
